'use server';

import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { uploadToCloudinary } from '@/lib/cloudinary';

// Helper to sanitize strings coming from forms (remove CR/LF and trim)
function sanitizeString(input?: string | null) {
  if (input === null || input === undefined) return input as any;
  try {
    return String(input).replace(/[\r\n]+/g, ' ').trim();
  } catch (e) {
    return String(input);
  }
}

export async function createProduct(formData: FormData) {
  try {
    const nameRaw = formData.get('name') as string;
    const categoryId = formData.get('categoryId') as string;
    const brandId = formData.get('brandId') as string;
    const productType = formData.get('productType') as string;
    const descriptionRaw = formData.get('description') as string;
    const isActive = formData.get('isActive') === 'true';
    const isFlashSale = formData.get('isFlashSale') === 'true';
    const unit = formData.get('unit') as string;
    const warrantyMonths = parseInt(formData.get('warrantyMonths') as string) || 0;
    const videoUrl = formData.get('videoUrl') as string;
    const skuRaw = formData.get('sku') as string;

    // Sanitize free-text fields
    const name = sanitizeString(nameRaw) || '';
    const description = sanitizeString(descriptionRaw) || '';
    const sku = sanitizeString(skuRaw) || '';

    // JSON Fields
    const rawSpecs = formData.get('specifications') as string;
    const rawAttributes = formData.get('attributes') as string;
    const rawVariations = formData.get('variations') as string;
    const rawGalleryMetadata = formData.get('gallery_metadata') as string;

    const specifications = rawSpecs ? JSON.parse(rawSpecs) : null;
    const attributes = rawAttributes ? JSON.parse(rawAttributes) : null;
    const variations = rawVariations ? JSON.parse(rawVariations) : [];
    const galleryMetadata = rawGalleryMetadata ? JSON.parse(rawGalleryMetadata) : [];

    // Auto-generate slug
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '') + '-' + Date.now();

    // Compute product-level derived values from variations
    // Sanitize variation fields
    for (const v of variations) {
      if (v.name) v.name = sanitizeString(v.name);
      if (v.sku) v.sku = sanitizeString(v.sku);
      if (v.upc) v.upc = sanitizeString(v.upc);
      if (v.serials && Array.isArray(v.serials)) v.serials = v.serials.map((s: string) => s && sanitizeString(s));
    }

    const firstVariation = variations[0] || {};
    const totalStock = variations.reduce((sum: number, v: any) => {
      if (v.hasSerial && v.serials) {
        return sum + v.serials.filter((s: string) => s && s.trim().length > 0).length;
      }
      return sum + (parseInt(v.stock) || 0);
    }, 0);
    const productBarcode = firstVariation.upc ? sanitizeString(firstVariation.upc) : null;
    // Upload all images in parallel instead of sequentially
    const uploadedImages = (await Promise.all(
        galleryMetadata.map(async (meta: any) => {
            let imageUrl = meta.url;
            if (meta.fileKey) {
                const imageFile = formData.get(meta.fileKey) as File | null;
                if (imageFile && imageFile.size > 0) {
                    try {
                        const arrayBuffer = await imageFile.arrayBuffer();
                        const buffer = Buffer.from(arrayBuffer);
                        imageUrl = await uploadToCloudinary(buffer, 'products/gallery');
                    } catch (e) {
                        console.error("Failed to upload gallery image", e);
                        throw new Error(`Image upload failed: ${e instanceof Error ? (e as any)?.message : 'Unknown error'}`);
                    }
                }
            }
            return imageUrl ? { id: meta.id, url: imageUrl, isThumbnail: meta.isThumbnail } : null;
        })
    )).filter((img): img is { id: string; url: string; isThumbnail: boolean } => img !== null);

    // ===== STEP 1.5: Validate serial numbers for duplicates =====
    const allSerials: string[] = [];
    const serialToVariationMap = new Map<string, string>(); // Maps serial to variation name
    
    for (const v of variations) {
        if (v.hasSerial && v.serials) {
            const variationName = v.name || 'Default';
            const variationSerials = v.serials.filter((s: string) => s && s.trim().length > 0);
            
            // Check for duplicates within the same variation
            const uniqueSerials = new Set<string>();
            for (const serial of variationSerials) {
                const trimmedSerial = serial.trim();
                if (uniqueSerials.has(trimmedSerial)) {
                    return { 
                        success: false, 
                        error: `Duplicate serial number "${trimmedSerial}" found multiple times in variation "${variationName}". Each serial must be unique.`,
                        duplicateSerial: trimmedSerial
                    };
                }
                uniqueSerials.add(trimmedSerial);
            }
            
            // Check for duplicates across variations
            for (const serial of variationSerials) {
                const trimmedSerial = serial.trim();
                if (allSerials.includes(trimmedSerial)) {
                    const firstVariation = serialToVariationMap.get(trimmedSerial);
                    return { 
                        success: false, 
                        error: `Duplicate serial number "${trimmedSerial}" found in variation "${variationName}". It was already used in variation "${firstVariation}".`,
                        duplicateSerial: trimmedSerial
                    };
                }
                allSerials.push(trimmedSerial);
                serialToVariationMap.set(trimmedSerial, variationName);
            }
        }
    }

    // Check if any serial already exists in database
    if (allSerials.length > 0) {
        const existingSerials = await prisma.productSerial.findMany({
            where: {
                serialNumber: {
                    in: allSerials
                }
            },
            include: {
                variant: {
                    include: {
                        product: {
                            select: {
                                name: true
                            }
                        }
                    }
                }
            }
        });

        if (existingSerials.length > 0) {
            const firstDuplicate = existingSerials[0];
            return {
                success: false,
                error: `Serial number "${firstDuplicate.serialNumber}" already exists in product "${firstDuplicate.variant.product.name}".`,
                duplicateSerial: firstDuplicate.serialNumber
            };
        }
    }

    // ===== STEP 2: Database transaction =====
    const product = await prisma.$transaction(async (tx) => {
        // 1. Create Product
        const newProduct = await tx.product.create({
            data: {
                name,
                slug,
                categoryId,
                brandId: brandId || null,
                productVariantType: productType,
                type: 'PHYSICAL',
                price: parseFloat(firstVariation.price) || 0,
                offerPrice: parseFloat(firstVariation.offerPrice) || null,
                costPrice: parseFloat(firstVariation.cost) || 0,
                stock: totalStock,
                description,
                isActive,
                isFlashSale,
                unit,
                warrantyMonths,
                videoUrl: videoUrl || undefined,
                sku: sku && sku.trim().length > 0 ? sku : null,
                barcode: productBarcode,
                specifications: specifications || Prisma.JsonNull,
                attributes: attributes || Prisma.JsonNull,
                images: [], 
            }
        });

        // 2. Create Gallery Images in DB - ALL IN ONE BATCH
        const imageMap = new Map<string, { id: string, url: string }>();

        if (uploadedImages.length > 0) {
            const imageInserts = uploadedImages.map((img, i) => {
                const newImageId = crypto.randomUUID();
                imageMap.set(img.id, { id: newImageId, url: img.url });
                return `('${newImageId}'::uuid, '${newProduct.id}', '${img.url}', ${img.isThumbnail}, ${i}, NOW())`;
            }).join(',');
            
            await tx.$executeRawUnsafe(`
                INSERT INTO "product_images" ("id", "product_id", "url", "is_thumbnail", "display_order", "updatedAt")
                VALUES ${imageInserts}
            `);
        }

        // 3. Save specifications to product_specs table - ALL IN ONE BATCH
        if (specifications) {
            const specEntries = Object.entries(specifications);
            if (specEntries.length > 0) {
                const specInserts = specEntries.map(([key, value]) => 
                    `(gen_random_uuid(), '${newProduct.id}', '${key.replace(/'/g, "''")}', '${String(value).replace(/'/g, "''")}')` 
                ).join(',');
                
                await tx.$executeRawUnsafe(`
                    INSERT INTO "product_specs" ("id", "product_id", "name", "value")
                    VALUES ${specInserts}
                `);
            }
        }

        // 4. Create Variations with their serial numbers
        for (const v of variations) {
            const variationSerials = v.hasSerial && v.serials 
                ? v.serials.filter((s: string) => s && s.trim().length > 0) 
                : [];
            const stockQty = v.hasSerial ? variationSerials.length : (parseInt(v.stock) || 0);

            // Link image
            let productImageId = null;
            let imageUrl = null;
            
            if (v.productImageId) {
                const mapped = imageMap.get(v.productImageId);
                if (mapped) {
                    productImageId = mapped.id;
                    imageUrl = mapped.url;
                }
            }

            const newVariant = await tx.variant.create({
                    data: {
                      productId: newProduct.id,
                      name: v.name || 'Default',
                      sku: v.sku || undefined,
                      upc: v.upc || undefined,
                    price: parseFloat(v.price) || 0,
                    costPrice: parseFloat(v.cost) || 0,
                    expense: parseFloat(v.expense) || 0,
                    offerPrice: parseFloat(v.offerPrice) || null,
                    stock: stockQty,
                    hasSerial: v.hasSerial || false,
                    image: imageUrl,
                    attributes: v.attributes || Prisma.JsonNull,
                }
            });
            
            if (productImageId) {
                await tx.$executeRaw`
                    UPDATE "product_variants" 
                    SET "product_image_id" = ${productImageId}
                    WHERE "id" = ${newVariant.id}
                `;
            }

            // 5. Create serial numbers linked to this variation
            if (variationSerials.length > 0) {
                await tx.productSerial.createMany({
                    data: variationSerials.map((s: string) => ({
                        variantId: newVariant.id,
                        serialNumber: s.trim(),
                        status: 'AVAILABLE',
                    }))
                });
            }
        }

        return newProduct;
    }, {
        maxWait: 20000,
        timeout: 20000
    });

    revalidatePath('/admin/products');
    return { success: true, product };
  } catch (error: any) {
    console.error('Create product error:', error);
    return { success: false, error: (error as any)?.message || 'Failed to create product' };
  }
}

// ... existing functions
export async function getProduct(id: string) {
  try {
    const product = await prisma.product.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        slug: true,
        sku: true,
        barcode: true,
        price: true,
        costPrice: true,
        offerPrice: true,
        stock: true,
        minStock: true,
        description: true,
        isActive: true,
        isFlashSale: true,
        isFeatured: true,
        unit: true,
        warrantyMonths: true,
        videoUrl: true,
        productVariantType: true,
        type: true,
        specifications: true,
        attributes: true,
        categoryId: true,
        brandId: true,
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          }
        },
        brand: {
          select: {
            id: true,
            name: true,
            slug: true,
          }
        },
        variants: {
          select: {
            id: true,
            name: true,
            sku: true,
            upc: true,
            price: true,
            costPrice: true,
            expense: true,
            offerPrice: true,
            stock: true,
            hasSerial: true,
            image: true,
            attributes: true,
            serials: {
              select: {
                id: true,
                serialNumber: true,
                status: true,
              },
              take: 500,
              orderBy: { status: 'asc' },
            },
            productImage: {
              select: {
                id: true,
                url: true,
              }
            },
          }
        },
        specs: {
          select: {
            id: true,
            name: true,
            value: true,
          }
        },
        productImages: {
          select: {
            id: true,
            url: true,
            isThumbnail: true,
            displayOrder: true,
          },
          orderBy: { displayOrder: 'asc' },
        },
      }
    });

    if (product) {
      (product as any).images = (product as any).productImages;
    }

    return product;
  } catch (error) {
    console.error('Error fetching product:', error);
    return null;
  }
}

export async function updateProduct(id: string, formData: FormData) {
  try {
    const nameRaw = formData.get('name') as string;
    const categoryId = formData.get('categoryId') as string;
    const brandId = formData.get('brandId') as string;
    const productType = formData.get('productType') as string;
    const descriptionRaw = formData.get('description') as string;
    const isActive = formData.get('isActive') === 'true';
    const isFlashSale = formData.get('isFlashSale') === 'true';
    const unit = formData.get('unit') as string;
    const warrantyMonths = parseInt(formData.get('warrantyMonths') as string) || 0;
    const videoUrl = formData.get('videoUrl') as string;
    const skuRaw = formData.get('sku') as string;

    // Sanitize free-text fields
    const name = sanitizeString(nameRaw) || '';
    const description = sanitizeString(descriptionRaw) || '';
    const sku = sanitizeString(skuRaw) || '';

    // JSON Fields
    const rawSpecs = formData.get('specifications') as string;
    const rawAttributes = formData.get('attributes') as string;
    const rawVariations = formData.get('variations') as string;
    const rawGalleryMetadata = formData.get('gallery_metadata') as string;

    const specifications = rawSpecs ? JSON.parse(rawSpecs) : null;
    const attributes = rawAttributes ? JSON.parse(rawAttributes) : null;
    const variations = rawVariations ? JSON.parse(rawVariations) : [];
    const galleryMetadata = rawGalleryMetadata ? JSON.parse(rawGalleryMetadata) : [];

    // Compute product-level derived values
    const firstVariation = variations[0] || {};
    const totalStock = variations.reduce((sum: number, v: any) => {
      if (v.hasSerial && v.serials) {
        return sum + v.serials.filter((s: string) => s && s.trim().length > 0).length;
      }
      return sum + (parseInt(v.stock) || 0);
    }, 0);
    const productBarcode = firstVariation.upc || null;

    // Upload new images OUTSIDE transaction to avoid timeout — all in parallel
    const uploadedImages = (await Promise.all(
        galleryMetadata.map(async (meta: any) => {
            let imageUrl = meta.url;
            if (meta.fileKey) {
                const imageFile = formData.get(meta.fileKey) as File | null;
                if (imageFile && imageFile.size > 0) {
                    try {
                        const arrayBuffer = await imageFile.arrayBuffer();
                        const buffer = Buffer.from(arrayBuffer);
                        imageUrl = await uploadToCloudinary(buffer, 'products/gallery');
                    } catch (e) {
                        console.error("Failed to upload gallery image", e);
                        return null; // skip failed upload, continue with others
                    }
                }
            }
            return imageUrl ? { id: meta.id, url: imageUrl, isThumbnail: meta.isThumbnail } : null;
        })
    )).filter((img): img is { id: string; url: string; isThumbnail: boolean } => img !== null);

    // Validate serial numbers for duplicates before transaction
    const allSerials: string[] = [];
    const serialToVariationMap = new Map<string, string>();
    
    for (const v of variations) {
        if (v.hasSerial && v.serials) {
            const variationName = v.name || 'Default';
            const variationSerials = v.serials.filter((s: string) => s && s.trim().length > 0);
            
            // Check for duplicates within the same variation
            const uniqueSerials = new Set<string>();
            for (const serial of variationSerials) {
                const trimmedSerial = serial.trim();
                if (uniqueSerials.has(trimmedSerial)) {
                    return { 
                        success: false, 
                        error: `Duplicate serial number "${trimmedSerial}" found multiple times in variation "${variationName}". Each serial must be unique.`,
                        duplicateSerial: trimmedSerial
                    };
                }
                uniqueSerials.add(trimmedSerial);
            }
            
            // Check for duplicates across variations
            for (const serial of variationSerials) {
                const trimmedSerial = serial.trim();
                if (allSerials.includes(trimmedSerial)) {
                    const firstVariation = serialToVariationMap.get(trimmedSerial);
                    return { 
                        success: false, 
                        error: `Duplicate serial number "${trimmedSerial}" found in variation "${variationName}". It was already used in variation "${firstVariation}".`,
                        duplicateSerial: trimmedSerial
                    };
                }
                allSerials.push(trimmedSerial);
                serialToVariationMap.set(trimmedSerial, variationName);
            }
        }
    }

    // Check if any serial already exists in database (excluding current product's serials)
    if (allSerials.length > 0) {
        const existingSerials = await prisma.productSerial.findMany({
            where: {
                serialNumber: {
                    in: allSerials
                },
                variant: {
                    productId: {
                        not: id // Exclude current product
                    }
                }
            },
            include: {
                variant: {
                    include: {
                        product: {
                            select: {
                                name: true
                            }
                        }
                    }
                }
            }
        });

        if (existingSerials.length > 0) {
            const firstDuplicate = existingSerials[0];
            return {
                success: false,
                error: `Serial number "${firstDuplicate.serialNumber}" already exists in product "${firstDuplicate.variant.product.name}".`,
                duplicateSerial: firstDuplicate.serialNumber
            };
        }
    }

    // Now do FAST database operations in transaction with increased timeout
    const product = await prisma.$transaction(async (tx) => {
        // 1. Update Product Basic Info
        const updatedProduct = await tx.product.update({
            where: { id },
            data: {
                name,
                categoryId,
                brandId: brandId || null,
                productVariantType: productType,
                price: parseFloat(firstVariation.price) || 0,
                offerPrice: parseFloat(firstVariation.offerPrice) || null,
                costPrice: parseFloat(firstVariation.cost) || 0,
                stock: totalStock,
                description,
                isActive,
                isFlashSale,
                unit,
                warrantyMonths,
                videoUrl: videoUrl || undefined,
                sku: sku && sku.trim().length > 0 ? sku : null,
                barcode: productBarcode,
                specifications: specifications || Prisma.JsonNull,
                attributes: attributes || Prisma.JsonNull,
            }
        });

        // 2. Delete existing images in one query
        await tx.$executeRaw`DELETE FROM "product_images" WHERE "product_id" = ${id}`;

        // 3. Insert ALL images in ONE batch query
        const imageMap = new Map<string, { id: string, url: string }>();
        if (uploadedImages.length > 0) {
            const imageInserts = uploadedImages.map((img, i) => {
                const newImageId = crypto.randomUUID();
                imageMap.set(img.id, { id: newImageId, url: img.url });
                return `('${newImageId}'::uuid, '${updatedProduct.id}', '${img.url}', ${img.isThumbnail}, ${i}, NOW())`;
            }).join(',');
            
            await tx.$executeRawUnsafe(`
                INSERT INTO "product_images" ("id", "product_id", "url", "is_thumbnail", "display_order", "updatedAt")
                VALUES ${imageInserts}
            `);
        }

        // 4. Delete and insert specs in batch
        await tx.$executeRaw`DELETE FROM "product_specs" WHERE "product_id" = ${id}`;
        
        if (specifications) {
            const specEntries = Object.entries(specifications);
            if (specEntries.length > 0) {
                const specInserts = specEntries.map(([key, value]) => 
                    `(gen_random_uuid(), '${updatedProduct.id}', '${key.replace(/'/g, "''")}', '${String(value).replace(/'/g, "''")}')` 
                ).join(',');
                
                await tx.$executeRawUnsafe(`
                    INSERT INTO "product_specs" ("id", "product_id", "name", "value")
                    VALUES ${specInserts}
                `);
            }
        }

        // 5. Delete and recreate variations
        await tx.productSerial.deleteMany({ 
            where: { variant: { productId: id } } 
        });
        await tx.variant.deleteMany({ where: { productId: id } });

        // 6. Create new variations
        for (const v of variations) {
            const variationSerials = v.hasSerial && v.serials 
                ? v.serials.filter((s: string) => s && s.trim().length > 0) 
                : [];
            const stockQty = v.hasSerial ? variationSerials.length : (parseInt(v.stock) || 0);

            // Link image
            let productImageId = null;
            let imageUrl = null;
            
            if (v.productImageId) {
                const mapped = imageMap.get(v.productImageId);
                if (mapped) {
                    productImageId = mapped.id;
                    imageUrl = mapped.url;
                }
            }

            const newVariant = await tx.variant.create({
                data: {
                    productId: updatedProduct.id,
                    name: v.name || 'Default',
                    sku: v.sku || undefined,
                    upc: v.upc || undefined,
                    price: parseFloat(v.price) || 0,
                    costPrice: parseFloat(v.cost) || 0,
                    expense: parseFloat(v.expense) || 0,
                    offerPrice: parseFloat(v.offerPrice) || null,
                    stock: stockQty,
                    hasSerial: v.hasSerial || false,
                    image: imageUrl,
                    attributes: v.attributes || Prisma.JsonNull,
                }
            });

            if (productImageId) {
                await tx.$executeRaw`
                    UPDATE "product_variants" 
                    SET "product_image_id" = ${productImageId}::uuid
                    WHERE "id" = ${newVariant.id}
                `;
            }

            if (variationSerials.length > 0) {
                await tx.productSerial.createMany({
                    data: variationSerials.map((s: string) => ({
                        variantId: newVariant.id,
                        serialNumber: s.trim(),
                        status: 'AVAILABLE',
                    }))
                });
            }
        }

        return updatedProduct;
    }, {
        maxWait: 20000,
        timeout: 20000
    });

    revalidatePath('/admin/products');
    return { success: true, product };
  } catch (error: any) {
    console.error('Update product error:', error);
    return { success: false, error: (error as any)?.message || 'Failed to update product' };
  }
}

export interface ProductParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  vendor?: string;
  status?: string;
  stockStatus?: string;
  type?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export async function getProducts({
  page = 1,
  limit = 10,
  search,
  category,
  vendor,
  status,
  stockStatus,
  type,
  minPrice,
  maxPrice,
  sortBy = 'createdAt',
  sortOrder = 'desc',
}: ProductParams) {
  try {
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {
      AND: [
        search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { sku: { contains: search, mode: 'insensitive' } },
                { barcode: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {},
        category ? { categoryId: category } : {},
        vendor ? { vendorId: vendor } : {},
        status ? { isActive: status === 'PUBLISHED' } : {}, // Mapping status string to boolean
        // type ? { type: type as any} : {},
        stockStatus
          ? stockStatus === 'LOW_STOCK'
            ? { stock: { lte: 5 } } 
            : stockStatus === 'OUT_OF_STOCK'
            ? { stock: 0 }
            : { stock: { gt: 0 } }
          : {},
        minPrice ? { price: { gte: minPrice } } : {},
        maxPrice ? { price: { lte: maxPrice } } : {},
      ],
    };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: { select: { name: true } },
          vendor: { select: { name: true } },
          variants: true,
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    return {
      products,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  } catch (error) {
    console.error('Error fetching products:', error);
    throw new Error('Failed to fetch products');
  }
}

export async function duplicateProduct(id: string) {
  try {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        productImages: true,
        specs: true,
        variants: true,
      }
    });

    if (!product) {
      return { success: false, error: "Product not found" };
    }

    // Generate new slug/name
    const newName = `${product.name} (Copy)`;
    const newSlug = `${product.slug}-copy-${Date.now()}`;
    
    // Transaction to create everything
    const newProduct = await prisma.$transaction(async (tx) => {
        // Create Product
        const created = await tx.product.create({
            data: {
                name: newName,
                slug: newSlug,
                categoryId: product.categoryId,
                brandId: product.brandId,
                vendorId: product.vendorId,
                productVariantType: product.productVariantType,
                type: product.type,
                price: product.price,
                offerPrice: product.offerPrice,
                costPrice: product.costPrice,
                stock: product.stock, 
                minStock: product.minStock,
                description: product.description,
                shortDesc: product.shortDesc,
                isActive: false, // Draft by default
                isFeatured: false,
                isFlashSale: false,
                unit: product.unit,
                warrantyMonths: product.warrantyMonths,
                warrantyType: product.warrantyType,
                videoUrl: product.videoUrl,
                specifications: product.specifications || undefined,
                attributes: product.attributes || undefined,
                sku: product.sku ? `${product.sku}-copy-${Date.now().toString().slice(-4)}` : null,
                barcode: null, 
                
                // Relations
                specs: {
                    create: product.specs.map(s => ({
                        name: s.name,
                        value: s.value
                    }))
                },
                productImages: {
                    create: product.productImages.map(img => ({
                        url: img.url,
                        publicId: img.publicId,
                        isThumbnail: img.isThumbnail,
                        displayOrder: img.displayOrder
                    }))
                },
                variants: {
                    create: product.variants.map(v => ({
                        name: v.name,
                        sku: v.sku ? `${v.sku}-copy-${Date.now().toString().slice(-4)}-${Math.floor(Math.random()*1000)}` : null,
                        upc: null,
                        price: v.price,
                        costPrice: v.costPrice,
                        expense: v.expense,
                        offerPrice: v.offerPrice,
                        stock: v.stock,
                        minStock: v.minStock,
                        hasSerial: false, // Disable serials for duplicate
                        image: v.image,
                        attributes: v.attributes || undefined,
                    }))
                }
            }
        });
        
        return created;
    });

    revalidatePath('/admin/products');
    return { success: true, product: newProduct };

  } catch (error: any) {
    console.error('Duplicate error:', error);
    return { success: false, error: (error as any)?.message };
  }
}
