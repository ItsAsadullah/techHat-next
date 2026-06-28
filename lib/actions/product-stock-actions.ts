'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath, unstable_cache } from 'next/cache';
import { StockAction } from '@prisma/client';
import { InventoryService } from '@/lib/services/inventory-service';

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

  // Status mapping (schema uses ProductLifecycleStatus; active = ACTIVE, draft/inactive = DRAFT)
  if (status === 'active') where.status = 'ACTIVE';
  if (status === 'inactive' || status === 'draft') where.status = 'DRAFT';

  // Stock Status Logic
  if (stockStatus) {
    if (stockStatus === 'out') {
      where.stock = { lte: 0 };
    } else if (stockStatus === 'low') {
      // For low stock, we need stock > 0 AND stock <= minStock
      // Since minStock is a column, Prisma where syntax doesn't support comparing two columns directly in standard findMany without raw or extensions.
      // But we can fetch products and filter in JS if needed, OR just approximate low stock as <= 5.
      // Let's use a raw query just to get IDs for low stock, or just approximate.
      const lowStockProducts = await prisma.$queryRaw<any[]>`
        SELECT id FROM "products" WHERE stock > 0 AND stock <= COALESCE("minStock", 5)
      `;
      const matchedIds = lowStockProducts.map(p => p.id);
      where.id = { in: matchedIds.length > 0 ? matchedIds : ['NONE'] };
    } else if (stockStatus === 'in') {
      where.stock = { gt: 0 };
    }
  }

  const products = await prisma.product.findMany({
    where,
    select: {
      id: true,
      name: true,
      slug: true,
      sku: true,
      price: true,
      offerPrice: true,
      costPrice: true,
      minStock: true,
      status: true,
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
        },
        take: 5,
      }
    },
    skip,
    take: limit,
    orderBy: { createdAt: 'desc' },
  });

  const total = await prisma.product.count({ where });

  const stockQueries = [];
  for (const p of products) {
    stockQueries.push({ productId: p.id, variantId: null });
    for (const v of p.variants) {
      stockQueries.push({ productId: p.id, variantId: v.id });
    }
  }
  const stockMap = await InventoryService.getBulkAvailableStock(stockQueries);

  const mappedProducts = products.map((p) => {
    const pStock = stockMap.get(p.id)?.availableStock || 0;
    return {
      ...p,
      stock: pStock, // Replaced cached stock with Ledger Available Stock
      variants: p.variants.map((v) => ({
        ...v,
        stock: stockMap.get(`${p.id}-${v.id}`)?.availableStock || 0
      }))
    };
  });

  return {
    products: mappedProducts,
    total,
    totalPages: Math.ceil(total / limit),
  };
}





export async function bulkDeleteProducts(ids: string[]) {
    try {
        let deletedCount = 0;
        let archivedCount = 0;
        let failedCount = 0;

        for (const id of ids) {
            try {
                // 1. Check for restricting relationships (Orders, GRNs, POs, etc.)
                const [orders, returns, po, pr, grn, transfers, adjustments] = await Promise.all([
                    prisma.orderItem.count({ where: { productId: id } }),
                    prisma.returnItem.count({ where: { productId: id } }),
                    prisma.purchaseOrderItem.count({ where: { productId: id } }),
                    prisma.purchaseReturnItem.count({ where: { productId: id } }),
                    prisma.goodsReceiveNoteItem.count({ where: { productId: id } }),
                    prisma.warehouseTransferItem.count({ where: { productId: id } }),
                    prisma.stockAdjustmentItem.count({ where: { productId: id } })
                ]);

                const hasTransactions = (orders + returns + po + pr + grn + transfers + adjustments) > 0;

                if (hasTransactions) {
                    // Soft delete (Archive) if it's tied to transactions
                    await prisma.product.update({
                        where: { id },
                        data: { status: 'ARCHIVED' }
                    });
                    archivedCount++;
                } else {
                    // Safe to hard delete.
                    // Clean up non-cascading relations first
                    await prisma.$transaction(async (tx) => {
                        await tx.stockLedger.deleteMany({ where: { productId: id } });
                        await tx.supplierProduct.deleteMany({ where: { productId: id } });
                        
                        // Finally delete the product (Variants, Specs, Images, History will cascade)
                        await tx.product.delete({ where: { id } });
                    });
                    deletedCount++;
                }
            } catch (error: any) {
                // P2003 = Foreign key constraint failed. If we missed a relation, fallback to Archive
                if (error.code === 'P2003') {
                    try {
                        await prisma.product.update({
                            where: { id },
                            data: { status: 'ARCHIVED' }
                        });
                        archivedCount++;
                    } catch (updateErr) {
                        failedCount++;
                    }
                } else {
                    failedCount++;
                }
            }
        }

        revalidatePath('/admin/products');
        
        const messageParts = [];
        if (deletedCount > 0) messageParts.push(`Permanently deleted ${deletedCount}`);
        if (archivedCount > 0) messageParts.push(`Archived ${archivedCount} (due to existing records)`);
        if (failedCount > 0) messageParts.push(`Failed to delete ${failedCount}`);

        return { 
            success: true, 
            message: messageParts.join(', ') || 'No products were processed.'
        };
    } catch (error: any) {
        return { success: false, error: (error as any)?.message };
    }
}



export async function bulkUpdateStatus(ids: string[], isActive: boolean) {
    try {
        await prisma.product.updateMany({
            where: { id: { in: ids } },
            data: { status: isActive ? 'ACTIVE' : 'DRAFT' }
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
    const [agg] = await prisma.$queryRaw<[{ low_stock: bigint; total_value: number }]>`
        SELECT
            COUNT(*) FILTER (WHERE stock > 0 AND stock <= COALESCE("minStock", 5))::int AS low_stock,
            COALESCE(SUM(COALESCE("costPrice", 0) * GREATEST(stock, 0)), 0)::float8 AS total_value
        FROM "products"
    `;
    const totalProducts = await prisma.product.count();
    const outOfStock = await prisma.product.count({ where: { stock: { lte: 0 } } });

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
