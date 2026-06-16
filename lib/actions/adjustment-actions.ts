'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { StockAdjustmentReason } from '@prisma/client';
import { createStockLedgerEntry } from '@/lib/actions/stock-ledger-actions';

export interface AdjustmentItemInput {
  productId: string;
  variantId?: string;
  systemQty: number;
  actualQty: number;
  adjustedQty: number;
  unitCost: number;
}

export interface AdjustmentFormData {
  warehouseId: string;
  reason: StockAdjustmentReason;
  note?: string;
  items: AdjustmentItemInput[];
}

export async function getAdjustments({
  page = 1,
  limit = 10,
  search = '',
  status,
}: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}) {
  try {
    const where: any = {};
    if (search) {
      where.adjustmentNumber = { contains: search, mode: 'insensitive' };
    }
    if (status) {
      where.status = status;
    }

    const skip = (page - 1) * limit;

    const [adjustments, totalCount] = await Promise.all([
      prisma.stockAdjustment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: 'desc' },
        include: {
          warehouse: { select: { name: true } },
          _count: { select: { items: true } }
        }
      }),
      prisma.stockAdjustment.count({ where }),
    ]);

    return {
      success: true,
      data: {
        adjustments,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page,
      },
    };
  } catch (error: any) {
    console.error('Failed to get adjustments:', error);
    return { success: false, error: error.message };
  }
}

export async function getAdjustmentById(id: string) {
  try {
    const adj = await prisma.stockAdjustment.findUnique({
      where: { id },
      include: {
        warehouse: true,
        items: {
          include: {
            product: { select: { id: true, name: true, sku: true, stock: true } },
            productVariant: { select: { id: true, name: true, sku: true, stock: true } }
          }
        }
      },
    });

    if (!adj) throw new Error('Adjustment not found');

    return { success: true, data: adj };
  } catch (error: any) {
    console.error('Failed to get adjustment:', error);
    return { success: false, error: error.message };
  }
}

export async function createAdjustment(data: AdjustmentFormData) {
  try {
    const createdAdj = await prisma.$transaction(async (tx) => {
      // 1. Generate Adjustment Number
      const count = await tx.stockAdjustment.count();
      const adjNumber = `ADJ-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(count + 1).padStart(4, '0')}`;

      // 2. Create Adjustment Draft
      const adj = await tx.stockAdjustment.create({
        data: {
          adjustmentNumber: adjNumber,
          warehouseId: data.warehouseId,
          reason: data.reason,
          note: data.note,
          status: 'DRAFT',
          items: {
            create: data.items.map(item => ({
              productId: item.productId,
              variantId: item.variantId || null,
              systemQty: item.systemQty,
              actualQty: item.actualQty,
              adjustedQty: item.adjustedQty,
              unitCost: item.unitCost,
            }))
          }
        },
      });
      return adj;
    });

    return { success: true, message: 'Stock adjustment created successfully', id: createdAdj.id };
  } catch (error: any) {
    console.error('Error creating adjustment:', error);
    return { success: false, message: error.message || 'Failed to create adjustment' };
  }
}

export async function getSystemQtyForAdjustment(productId: string, variantId?: string | null, warehouseId?: string) {
  try {
    const whereClause: any = { productId };
    if (variantId) whereClause.variantId = variantId;
    if (warehouseId) whereClause.warehouseId = warehouseId;

    const aggregate = await prisma.stockLedger.aggregate({
      _sum: {
        inQty: true,
        outQty: true,
      },
      where: whereClause
    });

    const totalIn = aggregate._sum.inQty || 0;
    const totalOut = aggregate._sum.outQty || 0;
    
    return { success: true, qty: totalIn - totalOut };
  } catch (error) {
    console.error('Error fetching system qty:', error);
    return { success: false, qty: 0 };
  }
}

export async function approveAdjustment(id: string) {
  try {
    return await prisma.$transaction(async (tx) => {
      const adj = await tx.stockAdjustment.findUnique({
        where: { id },
        include: { items: true }
      });

      if (!adj) throw new Error('Adjustment not found');
      if (adj.status !== 'DRAFT') throw new Error('Only DRAFT adjustments can be approved');

      // Update Adjustment Status
      const updatedAdj = await tx.stockAdjustment.update({
        where: { id },
        data: { status: 'APPROVED' } // we can set approvedBy here if auth is hooked up
      });

      // Process each Item using canonical Ledger Engine
      for (const item of adj.items) {
        if (item.adjustedQty === 0) continue;

        // Use createStockLedgerEntry — handles MAC calculation, stock cache update
        // and immutable ledger creation in one atomic step.
        await createStockLedgerEntry(
          {
            referenceType: 'ADJUSTMENT',
            referenceId: adj.id,
            warehouseId: adj.warehouseId,
            productId: item.productId,
            variantId: item.variantId || null,
            inQty: item.adjustedQty > 0 ? item.adjustedQty : 0,
            outQty: item.adjustedQty < 0 ? Math.abs(item.adjustedQty) : 0,
            unitCost: item.unitCost,
            remarks: `Adjustment ${adj.adjustmentNumber} - ${adj.reason}`,
          },
          tx
        );
      }

      revalidatePath('/admin/inventory');
      revalidatePath('/admin/inventory/adjustments');

      return { success: true, data: updatedAdj };
    });
  } catch (error: any) {
    console.error('Failed to approve adjustment:', error);
    return { success: false, error: error.message };
  }
}
