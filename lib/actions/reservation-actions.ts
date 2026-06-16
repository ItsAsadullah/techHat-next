'use server';

import { prisma } from '@/lib/prisma';

export async function getReservedStock(productId: string, variantId?: string) {
  try {
    let reservedQty = 0;

    // 1. Reserved in Online/POS Orders (Not yet shipped/delivered)
    const orderItems = await prisma.orderItem.aggregate({
      where: {
        productId,
        ...(variantId && { variantId }),
        order: {
          status: {
            in: ['DRAFT', 'PENDING_PAYMENT', 'PENDING', 'CONFIRMED', 'PROCESSING', 'PACKED']
          }
        }
      },
      _sum: {
        quantity: true
      }
    });
    reservedQty += orderItems._sum.quantity || 0;

    // 2. Reserved in Warehouse Transfers (Approved or In Transit but not yet received)
    const warehouseTransferItems = await prisma.warehouseTransferItem.aggregate({
      where: {
        productId,
        ...(variantId && { variantId }),
        warehouseTransfer: {
          status: {
            in: ['APPROVED', 'IN_TRANSIT']
          }
        }
      },
      _sum: {
        quantity: true
      }
    });
    reservedQty += warehouseTransferItems._sum.quantity || 0;

    return { success: true, data: reservedQty };
  } catch (error: any) {
    console.error('Failed to get reserved stock:', error);
    return { success: false, data: 0, error: error.message };
  }
}

export async function getIncomingStock(productId: string, variantId?: string) {
  try {
    let incomingQty = 0;

    // 1. Incoming from Purchase Orders (Not yet fully received)
    const poItems = await prisma.purchaseOrderItem.findMany({
      where: {
        productId,
        ...(variantId && { variantId }),
        purchaseOrder: {
          status: {
            in: ['SUBMITTED', 'APPROVED', 'PARTIALLY_RECEIVED']
          }
        }
      },
      select: {
        quantity: true,
        receivedQty: true
      }
    });

    const pendingPoQty = poItems.reduce((sum, item) => sum + Math.max(0, item.quantity - item.receivedQty), 0);
    incomingQty += pendingPoQty;

    // 2. Incoming from Warehouse Transfers (In Transit to a destination)
    // Note: If we are calculating for a specific warehouse, we'd filter by destinationId.
    // For global product level, transfer is just moving physical stock, so it's not "incoming" globally unless we count it.
    // We'll skip transfers for global incoming, as it's already in the global physical stock.

    return { success: true, data: incomingQty };
  } catch (error: any) {
    console.error('Failed to get incoming stock:', error);
    return { success: false, data: 0, error: error.message };
  }
}

export async function getDamagedStock(productId: string, variantId?: string) {
  try {
    // 1. Damaged from Adjustments
    const stockAdjustments = await prisma.stockAdjustmentItem.aggregate({
      where: {
        productId,
        ...(variantId && { variantId }),
        stockAdjustment: {
          reason: 'DAMAGE',
          status: 'APPROVED'
        }
      },
      _sum: {
        quantity: true // This is usually negative, so we'll take Math.abs
      }
    });

    const damageQty = Math.abs(stockAdjustments._sum.quantity || 0);

    return { success: true, data: damageQty };
  } catch (error: any) {
    console.error('Failed to get damaged stock:', error);
    return { success: false, data: 0, error: error.message };
  }
}

export async function syncReservedStock(productId: string) {
  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { variants: true }
    });

    if (!product) return;

    if (product.variants.length > 0) {
      let totalReserved = 0;
      for (const variant of product.variants) {
        const { data: resQty } = await getReservedStock(productId, variant.id);
        const qty = typeof resQty === 'number' ? resQty : 0;
        await prisma.variant.update({
          where: { id: variant.id },
          data: { stock: qty }
        });
        totalReserved += qty;
      }
      
      await prisma.product.update({
        where: { id: productId },
        data: { stock: totalReserved }
      });
    } else {
      const { data: resQty } = await getReservedStock(productId);
      const qty = typeof resQty === 'number' ? resQty : 0;
      await prisma.product.update({
        where: { id: productId },
        data: { stock: qty }
      });
    }

  } catch (error: any) {
    console.error('Failed to sync reserved stock:', error);
  }
}
