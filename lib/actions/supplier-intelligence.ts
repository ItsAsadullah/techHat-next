'use server';

import { prisma } from '@/lib/prisma';
import { InventoryService } from '@/lib/services/inventory-service';

export async function getSupplierIntelligence(supplierId: string) {
  try {
    const supplier = await prisma.supplier.findUnique({
      where: { id: supplierId },
      include: {
        purchases: {
          select: { date: true, totalAmount: true, status: true },
          orderBy: { date: 'desc' },
          take: 1
        },
        purchaseOrders: {
          select: { id: true, poNumber: true, totalAmount: true, status: true, expectedDeliveryDate: true, date: true },
          orderBy: { date: 'desc' },
          take: 5
        },
        supplierLedgers: {
          orderBy: { date: 'desc' },
          take: 1,
          select: { runningBalance: true }
        }
      }
    });

    if (!supplier) throw new Error("Supplier not found");

    // Aggregate total purchases
    const totalPurchases = await prisma.purchaseOrder.aggregate({
      where: { supplierId, status: { not: 'CANCELLED' } },
      _sum: { totalAmount: true },
      _count: { id: true }
    });

    return {
      success: true,
      data: {
        creditLimit: supplier.creditLimit || 0,
        rating: supplier.rating || 0,
        riskScore: supplier.riskScore || 0,
        outstandingPayable: supplier.supplierLedgers[0]?.runningBalance || 0,
        lastPurchaseDate: supplier.purchases[0]?.date || null,
        totalPurchaseValue: totalPurchases._sum.totalAmount || 0,
        purchaseFrequency: totalPurchases._count.id || 0,
        contactPerson: supplier.contactPerson,
        phone: supplier.phone,
        email: supplier.email,
        recentPOs: supplier.purchaseOrders
      }
    };
  } catch (error: any) {
    console.error('Failed to get supplier intelligence:', error);
    return { success: false, error: error.message };
  }
}

export async function getAIAssistantRecommendations(supplierId: string) {
  try {
    // 1. Frequently Purchased (Top 3 from this supplier)
    const freqItems = await prisma.purchaseOrderItem.groupBy({
      by: ['productId', 'variantId'],
      where: { purchaseOrder: { supplierId } },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 3
    });

    // 2. Low Stock Products supplied by this supplier
    const supplierProducts = await prisma.supplierProduct.findMany({
      where: { supplierId },
      select: { productId: true }
    });
    
    const productIds = supplierProducts.map(sp => sp.productId);
    
    let lowStockSuggestions: any[] = [];
    if (productIds.length > 0) {
      const lowStock = await prisma.product.findMany({
        where: { id: { in: productIds }, stock: { lte: prisma.product.fields.reorderPoint } },
        select: { id: true, name: true, sku: true, stock: true, reorderPoint: true },
        take: 3
      });
      lowStockSuggestions = lowStock;
    }

    return {
      success: true,
      data: {
        frequentlyPurchased: freqItems,
        lowStock: lowStockSuggestions
      }
    };
  } catch (error: any) {
    console.error('Failed to get AI recommendations:', error);
    return { success: false, error: error.message };
  }
}
