'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { Prisma } from '@prisma/client';
import { writeProductAuditLog } from './product-enterprise-actions';

import slugify from 'slugify';

// Slugify utility (Unicode-safe for Bangla/Arabic)
function buildSlug(name: string): string {
  const baseSlug = slugify(name, {
    replacement: '-',
    remove: undefined,
    lower: true,
    strict: false, // Keep unicode chars
    locale: 'vi',
    trim: true,
  });

  return baseSlug + '-' + Date.now().toString(36);
}

// Map lifecycle status to isActive removed

/**
 * Create a product using a JSON payload (new V3 form).
 */
export async function createProductJSON(payload: {
  name: string;
  categoryId: string;
  brandId?: string;
  model?: string;
  unit?: string;
  warrantyMonths?: number;
  warrantyType?: string;
  productVariantType?: string;
  status?: string;
  tags?: string[];
  price: number;
  offerPrice?: number | null;
  onlinePrice?: number | null;
  wholesalePrice?: number | null;
  taxClass?: string | null;
  costPrice?: number;
  sku?: string;
  barcode?: string;
  trackInventory?: boolean;
  trackSerials?: boolean;
  trackExpiry?: boolean;
  trackBatch?: boolean;
  trackWarranty?: boolean;
  minStock?: number;
  reorderPoint?: number;
  safetyStock?: number;
  reorderQty?: number;
  leadTimeDays?: number;
  isActive?: boolean;
  isFlashSale?: boolean;
  isFeatured?: boolean;
  isBestSeller?: boolean;
  description?: string;
  shortDesc?: string;
  videoUrl?: string;
  seoTitle?: string;
  metaDescription?: string;
  slug?: string;
  images?: { id: string; url: string; isThumbnail: boolean; alt?: string | null }[];
  variants?: any[];
  attributes?: any[];
  productSpecs?: { key: string; value: string }[];
  faqs?: { question: string; answer: string }[];
}) {
  try {
    const status = payload.status || 'DRAFT';
    const slug = payload.slug?.trim() || buildSlug(payload.name);

    const product = await prisma.$transaction(async (tx) => {
      const newProduct = await tx.product.create({
        data: {
          name: payload.name,
          slug,
          categoryId: payload.categoryId,
          brandId: payload.brandId || null,
          productVariantType: payload.productVariantType || 'simple',
          type: 'PHYSICAL',
          price: payload.price || 0,
          offerPrice: payload.offerPrice || null,
          onlinePrice: payload.onlinePrice || null,
          wholesalePrice: payload.wholesalePrice || null,
          taxClass: payload.taxClass || null,
          costPrice: payload.costPrice || 0,
          stock: 0, // Stock comes from Purchase Module
          trackInventory: payload.trackInventory ?? true,
          trackSerials: payload.trackSerials ?? false,
          trackExpiry: payload.trackExpiry ?? false,
          trackBatch: payload.trackBatch ?? false,
          trackWarranty: payload.trackWarranty ?? false,
          minStock: payload.minStock ?? 5,
          reorderPoint: payload.reorderPoint ?? 10,
          description: payload.description || '',
          shortDesc: payload.shortDesc || null,
          isFlashSale: payload.isFlashSale ?? false,
          isFeatured: payload.isFeatured ?? false,
          isBestSeller: payload.isBestSeller ?? false,
          unit: payload.unit || 'pc',
          warrantyMonths: payload.warrantyMonths || 0,
          warrantyType: payload.warrantyType || null,
          videoUrl: payload.videoUrl || null,
          model: payload.model || null,
          sku: payload.sku?.trim() || null,
          barcode: payload.barcode?.trim() || null,
          seoTitle: payload.seoTitle || null,
          metaDescription: payload.metaDescription || null,
          tags: payload.tags || [],
          faqs: payload.faqs ? (payload.faqs as any) : Prisma.JsonNull,
          specifications: (payload.attributes?.length
            ? payload.attributes.reduce((acc: any, a: any) => {
              acc[a.name] = (a.values || []).map((v: any) => v.label || v.value).join(', ');
              return acc;
            }, {})
            : Prisma.JsonNull),
          attributes: payload.attributes ? payload.attributes : Prisma.JsonNull,
          images: [],
          // V3 fields
          status: status as any,
        } as any,
      });

      // Images
      if (payload.images && payload.images.length > 0) {
        const imageInserts = payload.images.map((img, i) =>
          `(gen_random_uuid()::text, '${newProduct.id}', '${img.url.replace(/'/g, "''")}', ${img.isThumbnail}, ${i}, NOW(), ${img.alt ? `'${img.alt.replace(/'/g, "''")}'` : 'NULL'})`
        ).join(',');
        await tx.$executeRawUnsafe(`
          INSERT INTO "product_images" ("id", "product_id", "url", "is_thumbnail", "display_order", "updatedAt", "alt_text")
          VALUES ${imageInserts}
        `);
      }

      // Specs
      if (payload.productSpecs && payload.productSpecs.length > 0) {
        const valid = payload.productSpecs.filter(s => s.key && s.value);
        if (valid.length > 0) {
          const specInserts = valid.map(s =>
            `(gen_random_uuid(), '${newProduct.id}', '${s.key.replace(/'/g, "''")}', '${s.value.replace(/'/g, "''")}')`
          ).join(',');
          await tx.$executeRawUnsafe(`
            INSERT INTO "product_specs" ("id", "product_id", "name", "value")
            VALUES ${specInserts}
          `);
        }
      }

      // Product Attributes (Relational)
      if (payload.attributes && payload.attributes.length > 0) {
        for (const attr of payload.attributes) {
          if (attr.attributeId) {
            const pa = await tx.productAttribute.create({
              data: {
                productId: newProduct.id,
                attributeId: attr.attributeId,
              }
            });
            if (attr.values && attr.values.length > 0) {
              await tx.productAttributeValue.createMany({
                data: attr.values.map((v: any) => ({
                  productAttributeId: pa.id,
                  attributeValueId: v.id
                }))
              });
            }
          }
        }
      }

      // Variants
      if (payload.variants && payload.variants.length > 0) {
        for (const v of payload.variants) {
          let finalAttributes: any = v.attributes || {};
          if (v.customColor) {
            finalAttributes._customColor = v.customColor;
          }

          const variant = await tx.variant.create({
            data: {
              productId: newProduct.id,
              name: v.name || 'Default',
              sku: v.sku || null,
              upc: v.barcode || v.upc || null,
              price: v.price || payload.price || 0,
              costPrice: v.costPrice || payload.costPrice || 0,
              offerPrice: v.offerPrice || null,
              stock: 0, // Stock comes from Purchase Module
              hasSerial: false,
              image: v.image || null,
              imageAlt: v.imageAlt || null,
              attributes: Object.keys(finalAttributes).length > 0 ? finalAttributes : Prisma.JsonNull,
            },
          });

          if (v.attributeValueIds && v.attributeValueIds.length > 0) {
            const validValIds = v.attributeValueIds.filter((id: string) => id && id.length === 36);
            if (validValIds.length > 0) {
              await tx.variantAttributeValue.createMany({
                data: validValIds.map((valId: string) => ({
                  variantId: variant.id,
                  attributeValueId: valId,
                }))
              });
            }
          }
        }
      }

      return newProduct;
    }, { maxWait: 10000, timeout: 30000 });

    // Write audit log (non-blocking)
    writeProductAuditLog(product.id, 'created', 'admin', undefined, `Product "${product.name}" created with status ${status}`);

    revalidatePath('/admin/products');
    return { success: true, product, productId: product.id };
  } catch (error: any) {
    console.error('createProductJSON error:', error);
    return { success: false, error: error?.message || 'Failed to create product' };
  }
}

/**
 * Update a product using a JSON payload (new V3 form).
 */
export async function updateProductJSON(
  id: string,
  payload: Parameters<typeof createProductJSON>[0]
) {
  try {
    const status = payload.status || 'DRAFT';

    const current = await prisma.product.findUnique({
      where: { id },
      select: { status: true, name: true, sku: true },
    });

    const product = await prisma.$transaction(async (tx) => {
      const updated = await tx.product.update({
        where: { id },
        data: {
          name: payload.name,
          categoryId: payload.categoryId,
          brandId: payload.brandId || null,
          productVariantType: payload.productVariantType || 'simple',
          price: payload.price || 0,
          offerPrice: payload.offerPrice || null,
          onlinePrice: payload.onlinePrice || null,
          wholesalePrice: payload.wholesalePrice || null,
          taxClass: payload.taxClass || null,
          // costPrice intentionally NOT updated here (managed by Purchase Module)
          trackInventory: payload.trackInventory ?? true,
          trackSerials: payload.trackSerials ?? false,
          trackExpiry: payload.trackExpiry ?? false,
          trackBatch: payload.trackBatch ?? false,
          trackWarranty: payload.trackWarranty ?? false,
          minStock: payload.minStock ?? 5,
          reorderPoint: payload.reorderPoint ?? 10,
          description: payload.description || '',
          shortDesc: payload.shortDesc || null,
          isFlashSale: payload.isFlashSale ?? false,
          isFeatured: payload.isFeatured ?? false,
          isBestSeller: payload.isBestSeller ?? false,
          unit: payload.unit || 'pc',
          warrantyMonths: payload.warrantyMonths || 0,
          warrantyType: payload.warrantyType || null,
          videoUrl: payload.videoUrl || null,
          model: payload.model || null,
          sku: payload.sku?.trim() || null,
          barcode: payload.barcode?.trim() || null,
          seoTitle: payload.seoTitle || null,
          metaDescription: payload.metaDescription || null,
          tags: payload.tags || [],
          faqs: payload.faqs ? (payload.faqs as any) : Prisma.JsonNull,
          ...(payload.slug ? { slug: payload.slug } : {}),
          attributes: payload.attributes ? payload.attributes : Prisma.JsonNull,
          // V3 fields
          status: status as any,
        } as any,
      });

      // Product Attributes (Relational)
      await tx.productAttributeValue.deleteMany({ where: { productAttribute: { productId: id } } });
      await tx.productAttribute.deleteMany({ where: { productId: id } });

      if (payload.attributes && payload.attributes.length > 0) {
        for (const attr of payload.attributes) {
          if (attr.attributeId) {
            const pa = await tx.productAttribute.create({
              data: {
                productId: id,
                attributeId: attr.attributeId,
              }
            });
            if (attr.values && attr.values.length > 0) {
              await tx.productAttributeValue.createMany({
                data: attr.values.map((v: any) => ({
                  productAttributeId: pa.id,
                  attributeValueId: v.id
                }))
              });
            }
          }
        }
      }

      // Variants Update
      if (payload.variants !== undefined) {
        const payloadVariants = payload.variants || [];
        const payloadVariantIds = payloadVariants
          .map((v: any) => v.id)
          .filter((id: string) => id && id.length === 36);

        // Find existing variants
        const existingVariants = await tx.variant.findMany({ where: { productId: id } });
        const existingIds = existingVariants.map(v => v.id);

        const idsToDelete = existingIds.filter(vId => !payloadVariantIds.includes(vId));

        // Delete removed variants
        if (idsToDelete.length > 0) {
          await tx.variantAttributeValue.deleteMany({ where: { variantId: { in: idsToDelete } } });
          await tx.productSerial.deleteMany({ where: { variantId: { in: idsToDelete } } });
          try {
            await tx.variant.deleteMany({ where: { id: { in: idsToDelete } } });
          } catch (e) {
            console.error("Could not delete variants (likely foreign key constraints):", e);
          }
        }

        if (payloadVariants.length > 0) {
          for (const v of payloadVariants) {
            let finalAttributes: any = v.attributes || {};
            if (v.customColor) {
              finalAttributes._customColor = v.customColor;
            }

            const isExisting = v.id && v.id.length === 36;
            let variantId = v.id;

            if (isExisting && existingIds.includes(v.id)) {
              // Update existing variant
              await tx.variant.update({
                where: { id: v.id },
                data: {
                  name: v.name || 'Default',
                  sku: v.sku || null,
                  upc: v.barcode || v.upc || null,
                  price: v.price || payload.price || 0,
                  costPrice: v.costPrice || payload.costPrice || 0,
                  offerPrice: v.offerPrice || null,
                  image: v.image || null,
                  imageAlt: v.imageAlt || null,
                  attributes: Object.keys(finalAttributes).length > 0 ? finalAttributes : Prisma.JsonNull,
                },
              });
              
              // Clear old attribute values
              await tx.variantAttributeValue.deleteMany({ where: { variantId: v.id } });
            } else {
              // Create new variant
              const newVariant = await tx.variant.create({
                data: {
                  productId: id,
                  name: v.name || 'Default',
                  sku: v.sku || null,
                  upc: v.barcode || v.upc || null,
                  price: v.price || payload.price || 0,
                  costPrice: v.costPrice || payload.costPrice || 0,
                  offerPrice: v.offerPrice || null,
                  stock: 0,
                  hasSerial: false,
                  image: v.image || null,
                  imageAlt: v.imageAlt || null,
                  attributes: Object.keys(finalAttributes).length > 0 ? finalAttributes : Prisma.JsonNull,
                },
              });
              variantId = newVariant.id;
            }

            // Assign attribute values
            if (v.attributeValueIds && v.attributeValueIds.length > 0) {
              const validValIds = v.attributeValueIds.filter((aid: string) => aid && aid.length === 36);
              if (validValIds.length > 0) {
                await tx.variantAttributeValue.createMany({
                  data: validValIds.map((valId: string) => ({
                    variantId: variantId,
                    attributeValueId: valId,
                  }))
                });
              }
            }
          }
        }
      }

      // Refresh images
      if (payload.images !== undefined) {
        await tx.$executeRaw`DELETE FROM "product_images" WHERE "product_id" = ${id}`;
        if (payload.images.length > 0) {
          const imageInserts = payload.images.map((img, i) =>
            `(gen_random_uuid()::text, '${id}', '${img.url.replace(/'/g, "''")}', ${img.isThumbnail}, ${i}, NOW(), ${img.alt ? `'${img.alt.replace(/'/g, "''")}'` : 'NULL'})`
          ).join(',');
          await tx.$executeRawUnsafe(`
            INSERT INTO "product_images" ("id", "product_id", "url", "is_thumbnail", "display_order", "updatedAt", "alt_text")
            VALUES ${imageInserts}
          `);
        }
      }

      // Refresh specs
      if (payload.productSpecs !== undefined) {
        await tx.$executeRaw`DELETE FROM "product_specs" WHERE "product_id" = ${id}`;
        const valid = payload.productSpecs.filter(s => s.key && s.value);
        if (valid.length > 0) {
          const specInserts = valid.map(s =>
            `(gen_random_uuid(), '${id}', '${s.key.replace(/'/g, "''")}', '${s.value.replace(/'/g, "''")}')`
          ).join(',');
          await tx.$executeRawUnsafe(`
            INSERT INTO "product_specs" ("id", "product_id", "name", "value")
            VALUES ${specInserts}
          `);
        }
      }

      return updated;
    }, { maxWait: 10000, timeout: 30000 });

    // Build changed fields for audit log
    const changedFields: Record<string, any> = {};
    if (current) {
      if ((current as any).status !== status) changedFields.status = { from: (current as any).status, to: status };
      if (current.name !== payload.name) changedFields.name = { from: current.name, to: payload.name };
      if (current.sku !== payload.sku) changedFields.sku = { from: current.sku, to: payload.sku };
    }

    writeProductAuditLog(
      id, 'updated', 'admin',
      Object.keys(changedFields).length > 0 ? changedFields : undefined,
      `Product "${payload.name}" updated`
    );

    revalidatePath('/admin/products');
    revalidatePath(`/admin/products/${id}`);

    // Revalidate public routes
    if (product?.slug) {
      revalidatePath(`/products/${product.slug}`);
    }
    revalidatePath('/products');
    revalidatePath('/');

    return { success: true, product };
  } catch (error: any) {
    console.error('updateProductJSON error:', error);
    return { success: false, error: error?.message || 'Failed to update product' };
  }
}
