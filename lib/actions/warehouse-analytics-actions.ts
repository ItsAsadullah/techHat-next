'use server';

import { prisma } from '@/lib/prisma';
import { getWarehouseById } from './warehouse-actions';

export interface WarehouseAnalytics {
  healthScore: number;
  totalStockValue: number;
  deadStockValue: number;
  deadStockItemsCount: number;
  fastMovingValue: number;
  fastMovingItemsCount: number;
  categoryDistribution: { category: string; value: number }[];
  topMovers: any[];
  deadStockItems: any[];
  incomingStockValue: number;
  incomingStockItemsCount: number;
}

export async function getWarehouseAnalytics(id: string): Promise<{ success: boolean; data?: WarehouseAnalytics; error?: string }> {
  try {
    // We can leverage the existing logic that gets stock items
    const warehouseRes = await getWarehouseById(id);
    if (!warehouseRes.success || !warehouseRes.data) {
      throw new Error(warehouseRes.error || 'Warehouse not found');
    }

    const stockItems = warehouseRes.data.stockItems || [];
    
    // We need 60-day velocity for dead stock calculation
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const velocityStats60 = await prisma.stockLedger.groupBy({
      by: ['productId', 'variantId'],
      where: { warehouseId: id, date: { gte: sixtyDaysAgo } },
      _sum: { outQty: true }
    });

    const velocityMap60 = new Map();
    velocityStats60.forEach(v => {
      velocityMap60.set(`${v.productId}-${v.variantId || 'null'}`, v._sum.outQty || 0);
    });

    // We also need category info for distribution. Let's fetch all products' categories.
    const productIds = Array.from(new Set(stockItems.map((item: any) => item.variantName ? item.id.split('-')[0] : item.id)));
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, category: { select: { name: true } } }
    });
    const categoryMap = new Map();
    products.forEach(p => categoryMap.set(p.id, p.category?.name || 'Uncategorized'));

    // Incoming stock (Draft GRNs for this warehouse)
    const draftGrns = await prisma.goodsReceiveNote.findMany({
      where: { warehouseId: id, status: 'DRAFT' },
      include: {
        purchaseOrder: {
          include: { items: true }
        }
      }
    });

    let incomingStockValue = 0;
    let incomingStockItemsCount = 0;
    
    draftGrns.forEach(grn => {
      grn.purchaseOrder.items.forEach(item => {
        incomingStockItemsCount += item.quantity - item.receivedQty;
        incomingStockValue += (item.quantity - item.receivedQty) * item.unitCost;
      });
    });

    let totalStockValue = 0;
    let deadStockValue = 0;
    let deadStockItemsCount = 0;
    let fastMovingValue = 0;
    let fastMovingItemsCount = 0;
    const categoryDistributionMap = new Map<string, number>();
    const deadStockItems: any[] = [];
    const topMovers: any[] = [];

    for (const item of stockItems) {
      totalStockValue += item.totalValue;

      const pId = item.variantName ? item.id.split('-')[0] : item.id;
      const category = categoryMap.get(pId) || 'Uncategorized';
      categoryDistributionMap.set(category, (categoryDistributionMap.get(category) || 0) + item.totalValue);

      // Dead Stock: 0 movement in 60 days
      const out60Days = velocityMap60.get(item.id) || 0;
      if (out60Days === 0 && item.stock > 0) {
        deadStockValue += item.totalValue;
        deadStockItemsCount++;
        deadStockItems.push({ ...item, out60Days });
      }

      // Fast Movers: High movement in 30 days
      if (item.velocityStatus === 'FAST_MOVER') {
        fastMovingValue += item.totalValue;
        fastMovingItemsCount++;
      }

      // Top movers list
      if (item.out30Days > 0) {
        topMovers.push(item);
      }
    }

    // Sort Top Movers
    topMovers.sort((a, b) => b.out30Days - a.out30Days);

    // Sort Dead Stock by value
    deadStockItems.sort((a, b) => b.totalValue - a.totalValue);

    // Calculate Health Score
    // Base 100.
    // Penalty for dead stock: up to 40 points (-1 point for every 1% of dead stock value)
    // Bonus for fast movers: up to +20 points (capped at 100)
    let healthScore = 100;
    if (totalStockValue > 0) {
      const deadStockPct = (deadStockValue / totalStockValue) * 100;
      healthScore -= Math.min(deadStockPct, 50); // Max 50 penalty

      const fastMovingPct = (fastMovingValue / totalStockValue) * 100;
      healthScore += Math.min(fastMovingPct * 0.2, 10); // Small bonus
    } else {
      healthScore = 0; // Empty warehouse
    }

    healthScore = Math.max(0, Math.min(100, Math.round(healthScore)));

    const categoryDistribution = Array.from(categoryDistributionMap.entries())
      .map(([category, value]) => ({ category, value }))
      .sort((a, b) => b.value - a.value);

    return {
      success: true,
      data: {
        healthScore,
        totalStockValue,
        deadStockValue,
        deadStockItemsCount,
        fastMovingValue,
        fastMovingItemsCount,
        categoryDistribution,
        topMovers: topMovers.slice(0, 10), // Top 10
        deadStockItems: deadStockItems.slice(0, 20), // Top 20 dead stock
        incomingStockValue,
        incomingStockItemsCount,
      }
    };

  } catch (error: any) {
    console.error('Failed to get warehouse analytics:', error);
    return { success: false, error: error.message };
  }
}
