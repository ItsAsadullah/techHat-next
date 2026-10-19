'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { Prisma } from '@prisma/client';
import { writeProductAuditLog } from './product-enterprise-actions';

/**
 * Duplicate a product with all its images, specs, and variants.
 * The duplicate is always created as DRAFT status.
 */
export async function duplicateProduct(
  productId: string
): Promise<{ success: boolean; newProductId?: string; error?: string }> {
  try {
    const source = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        productImages:     { orderBy: { displayOrder: 'asc' } },
        specs:             true,
        variants:          { include: { variantAttributes: true } },
        productAttributes: { include: { values: true } },
      },
    });

    if (!source) return { success: false, error: 'Product not found' };

    // Build a unique slug and name for the duplicate
    const timestamp   = Date.now().toString(36);
    const newName     = `Copy of ${source.name}`;
    const newSlug     = `${source.slug}-copy-${timestamp}`;

    // Build a unique SKU
    const newSku = source.sku ? `${source.sku}-COPY-${timestamp.toUpperCase()}` : null;

    const newProduct = await prisma.$transaction(async (tx) => {
      // Create the product record
      const created = await tx.product.create({
        data: {
          name:               newName,
          slug:               newSlug,
          categoryId:         source.categoryId,
          brandId:            source.brandId,
          vendorId:           source.vendorId,
          defaultWarehouseId: source.defaultWarehouseId,
          defaultSupplierId:  source.defaultSupplierId,
          productVariantType: source.productVariantType,
          type:               source.type,
          price:              source.price,
          offerPrice:         source.offerPrice,
          onlinePrice:        source.onlinePrice,
          wholesalePrice:     source.wholesalePrice,
          taxClass:           source.taxClass,
          costPrice:          source.costPrice,
          stock:              0, // Inventory Module owns stock
          trackInventory:     source.trackInventory,
          trackSerials:       source.trackSerials,
          trackExpiry:        source.trackExpiry,
          trackBatch:         source.trackBatch,
          trackWarranty:      source.trackWarranty,
          minStock:           source.minStock,
          maxStock:           source.maxStock,
          reorderPoint:       source.reorderPoint,
          description:        source.description,
          shortDesc:          source.shortDesc,
          isFlashSale:        false,
          isFeatured:         false,
          isBestSeller:       source.isBestSeller,
          unit:               source.unit,
          warrantyMonths:     source.warrantyMonths,
          warrantyType:       source.warrantyType,
          videoUrl:           source.videoUrl,
          model:              source.model,
          sku:                newSku,
          barcode:            null, // Must be regenerated — barcodes are unique
          specifications:     source.specifications ?? Prisma.JsonNull,
          attributes:         source.attributes   ?? Prisma.JsonNull,
          faqs:               source.faqs         ?? Prisma.JsonNull,
          advancedSeo:        source.advancedSeo  ?? Prisma.JsonNull,
          enrichmentData:     source.enrichmentData ?? Prisma.JsonNull,
          images:             source.images,
          status:             'DRAFT',
          tags:               source.tags,
          safetyStock:        source.safetyStock,
          reorderQty:         source.reorderQty,
          leadTimeDays:       source.leadTimeDays,
          seoTitle:           source.seoTitle ? `Copy of ${source.seoTitle}` : null,
          metaDescription:    source.metaDescription,
        } as any,
      });

      // Duplicate images
      if (source.productImages.length > 0) {
        await tx.productImage.createMany({
          data: source.productImages.map((img, i) => ({
            productId:    created.id,
            url:          img.url,
            publicId:     img.publicId,
            isThumbnail:  img.isThumbnail,
            displayOrder: i,
            altText:      img.altText,
          })),
        });
      }

      // Duplicate specs
      if (source.specs.length > 0) {
        await tx.productSpec.createMany({
          data: source.specs.map(s => ({
            productId: created.id,
            name:      s.name,
            value:     s.value,
          })),
        });
      }

      // Duplicate relational product attributes
      if (source.productAttributes.length > 0) {
        for (const pa of source.productAttributes) {
          const newPa = await tx.productAttribute.create({
            data: {
              productId:   created.id,
              attributeId: pa.attributeId,
            },
          });
          if (pa.values.length > 0) {
            await tx.productAttributeValue.createMany({
              data: pa.values.map(val => ({
                productAttributeId: newPa.id,
                attributeValueId:   val.attributeValueId,
              })),
            });
          }
        }
      }

      // Duplicate variants (without stock — Inventory Module owns that)
      if (source.variants.length > 0) {
        for (const [idx, v] of source.variants.entries()) {
          const newVariant = await tx.variant.create({
            data: {
              productId:  created.id,
              name:       v.name,
              sku:        v.sku ? `${v.sku}-COPY-${timestamp.toUpperCase()}-${idx + 1}` : null,
              upc:        null, // barcodes must be unique
              price:      v.price,
              costPrice:  v.costPrice,
              expense:    v.expense,
              offerPrice: v.offerPrice,
              stock:      0,
              minStock:   v.minStock,
              hasSerial:  false,
              image:      v.image,
              imageAlt:   v.imageAlt,
              attributes: v.attributes ?? Prisma.JsonNull,
            },
          });

          if (v.variantAttributes && v.variantAttributes.length > 0) {
            await tx.variantAttributeValue.createMany({
              data: v.variantAttributes.map(va => ({
                variantId:        newVariant.id,
                attributeValueId: va.attributeValueId,
              })),
            });
          }
        }
      }

      return created;
    });

    writeProductAuditLog(
      newProduct.id,
      'created',
      'admin',
      undefined,
      `Duplicated from product ${productId} ("${source.name}")`
    );

    revalidatePath('/admin/products');
    return { success: true, newProductId: newProduct.id };
  } catch (error: any) {
    console.error('duplicateProduct error:', error);
    return { success: false, error: error?.message || 'Failed to duplicate product' };
  }
}
