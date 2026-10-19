'use server';

import { prisma } from '@/lib/prisma';

export async function getInventoryValuation() {
  try {
    // Fetch all active products/variants AND latest ledger unitCost per product/variant in 2 parallel queries (avoiding N+1 loop)
    const [products, latestLedgers] = await Promise.all([
      prisma.product.findMany({
        where: { status: 'ACTIVE' },
        select: {
          id: true,
          name: true,
          sku: true,
          stock: true,
          costPrice: true,
          variants: {
            select: {
              id: true,
              name: true,
              sku: true,
              stock: true,
              costPrice: true,
            },
          },
        },
      }),
      prisma.stockLedger.findMany({
        distinct: ['productId', 'variantId'],
        orderBy: { createdAt: 'desc' },
        select: {
          productId: true,
          variantId: true,
          unitCost: true,
        },
      }),
    ]);

    const latestCostMap = new Map<string, number>();
    for (const entry of latestLedgers) {
      const key = `${entry.productId}::${entry.variantId || 'SIMPLE'}`;
      if (!latestCostMap.has(key)) {
        latestCostMap.set(key, entry.unitCost);
      }
    }

    const valuationItems = [];
    let grandTotalValue = 0;

    for (const p of products) {
      if (p.variants.length > 0) {
        for (const v of p.variants) {
          if (v.stock <= 0) continue;

          const key = `${p.id}::${v.id}`;
          const mac = latestCostMap.get(key) ?? (v.costPrice || p.costPrice || 0);
          const totalValue = mac * v.stock;
          grandTotalValue += totalValue;

          valuationItems.push({
            id: v.id,
            productName: p.name,
            variantName: v.name,
            sku: v.sku || p.sku,
            qty: v.stock,
            mac,
            totalValue,
          });
        }
      } else {
        if (p.stock <= 0) continue;

        const key = `${p.id}::SIMPLE`;
        const mac = latestCostMap.get(key) ?? (p.costPrice || 0);
        const totalValue = mac * p.stock;
        grandTotalValue += totalValue;

        valuationItems.push({
          id: p.id,
          productName: p.name,
          variantName: null,
          sku: p.sku,
          qty: p.stock,
          mac,
          totalValue,
        });
      }
    }

    return {
      success: true,
      data: {
        items: valuationItems.sort((a, b) => b.totalValue - a.totalValue),
        grandTotalValue,
      },
    };
  } catch (error: any) {
    console.error('Failed to get inventory valuation:', error);
    return { success: false, error: error.message };
  }
}
