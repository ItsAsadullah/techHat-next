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
        productImages: { orderBy: { displayOrder: 'asc' } },
        specs:         true,
        variants:      true,
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
          reorderPoint:       source.reorderPoint,
          description:        source.description,
          shortDesc:          source.shortDesc,
          isActive: false, // DRAFT → not active
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

      // Duplicate variants (without stock — Inventory Module owns that)
      if (source.variants.length > 0) {
        for (const v of source.variants) {
          await tx.variant.create({
            data: {
              productId:  created.id,
              name:       v.name,
              sku:        v.sku ? `${v.sku}-COPY` : null,
              upc:        null, // barcodes must be unique
              price:      v.price,
              costPrice:  v.costPrice,
              offerPrice: v.offerPrice,
              stock:      0,
              hasSerial:  false,
              attributes: v.attributes ?? Prisma.JsonNull,
            },
          });
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
