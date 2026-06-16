'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export interface WarehouseFormData {
  name: string;
  code: string;
  type: 'MAIN' | 'STORE' | 'TRANSIT' | 'DAMAGE';
  address?: string;
  isActive: boolean;
}

export async function getWarehouseOptions() {
  try {
    const warehouses = await prisma.warehouse.findMany({
      where: { isActive: true },
      select: { id: true, name: true, code: true, type: true },
      orderBy: { name: 'asc' },
    });
    return { success: true, data: warehouses };
  } catch (error: any) {
    console.error('Failed to get warehouse options:', error);
    return { success: false, error: error.message };
  }
}

export async function getWarehouses({
  page = 1,
  limit = 10,
  search = '',
}: {
  page?: number;
  limit?: number;
  search?: string;
}) {
  try {
    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [warehouses, totalCount] = await Promise.all([
      prisma.warehouse.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.warehouse.count({ where }),
    ]);

    return {
      success: true,
      data: {
        warehouses,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page,
      },
    };
  } catch (error: any) {
    console.error('Failed to get warehouses:', error);
    return { success: false, error: error.message };
  }
}

export async function getWarehouseById(id: string) {
  try {
    const warehouse = await prisma.warehouse.findUnique({
      where: { id },
    });

    if (!warehouse) throw new Error('Warehouse not found');

    // Aggregate stock logic
    // In our system, StockLedger handles immutable tracking.
    // To get the exact stock in a warehouse, we sum (inQty - outQty) grouped by Product/Variant.
    const ledgerStats = await prisma.stockLedger.groupBy({
      by: ['productId', 'variantId'],
      where: { warehouseId: id },
      _sum: {
        inQty: true,
        outQty: true,
      }
    });

    // Get 30-day velocity to determine fast/slow movers
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const velocityStats = await prisma.stockLedger.groupBy({
      by: ['productId', 'variantId'],
      where: { warehouseId: id, createdAt: { gte: thirtyDaysAgo } },
      _sum: { outQty: true }
    });

    const velocityMap = new Map();
    velocityStats.forEach(v => {
      velocityMap.set(`${v.productId}-${v.variantId || 'null'}`, v._sum.outQty || 0);
    });

    const stockItems = [];
    let totalWarehouseValue = 0;
    
    // Enrich with product details
    for (const stat of ledgerStats) {
      const inQty = stat._sum.inQty || 0;
      const outQty = stat._sum.outQty || 0;
      const currentStock = inQty - outQty;

      if (currentStock > 0) {
        const key = `${stat.productId}-${stat.variantId || 'null'}`;
        const out30Days = velocityMap.get(key) || 0;
        
        let velocityStatus = 'NORMAL';
        if (out30Days > 20) velocityStatus = 'FAST_MOVER';
        else if (out30Days < 2) velocityStatus = 'SLOW_MOVER';

        if (stat.variantId) {
          const v = await prisma.variant.findUnique({
            where: { id: stat.variantId },
            include: { product: { select: { name: true } } }
          });
          if (v) {
            const cost = v.costPrice || 0;
            const value = currentStock * cost;
            totalWarehouseValue += value;
            stockItems.push({
              id: key,
              name: v.product.name,
              variantName: v.name,
              sku: v.sku,
              stock: currentStock,
              unitCost: cost,
              totalValue: value,
              out30Days,
              velocityStatus
            });
          }
        } else {
          const p = await prisma.product.findUnique({
            where: { id: stat.productId },
            select: { name: true, sku: true, costPrice: true, lastPurchaseCost: true }
          });
          if (p) {
            const cost = p.lastPurchaseCost || p.costPrice || 0;
            const value = currentStock * cost;
            totalWarehouseValue += value;
            stockItems.push({
              id: stat.productId,
              name: p.name,
              variantName: null,
              sku: p.sku,
              stock: currentStock,
              unitCost: cost,
              totalValue: value,
              out30Days,
              velocityStatus
            });
          }
        }
      }
    }

    return { success: true, data: { ...warehouse, stockItems, totalWarehouseValue } };
  } catch (error: any) {
    console.error('Failed to get warehouse:', error);
    return { success: false, error: error.message };
  }
}

export async function createWarehouse(data: WarehouseFormData) {
  try {
    const existing = await prisma.warehouse.findUnique({ where: { code: data.code } });
    if (existing) throw new Error('Warehouse code already exists');

    const warehouse = await prisma.warehouse.create({
      data: {
        name: data.name,
        code: data.code,
        type: data.type,
        address: data.address,
        isActive: data.isActive,
      },
    });

    revalidatePath('/admin/inventory/warehouses');
    return { success: true, data: warehouse };
  } catch (error: any) {
    console.error('Failed to create warehouse:', error);
    return { success: false, error: error.message };
  }
}

export async function updateWarehouse(id: string, data: WarehouseFormData) {
  try {
    const existing = await prisma.warehouse.findUnique({ where: { code: data.code } });
    if (existing && existing.id !== id) {
      throw new Error('Warehouse code already exists for another warehouse');
    }

    const warehouse = await prisma.warehouse.update({
      where: { id },
      data: {
        name: data.name,
        code: data.code,
        type: data.type,
        address: data.address,
        isActive: data.isActive,
      },
    });

    revalidatePath('/admin/inventory/warehouses');
    revalidatePath(`/admin/inventory/warehouses/${id}`);
    return { success: true, data: warehouse };
  } catch (error: any) {
    console.error('Failed to update warehouse:', error);
    return { success: false, error: error.message };
  }
}

export async function getInventoryDashboardStats() {
  try {
    // Total Products Count
    const totalProducts = await prisma.product.count({ where: { status: 'ACTIVE' } });
    
    // Total Active Warehouses
    const activeWarehouses = await prisma.warehouse.count({ where: { isActive: true } });

    // Accurate Stock Calculation (fixes double counting of variable products)
    // 1. Simple Products (no variants)
    const simpleProducts = await prisma.product.findMany({
      where: { 
        status: 'ACTIVE',
        variants: { none: {} } // only products without variants
      },
      select: { stock: true, lastPurchaseCost: true, costPrice: true },
    });
    
    // 2. All Variants
    const variants = await prisma.variant.findMany({
      select: { stock: true, costPrice: true },
    });

    let totalStockValue = 0;
    let totalStockQty = 0;

    for (const p of simpleProducts) {
      totalStockQty += p.stock;
      const cost = p.lastPurchaseCost || p.costPrice || 0;
      totalStockValue += (p.stock * cost);
    }
    
    for (const v of variants) {
      totalStockQty += v.stock;
      totalStockValue += (v.stock * (v.costPrice || 0));
    }

    // Recent GRNs
    const recentGRNs = await prisma.goodsReceiveNote.findMany({
      take: 5,
      orderBy: { receivedDate: 'desc' },
      include: {
        supplier: { select: { name: true } },
        warehouse: { select: { name: true } }
      }
    });

    // ─── Global Reservation Engine ───
    
    // 1. Reserved Stock (Orders + Transfers)
    const orderReserved = await prisma.orderItem.aggregate({
      where: { order: { status: { in: ['DRAFT', 'PENDING_PAYMENT', 'PENDING', 'CONFIRMED', 'PROCESSING', 'PACKED'] } } },
      _sum: { quantity: true }
    });
    const warehouseTransferItems = await prisma.warehouseTransferItem.aggregate({
      where: { warehouseTransfer: { status: { in: ['APPROVED', 'IN_TRANSIT'] } } },
      _sum: { quantity: true }
    });
    const totalReservedStock = (orderReserved._sum.quantity || 0) + (warehouseTransferItems._sum.quantity || 0);

    // 2. Incoming Stock (Pending POs)
    const poItems = await prisma.purchaseOrderItem.findMany({
      where: { purchaseOrder: { status: { in: ['SUBMITTED', 'APPROVED', 'PARTIALLY_RECEIVED'] } } },
      select: { quantity: true, receivedQty: true }
    });
    const totalIncomingStock = poItems.reduce((sum, item) => sum + Math.max(0, item.quantity - item.receivedQty), 0);

    // 3. Damaged Stock (Adjustments)
    const stockAdjustments = await prisma.stockAdjustmentItem.aggregate({
      where: { stockAdjustment: { reason: 'DAMAGE', status: 'APPROVED' } },
      _sum: { quantity: true }
    });
    const totalDamagedStock = Math.abs(stockAdjustments._sum.quantity || 0);

    const totalAvailableStock = Math.max(0, totalStockQty - totalReservedStock);

    return {
      success: true,
      data: {
        totalProducts,
        activeWarehouses,
        totalStockQty,
        totalReservedStock,
        totalAvailableStock,
        totalIncomingStock,
        totalDamagedStock,
        totalStockValue,
        recentGRNs
      }
    };
  } catch (error: any) {
    console.error('Failed to fetch dashboard stats:', error);
    return { success: false, error: error.message };
  }
}
