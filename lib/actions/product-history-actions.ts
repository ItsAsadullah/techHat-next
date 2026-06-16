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
