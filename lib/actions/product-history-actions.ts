'use server';

import { prisma } from '@/lib/prisma';

export async function getProductPurchaseHistory(productId: string) {
  try {
    const poItems = await prisma.purchaseOrderItem.findMany({
      where: { productId },
      include: {
        purchaseOrder: {
          select: {
            id: true,
            poNumber: true,
            date: true,
            status: true,
            supplier: { select: { name: true } },
            warehouse: { select: { name: true } },
          }
        },
        variant: { select: { name: true } }
      },
      orderBy: { purchaseOrder: { date: 'desc' } },
      take: 50,
    });
    return { success: true, data: poItems };
  } catch (error: any) {
    console.error('Failed to get product purchase history:', error);
    return { success: false, data: [], error: error.message };
  }
}

export async function getProductGRNHistory(productId: string) {
  try {
    const grnItems = await prisma.goodsReceiveNoteItem.findMany({
      where: { productId },
      include: {
        goodsReceiveNote: {
          select: {
            id: true,
            grnNumber: true,
            receivedDate: true,
            status: true,
            supplier: { select: { name: true } },
            warehouse: { select: { name: true } },
          }
        },
        variant: { select: { name: true } }
      },
      orderBy: { goodsReceiveNote: { receivedDate: 'desc' } },
      take: 50,
    });
    return { success: true, data: grnItems };
  } catch (error: any) {
    console.error('Failed to get product GRN history:', error);
    return { success: false, data: [], error: error.message };
  }
}

export async function getProductStockHistory(productId: string) {
  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        name: true,
        sku: true,
        model: true,
        stock: true,
        costPrice: true,
        lastPurchaseCost: true,
        minStock: true,
        reorderPoint: true,
        soldCount: true,
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
    });

    const ledgerEntries = await prisma.stockLedger.findMany({
      where: { productId },
      include: {
        warehouse: { select: { id: true, name: true, code: true } },
        variant: { select: { id: true, name: true, sku: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const legacyHistory = await prisma.stockHistory.findMany({
      where: { productId },
      include: {
        variant: { select: { id: true, name: true, sku: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const grnItems = await prisma.goodsReceiveNoteItem.findMany({
      where: { productId },
      include: {
        goodsReceiveNote: {
          select: {
            id: true,
            grnNumber: true,
            receivedDate: true,
            status: true,
            supplier: { select: { name: true } },
            warehouse: { select: { name: true } },
            purchaseOrder: { select: { id: true, poNumber: true } },
          },
        },
        variant: { select: { name: true } },
      },
      orderBy: { goodsReceiveNote: { receivedDate: 'desc' } },
      take: 50,
    });

    const poItems = await prisma.purchaseOrderItem.findMany({
      where: { productId },
      include: {
        purchaseOrder: {
          select: {
            id: true,
            poNumber: true,
            date: true,
            status: true,
            supplier: { select: { name: true } },
            warehouse: { select: { name: true } },
          },
        },
        variant: { select: { name: true } },
      },
      orderBy: { purchaseOrder: { date: 'desc' } },
      take: 50,
    });

    const orderItems = await prisma.orderItem.findMany({
      where: { productId },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
            isPos: true,
            customerName: true,
            createdAt: true,
          },
        },
        variant: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    // Build unified movements list combining StockLedger + deduplicated legacy StockHistory + online OrderItems not in ledger
    const ledgerRefIds = new Set(ledgerEntries.map((e) => e.referenceId));

    const unifiedMovements: {
      id: string;
      createdAt: Date | string;
      referenceType: string;
      referenceId: string;
      warehouseName: string;
      warehouseCode: string;
      variantName: string | null;
      openingQty: number;
      inQty: number;
      outQty: number;
      balanceQty: number;
      unitCost: number;
      totalValue: number;
      note: string | null;
    }[] = ledgerEntries.map((entry) => ({
      id: entry.id,
      createdAt: entry.createdAt,
      referenceType: entry.referenceType,
      referenceId: entry.referenceId,
      warehouseName: entry.warehouse?.name || 'Main',
      warehouseCode: entry.warehouse?.code || 'MAIN',
      variantName: entry.variant?.name || null,
      openingQty: entry.balanceQty - entry.inQty + entry.outQty,
      inQty: entry.inQty,
      outQty: entry.outQty,
      balanceQty: entry.balanceQty,
      unitCost: entry.unitCost,
      totalValue: entry.totalValue,
      note: entry.note,
    }));

    for (const h of legacyHistory) {
      // Skip if this POS sale was already recorded in StockLedger
      const extractedOrderNum = h.note?.replace(/^Order:\s*/i, '').trim();
      if (extractedOrderNum && ledgerRefIds.has(extractedOrderNum)) continue;

      const inQty = h.action === 'ADD' ? h.quantity : h.action === 'ADJUST' && h.newStock > h.previousStock ? h.newStock - h.previousStock : 0;
      const outQty = h.action === 'REDUCE' ? h.quantity : h.action === 'ADJUST' && h.previousStock > h.newStock ? h.previousStock - h.newStock : 0;

      unifiedMovements.push({
        id: `hist-${h.id}`,
        createdAt: h.createdAt,
        referenceType: h.reason || h.action,
        referenceId: extractedOrderNum || h.source || 'MANUAL',
        warehouseName: 'Main',
        warehouseCode: 'MAIN',
        variantName: h.variant?.name || null,
        openingQty: h.previousStock,
        inQty,
        outQty,
        balanceQty: h.newStock,
        unitCost: product?.costPrice || 0,
        totalValue: (inQty || outQty) * (product?.costPrice || 0),
        note: [h.reason, h.note, h.source ? `Source: ${h.source}` : null].filter(Boolean).join(' • '),
      });
    }

    for (const oi of orderItems) {
      if (!oi.order || oi.order.status === 'CANCELLED') continue;
      if (ledgerRefIds.has(oi.order.orderNumber) || ledgerRefIds.has(oi.order.id)) continue;
      // Also check if already added via legacyHistory
      if (unifiedMovements.some((m) => m.referenceId === oi.order.orderNumber)) continue;

      unifiedMovements.push({
        id: `ord-${oi.id}`,
        createdAt: oi.createdAt,
        referenceType: oi.order.isPos ? 'POS Sale' : 'ONLINE_SALE',
        referenceId: oi.order.orderNumber,
        warehouseName: 'Main',
        warehouseCode: 'MAIN',
        variantName: oi.variant?.name || null,
        openingQty: 0,
        inQty: 0,
        outQty: oi.quantity,
        balanceQty: product?.stock || 0,
        unitCost: product?.costPrice || 0,
        totalValue: oi.total,
        note: `${oi.order.isPos ? 'POS' : 'Online'} Order #${oi.order.orderNumber}${oi.order.customerName ? ` — ${oi.order.customerName}` : ''} (${oi.order.status})`,
      });
    }

    unifiedMovements.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const totalIn = unifiedMovements.reduce((sum, m) => sum + (m.inQty || 0), 0);
    const totalOut = unifiedMovements.reduce((sum, m) => sum + (m.outQty || 0), 0);

    return {
      success: true,
      product,
      movements: unifiedMovements,
      grnItems,
      poItems,
      orderItems,
      summary: {
        currentStock: product?.stock ?? 0,
        totalIn,
        totalOut,
        costPrice: product?.costPrice ?? 0,
        lastPurchaseCost: product?.lastPurchaseCost ?? 0,
      },
    };
  } catch (error: any) {
    console.error('Failed to get product stock history:', error);
    return {
      success: false,
      product: null,
      movements: [],
      grnItems: [],
      poItems: [],
      orderItems: [],
      summary: { currentStock: 0, totalIn: 0, totalOut: 0, costPrice: 0, lastPurchaseCost: 0 },
      error: error.message,
    };
  }
}

