'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { StockAction } from '@prisma/client';

export type ProductFilterParams = {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  brandId?: string;
  stockStatus?: 'in' | 'low' | 'out';
  status?: 'active' | 'draft' | 'inactive';
};

export async function getProducts(params: ProductFilterParams) {
  const {
    page = 1,
    limit = 20,
    search,
    categoryId,
    brandId,
    stockStatus,
    status,
  } = params;

  const skip = (page - 1) * limit;

  const where: any = {};

  // Search logic
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { sku: { contains: search, mode: 'insensitive' } },
      { barcode: { contains: search, mode: 'insensitive' } },
    ];
  }

  // Filters
  if (categoryId) where.categoryId = categoryId;
  if (brandId) where.brandId = brandId;

  // Status mapping (schema has isActive: Boolean; draft = inactive)
  if (status === 'active') where.isActive = true;
  if (status === 'inactive' || status === 'draft') where.isActive = false;

  // Stock Status Logic
  if (stockStatus) {
    if (stockStatus === 'out') {
      where.stock = { lte: 0 };
    } else if (stockStatus === 'low') {
      // Compare stock against each product's own minStock (default 5)
      // Prisma doesn't support field-to-field comparison in where, so use raw query for IDs
      const lowStockRows = await prisma.$queryRaw<{ id: string }[]>`
        SELECT id FROM "products" WHERE stock > 0 AND stock <= COALESCE("minStock", 5)
      `;
      where.id = { in: lowStockRows.map((r) => r.id) };
    } else if (stockStatus === 'in') {
      where.stock = { gt: 0 };
    }
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      select: {
        id: true,
        name: true,
        sku: true,
        price: true,
        costPrice: true,
        stock: true,
        minStock: true,
        isActive: true,
        updatedAt: true,
        category: {
          select: {
            id: true,
            name: true,
          }
        },
        brand: {
          select: {
            id: true,
            name: true,
          }
        },
        productImages: {
          select: {
            id: true,
            url: true,
            isThumbnail: true,
          },
          orderBy: { isThumbnail: 'desc' }, // thumbnail (true) comes first
          take: 1,
        },
        variants: {
          select: {
            id: true,
            name: true,
            stock: true,
            productImage: {
              select: {
                url: true,
              }
            }
          },
          take: 5,
        }
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.product.count({ where }),
  ]);

  return {
    products,
    total,
    totalPages: Math.ceil(total / limit),
  };
}

export async function updateStock(
  productId: string,
  variantId: string | null,
  action: StockAction,
  quantity: number,
  reason: string,
  note?: string,
  userId?: string
) {
  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        stock: true,
        productVariantType: true,
        variants: {
          select: {
            id: true,
            stock: true,
          }
        }
      },
    });

    if (!product) throw new Error('Product not found');

    let currentStock = 0;
    let newStock = 0;
    
    // Determine target (Product or Variant)
    if (variantId) {
        const variant = product.variants.find(v => v.id === variantId);
        if (!variant) throw new Error('Variant not found');
        currentStock = variant.stock;
    } else {
        currentStock = product.stock;
    }

    // Calculate new stock
    if (action === 'ADD') {
        newStock = currentStock + quantity;
    } else if (action === 'REDUCE') {
        newStock = currentStock - quantity;
    } else if (action === 'ADJUST') {
        newStock = quantity;
    }

    if (newStock < 0) throw new Error('Stock cannot be negative');

    // Update DB
    if (variantId) {
        await prisma.variant.update({
            where: { id: variantId },
            data: { stock: newStock }
        });
        
        // Also update parent product total stock if it aggregates variants? 
        // Usually systems either track stock at parent OR variant. 
        // If variable product, stock is usually sum of variants.
        // Let's update parent stock as sum of variants if it's a variable product.
        if (product.productVariantType === 'variable') {
             const allVariants = await prisma.variant.findMany({ where: { productId } });
             // We need to use the NEW stock for the current variant
             const totalStock = allVariants.reduce((sum, v) => sum + (v.id === variantId ? newStock : v.stock), 0);
             await prisma.product.update({
                 where: { id: productId },
                 data: { stock: totalStock }
             });
        }

    } else {
        await prisma.product.update({
            where: { id: productId },
            data: { stock: newStock }
        });
    }

    // Create History Record
    await prisma.stockHistory.create({
        data: {
            productId,
            variantId,
            action,
            quantity: Math.abs(action === 'ADJUST' ? newStock - currentStock : quantity),
            previousStock: currentStock,
            newStock,
            reason,
            note,
            source: 'Manual',
            createdBy: userId
        }
    });

    revalidatePath('/admin/products');
    return { success: true, newStock };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getStockHistory(productId: string) {
    return await prisma.stockHistory.findMany({
        where: { productId },
        include: {
            variant: true,
            // user: true // If we had a relation to User for createdBy
        },
        orderBy: { createdAt: 'desc' },
        take: 50
    });
}

export async function bulkDeleteProducts(ids: string[]) {
    try {
        await prisma.product.deleteMany({
            where: { id: { in: ids } }
        });

        revalidatePath('/admin/products');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function bulkUpdateStockIndividual(
  products: { id: string; quantity: number }[], 
  action: 'ADD' | 'REDUCE', 
  reason: string,
  note?: string
) {
    try {
        for (const { id, quantity } of products) {
            if (quantity <= 0) continue; // Skip if no quantity

            const product = await prisma.product.findUnique({
                where: { id },
                include: { variants: true }
            });

            if (!product) continue;

            let newStock = product.stock;
            const changeAmount = quantity;

            if (action === 'ADD') {
                newStock += changeAmount;
            } else if (action === 'REDUCE') {
                newStock = Math.max(0, newStock - changeAmount);
            }

            const operations: any[] = [
                prisma.product.update({
                    where: { id: product.id },
                    data: { stock: newStock }
                }),
                prisma.stockHistory.create({
                    data: {
                        productId: product.id,
                        action: action as StockAction,
                        quantity: changeAmount,
                        previousStock: product.stock,
                        newStock,
                        reason,
                        source: 'Bulk Action (Individual)',
                        note: note || `Bulk ${action} ${quantity} units`
                    }
                })
            ];

            if (product.productVariantType === 'variable' && product.variants.length > 0) {
                const firstVar = product.variants[0];
                let newVarStock = firstVar.stock;
                if (action === 'ADD') newVarStock += changeAmount;
                else newVarStock = Math.max(0, newVarStock - changeAmount);

                operations.push(
                    prisma.variant.update({
                        where: { id: firstVar.id },
                        data: { stock: newVarStock }
                    })
                );
            }

            await prisma.$transaction(operations);
        }
        
        revalidatePath('/admin/products');
        return { success: true };
    } catch (error: any) {
        console.error("Bulk individual update error:", error);
        return { success: false, error: error.message };
    }
}

export async function bulkUpdateStock(
  ids: string[], 
  action: 'ADD' | 'REDUCE', 
  quantity: number, 
  reason: string,
  note?: string
) {
    try {
        const products = await prisma.product.findMany({
            where: { id: { in: ids } },
            include: { variants: true }
        });

        for (const product of products) {
            let newStock = product.stock;
            const changeAmount = quantity;

            if (action === 'ADD') {
                newStock += changeAmount;
            } else if (action === 'REDUCE') {
                newStock = Math.max(0, newStock - changeAmount);
            }

            const operations: any[] = [
                prisma.product.update({
                    where: { id: product.id },
                    data: { stock: newStock }
                }),
                prisma.stockHistory.create({
                    data: {
                        productId: product.id,
                        action: action as StockAction,
                        quantity: changeAmount,
                        previousStock: product.stock,
                        newStock,
                        reason,
                        source: 'Bulk Action',
                        note: note || `Bulk ${action} ${quantity}`
                    }
                })
            ];

            if (product.productVariantType === 'variable' && product.variants.length > 0) {
                const firstVar = product.variants[0];
                let newVarStock = firstVar.stock;
                if (action === 'ADD') newVarStock += changeAmount;
                else newVarStock = Math.max(0, newVarStock - changeAmount);

                operations.push(
                    prisma.variant.update({
                        where: { id: firstVar.id },
                        data: { stock: newVarStock }
                    })
                );
            }

            await prisma.$transaction(operations);
        }
        
        revalidatePath('/admin/products');
        return { success: true };
    } catch (error: any) {
        console.error("Bulk update error:", error);
        return { success: false, error: error.message };
    }
}

export async function bulkUpdateStatus(ids: string[], isActive: boolean) {
    try {
        await prisma.product.updateMany({
            where: { id: { in: ids } },
            data: { isActive }
        });

        revalidatePath('/admin/products');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getInventoryStats() {
    const [totalProducts, outOfStock, allStockData] = await Promise.all([
        prisma.product.count(),
        prisma.product.count({ where: { stock: { lte: 0 } } }),
        // Fetch minimal data to compute low-stock (per-product minStock) and total value
        prisma.product.findMany({
            select: {
                stock: true,
                minStock: true,
                costPrice: true,
            }
        })
    ]);

    // Low stock: stock > 0 AND stock <= product's own minStock (default 5)
    const lowStock = allStockData.filter(
        p => p.stock > 0 && p.stock <= (p.minStock || 5)
    ).length;

    // Total inventory value = sum of (costPrice * stock) for all products
    const totalValue = allStockData.reduce(
        (acc, p) => acc + ((p.costPrice || 0) * (p.stock || 0)), 0
    );

    return {
        totalProducts,
        lowStock,
        outOfStock,
        totalValue,
    };
}
