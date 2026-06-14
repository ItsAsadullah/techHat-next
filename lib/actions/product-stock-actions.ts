'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath, unstable_cache } from 'next/cache';
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
            sku: true,
            stock: true,
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
    const result = await prisma.$transaction(async (tx) => {
        // Fetch current state
        const product = await tx.product.findUnique({
            where: { id: productId },
            select: {
                id: true,
                stock: true,
                productVariantType: true,
                variants: { select: { id: true, stock: true } }
            },
        });

        if (!product) throw new Error('Product not found');

        let previousStock = 0;
        let newStock = 0;
        let delta = 0;

        // Determine target and delta
        if (variantId) {
            const variant = product.variants.find(v => v.id === variantId);
            if (!variant) throw new Error('Variant not found');
            previousStock = variant.stock;
        } else {
            previousStock = product.stock;
        }

        if (action === 'ADD') {
            delta = quantity;
            newStock = previousStock + delta;
        } else if (action === 'REDUCE') {
            delta = -quantity;
            newStock = previousStock + delta;
        } else if (action === 'ADJUST') {
            delta = quantity - previousStock;
            newStock = quantity;
        }

        if (newStock < 0) throw new Error('Stock cannot be negative');

        // Apply ATOMIC Updates
        if (variantId) {
            await tx.variant.update({
                where: { id: variantId },
                data: action === 'ADJUST' ? { stock: newStock } : { stock: { increment: delta } }
            });
            
            if (product.productVariantType === 'variable') {
                await tx.product.update({
                    where: { id: productId },
                    data: { stock: { increment: delta } }
                });
            }
        } else {
            await tx.product.update({
                where: { id: productId },
                data: action === 'ADJUST' ? { stock: newStock } : { stock: { increment: delta } }
            });
        }

        // Create History Record
        await tx.stockHistory.create({
            data: {
                productId,
                variantId,
                action,
                quantity: Math.abs(delta),
                previousStock,
                newStock,
                reason,
                note,
                source: 'Manual',
                createdBy: userId
            }
        });

        return { success: true, newStock };
    });

    revalidatePath('/admin/products');
    return result;
  } catch (error: any) {
    return { success: false, error: (error as any)?.message };
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
        return { success: false, error: (error as any)?.message };
    }
}

export async function bulkUpdateStockIndividual(
  products: { id: string; quantity: number }[], 
  action: 'ADD' | 'REDUCE', 
  reason: string,
  note?: string
) {
    try {
        const validItems = products.filter(({ quantity }) => quantity > 0);
        if (validItems.length === 0) return { success: true };

        // Batch-fetch all products in a single query instead of N sequential queries
        const dbProducts = await prisma.product.findMany({
            where: { id: { in: validItems.map(({ id }) => id) } },
            select: {
                id: true,
                stock: true,
                productVariantType: true,
                variants: { select: { id: true, stock: true }, take: 1 },
            },
        });
        const productMap = new Map(dbProducts.map(p => [p.id, p]));

        // Build ALL operations, then run a single transaction
        const operations: any[] = [];
        for (const { id, quantity } of validItems) {
            const product = productMap.get(id);
            if (!product) continue;

            const newStock = action === 'ADD'
                ? product.stock + quantity
                : Math.max(0, product.stock - quantity);

            operations.push(
                prisma.product.update({ where: { id }, data: { stock: newStock } }),
                prisma.stockHistory.create({
                    data: {
                        productId: id,
                        action: action as StockAction,
                        quantity,
                        previousStock: product.stock,
                        newStock,
                        reason,
                        source: 'Bulk Action (Individual)',
                        note: note || `Bulk ${action} ${quantity} units`,
                    },
                }),
            );

            if (product.productVariantType === 'variable' && product.variants.length > 0) {
                const firstVar = product.variants[0];
                const newVarStock = action === 'ADD'
                    ? firstVar.stock + quantity
                    : Math.max(0, firstVar.stock - quantity);
                operations.push(
                    prisma.variant.update({ where: { id: firstVar.id }, data: { stock: newVarStock } }),
                );
            }
        }

        if (operations.length > 0) await prisma.$transaction(operations);
        revalidatePath('/admin/products');
        return { success: true };
    } catch (error: any) {
        console.error("Bulk individual update error:", error);
        return { success: false, error: (error as any)?.message };
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
            select: {
                id: true,
                stock: true,
                productVariantType: true,
                variants: { select: { id: true, stock: true }, take: 1 },
            },
        });

        // Build ALL operations first, then run a single transaction
        const operations: any[] = [];
        for (const product of products) {
            const newStock = action === 'ADD'
                ? product.stock + quantity
                : Math.max(0, product.stock - quantity);

            operations.push(
                prisma.product.update({ where: { id: product.id }, data: { stock: newStock } }),
                prisma.stockHistory.create({
                    data: {
                        productId: product.id,
                        action: action as StockAction,
                        quantity,
                        previousStock: product.stock,
                        newStock,
                        reason,
                        source: 'Bulk Action',
                        note: note || `Bulk ${action} ${quantity}`,
                    },
                }),
            );

            if (product.productVariantType === 'variable' && product.variants.length > 0) {
                const firstVar = product.variants[0];
                const newVarStock = action === 'ADD'
                    ? firstVar.stock + quantity
                    : Math.max(0, firstVar.stock - quantity);
                operations.push(
                    prisma.variant.update({ where: { id: firstVar.id }, data: { stock: newVarStock } }),
                );
            }
        }
        if (operations.length > 0) await prisma.$transaction(operations);
        
        revalidatePath('/admin/products');
        return { success: true };
    } catch (error: any) {
        console.error("Bulk update error:", error);
        return { success: false, error: (error as any)?.message };
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
        return { success: false, error: (error as any)?.message };
    }
}

const getInventoryStatsCached = unstable_cache(
  async () => {
    // Single aggregation query — avoids loading all products into JS memory
    const [[agg], totalProducts, outOfStock] = await Promise.all([
        prisma.$queryRaw<[{ low_stock: bigint; total_value: number }]>`
            SELECT
                COUNT(*) FILTER (WHERE stock > 0 AND stock <= COALESCE("minStock", 5))::int AS low_stock,
                COALESCE(SUM(COALESCE("costPrice", 0) * GREATEST(stock, 0)), 0)::float8 AS total_value
            FROM "products"
        `,
        prisma.product.count(),
        prisma.product.count({ where: { stock: { lte: 0 } } }),
    ]);

    return {
        totalProducts,
        lowStock: Number(agg.low_stock),
        outOfStock,
        totalValue: Number(agg.total_value),
    };
  },
  ['inventory-stats'],
  { revalidate: 300, tags: ['inventory'] }
);

export async function getInventoryStats() {
  try {
    return await getInventoryStatsCached();
  } catch (error) {
    console.error('getInventoryStats error:', error);
    return { totalProducts: 0, lowStock: 0, outOfStock: 0, totalValue: 0 };
  }
}
