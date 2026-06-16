'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { createStockLedgerEntry } from './stock-ledger-actions';

export async function getTransfers(params?: { status?: string, sourceId?: string, destinationId?: string }) {
  try {
    const transfers = await prisma.warehouseTransfer.findMany({
      where: {
        ...(params?.status && { status: params.status as any }),
        ...(params?.sourceId && { sourceId: params.sourceId }),
        ...(params?.destinationId && { destinationId: params.destinationId }),
      },
      include: {
        sourceWarehouse: { select: { name: true, code: true } },
        destWarehouse: { select: { name: true, code: true } },
        _count: { select: { items: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    return { success: true, data: transfers };
  } catch (error: any) {
    console.error('Failed to get transfers:', error);
    return { success: false, error: error.message };
  }
}

export async function getTransferById(id: string) {
  try {
    const transfer = await prisma.warehouseTransfer.findUnique({
      where: { id },
      include: {
        sourceWarehouse: true,
        destWarehouse: true,
        items: {
          include: {
            product: { select: { name: true, sku: true, costPrice: true } },
            variant: { select: { name: true, sku: true, costPrice: true } }
          }
        }
      }
    });
    if (!transfer) throw new Error('Transfer not found');
    return { success: true, data: transfer };
  } catch (error: any) {
    console.error('Failed to get transfer:', error);
    return { success: false, error: error.message };
  }
}

export async function createTransfer(data: {
  sourceId: string;
  destinationId: string;
  unitCost?: number;
  note?: string;
  items: { productId: string; variantId?: string; quantity: number }[];
}) {
  try {
    if (data.sourceId === data.destinationId) {
      throw new Error('Source and destination cannot be the same');
    }

    const transfer = await prisma.$transaction(async (tx) => {
      // Generate transfer number
      const count = await tx.warehouseTransfer.count();
      const transferNumber = `TRN-${new Date().getFullYear()}${(new Date().getMonth() + 1).toString().padStart(2, '0')}-${(count + 1).toString().padStart(4, '0')}`;

      // Create transfer header
      const newTransfer = await tx.warehouseTransfer.create({
        data: {
          transferNumber,
          sourceId: data.sourceId,
          destinationId: data.destinationId,
          note: data.note,
          status: 'DRAFT',
          items: {
            create: data.items.map(item => ({
              productId: item.productId,
              variantId: item.variantId,
              quantity: item.quantity,
            }))
          }
        }
      });

      return newTransfer;
    });

    revalidatePath('/admin/inventory/transfers');
    return { success: true, data: transfer };
  } catch (error: any) {
    console.error('Failed to create transfer:', error);
    return { success: false, error: error.message };
  }
}

export async function updateTransferStatus(id: string, newStatus: 'APPROVED' | 'IN_TRANSIT' | 'RECEIVED' | 'CANCELLED') {
  try {
    const transfer = await prisma.warehouseTransfer.findUnique({
      where: { id },
      include: { items: true }
    });

    if (!transfer) throw new Error('Transfer not found');
    if (transfer.status === 'RECEIVED') throw new Error('Transfer is already received and cannot be modified');
    if (transfer.status === 'CANCELLED') throw new Error('Transfer is cancelled');

    await prisma.$transaction(async (tx) => {
      await tx.warehouseTransfer.update({
        where: { id },
        data: { status: newStatus }
      });

      // If received, process the stock ledgers
      if (newStatus === 'RECEIVED') {
        for (const item of transfer.items) {
          // 1. OUT from Source
          await createStockLedgerEntry({
            referenceType: 'TRANSFER',
            referenceId: transfer.id,
            warehouseId: transfer.sourceId,
            productId: item.productId,
            variantId: item.variantId || undefined,
            outQty: item.quantity,
            inQty: 0,
            remarks: `Transfer OUT to ${transfer.destinationId} (TRN: ${transfer.transferNumber})`,
            createdBy: 'System'
          }, tx);

          // 2. IN to Destination
          await createStockLedgerEntry({
            referenceType: 'TRANSFER',
            referenceId: transfer.id,
            warehouseId: transfer.destinationId,
            productId: item.productId,
            variantId: item.variantId || undefined,
            inQty: item.quantity,
            outQty: 0,
            remarks: `Transfer IN from ${transfer.sourceId} (TRN: ${transfer.transferNumber})`,
            createdBy: 'System'
          }, tx);
        }
      }
    });

    try {
      const { syncReservedStock } = await import('./reservation-actions');
      await Promise.all(transfer.items.map(item => syncReservedStock(item.productId)));
    } catch (e) {
      console.error('Failed to sync reserved stock:', e);
    }

    revalidatePath(`/admin/inventory/transfers/${id}`);
    revalidatePath('/admin/inventory/transfers');
    return { success: true };
  } catch (error: any) {
    console.error('Failed to update transfer status:', error);
    return { success: false, error: error.message };
  }
}
