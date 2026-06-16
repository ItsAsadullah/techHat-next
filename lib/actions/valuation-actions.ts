'use server';

import { prisma } from '@/lib/prisma';

export async function getInventoryValuation() {
  try {
    // We need to get the current physical stock and the latest MAC (unitCost) for each product/variant.
    // To do this efficiently, we query the products and variants, and join their latest ledger entry.
    // Alternatively, we use the `costPrice` from variant/product if it is kept in sync with MAC.
    // Since the prompt asks to "calculate MAC values from Stock Ledger", we will fetch the latest Ledger entry for each.
    
    // 1. Fetch all products and variants with current physical stock
    const products = await prisma.product.findMany({
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
            costPrice: true
          }
        }
      }
    });

    const valuationItems = [];
    let grandTotalValue = 0;

    for (const p of products) {
      if (p.variants.length > 0) {
        // Handle variants
        for (const v of p.variants) {
          if (v.stock <= 0) continue;
          
          // Get latest ledger entry to find MAC
          const latestLedger = await prisma.stockLedger.findFirst({
            where: { variantId: v.id },
            orderBy: { createdAt: 'desc' },
            select: { unitCost: true }
          });
          
          const mac = latestLedger ? latestLedger.unitCost : (v.costPrice || 0);
          const totalValue = mac * v.stock;
          grandTotalValue += totalValue;

          valuationItems.push({
            id: v.id,
            productName: p.name,
            variantName: v.name,
            sku: v.sku || p.sku,
            qty: v.stock,
            mac,
            totalValue
          });
        }
      } else {
        // Handle simple product
        if (p.stock <= 0) continue;

        const latestLedger = await prisma.stockLedger.findFirst({
          where: { productId: p.id, variantId: null },
          orderBy: { createdAt: 'desc' },
          select: { unitCost: true }
        });
        
        const mac = latestLedger ? latestLedger.unitCost : (p.costPrice || 0);
        const totalValue = mac * p.stock;
        grandTotalValue += totalValue;

        valuationItems.push({
          id: p.id,
          productName: p.name,
          variantName: null,
          sku: p.sku,
          qty: p.stock,
          mac,
          totalValue
        });
      }
    }

    return { 
      success: true, 
      data: {
        items: valuationItems.sort((a, b) => b.totalValue - a.totalValue),
        grandTotalValue
      } 
    };
  } catch (error: any) {
    console.error('Failed to get inventory valuation:', error);
    return { success: false, error: error.message };
  }
}
