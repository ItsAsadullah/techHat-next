'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { createStockLedgerEntry } from './stock-ledger-actions';

export async function getPurchaseReturns(params?: { status?: string, supplierId?: string }) {
  try {
    const returns = await prisma.purchaseReturn.findMany({
      where: {
        ...(params?.status && { status: params.status as any }),
        ...(params?.supplierId && { supplierId: params.supplierId }),
      },
      include: {
        supplier: { select: { name: true } },
        purchaseOrder: { select: { poNumber: true } },
        warehouse: { select: { name: true } },
        _count: { select: { items: true } }
      },
      orderBy: { date: 'desc' }
    });
    return { success: true, data: returns };
  } catch (error: any) {
    console.error('Failed to get purchase returns:', error);
    return { success: false, error: error.message };
  }
}

export async function getPurchaseReturnById(id: string) {
  try {
    const pr = await prisma.purchaseReturn.findUnique({
      where: { id },
      include: {
        supplier: true,
        purchaseOrder: true,
        warehouse: true,
        items: {
          include: {
            product: { select: { name: true, sku: true } },
            variant: { select: { name: true, sku: true } }
          }
        }
      }
    });
    if (!pr) throw new Error('Purchase Return not found');
    return { success: true, data: pr };
  } catch (error: any) {
    console.error('Failed to get purchase return:', error);
    return { success: false, error: error.message };
  }
}

export async function createPurchaseReturn(data: {
  supplierId: string;
  purchaseOrderId: string;
  warehouseId: string;
  reason?: string;
  items: { productId: string; variantId?: string; returnQty: number; unitCost: number }[];
}) {
  try {
    const newReturn = await prisma.$transaction(async (tx) => {
      const count = await tx.purchaseReturn.count();
      const returnNumber = `PR-${new Date().getFullYear()}${(new Date().getMonth() + 1).toString().padStart(2, '0')}-${(count + 1).toString().padStart(4, '0')}`;

      const pr = await tx.purchaseReturn.create({
        data: {
          returnNumber,
          supplierId: data.supplierId,
          purchaseOrderId: data.purchaseOrderId,
          warehouseId: data.warehouseId,
          reason: data.reason,
          status: 'DRAFT',
          items: {
            create: data.items.map(item => ({
              productId: item.productId,
              variantId: item.variantId,
              returnQty: item.returnQty,
              unitCost: item.unitCost,
            }))
          }
        }
      });

      return pr;
    });

    revalidatePath('/admin/purchases/returns');
    return { success: true, data: newReturn };
  } catch (error: any) {
    console.error('Failed to create purchase return:', error);
    return { success: false, error: error.message };
  }
}

export async function updatePurchaseReturnStatus(id: string, newStatus: 'APPROVED' | 'RETURNED' | 'CLOSED' | 'CANCELLED') {
  try {
    const pr = await prisma.purchaseReturn.findUnique({
      where: { id },
      include: { items: true, warehouse: true, supplier: true }
    });

    if (!pr) throw new Error('Purchase Return not found');
    if (pr.status === 'CLOSED') throw new Error('Cannot modify a closed return');
    
    // Ensure we don't double process
    if (pr.status === 'RETURNED' && newStatus === 'RETURNED') {
      throw new Error('Already returned');
    }

    await prisma.$transaction(async (tx) => {
      await tx.purchaseReturn.update({
        where: { id },
        data: { status: newStatus }
      });

      // If status transitions to RETURNED, execute stock ledger OUT entries
      if (newStatus === 'RETURNED') {
        for (const item of pr.items) {
          await createStockLedgerEntry({
            referenceType: 'RETURN', // Enum should support RETURN. If not, map to a supported OUT type like ADJUSTMENT
            referenceId: pr.id,
            warehouseId: pr.warehouseId,
            productId: item.productId,
            variantId: item.variantId || undefined,
            outQty: item.returnQty, // Deducting stock
            inQty: 0,
            unitCost: item.unitCost, // Reversing at original cost
            remarks: `Purchase Return OUT to Supplier ${pr.supplier.name} (PR: ${pr.returnNumber})`,
            createdBy: 'System'
          }, tx);
        }
      }
    });

    revalidatePath(`/admin/purchases/returns/${id}`);
    revalidatePath('/admin/purchases/returns');
    return { success: true };
  } catch (error: any) {
    console.error('Failed to update purchase return status:', error);
    return { success: false, error: error.message };
  }
}
