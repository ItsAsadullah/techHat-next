'use server';

import { prisma } from '@/lib/prisma';
import { StockAdjustmentReason, StockAdjustmentStatus } from '@prisma/client';
import { createStockLedgerEntry } from '@/lib/actions/stock-ledger-actions';
import { adjustmentVariance, assertInventoryItems } from '@/lib/inventory/rules';
import { activeWarehouse, inventoryNumber, inventoryProduct, inventoryTransaction, refreshInventory, requireInventoryUser, transferAvailable, warehouseQuantity } from '@/lib/inventory/server';

export interface AdjustmentItemInput { productId: string; variantId?: string; systemQty: number; actualQty: number; adjustedQty: number; unitCost: number; }
export interface AdjustmentFormData { warehouseId: string; reason: StockAdjustmentReason; note?: string; items: AdjustmentItemInput[]; }
const message = (error: unknown) => error instanceof Error ? error.message : 'Inventory operation failed. Please try again.';

export async function getAdjustments({ page = 1, limit = 10, search = '', status }: { page?: number; limit?: number; search?: string; status?: string }) {
  try {
    await requireInventoryUser();
    page = Math.max(1, Math.floor(page) || 1);
    limit = Math.min(100, Math.max(1, Math.floor(limit) || 10));
    const where = { ...(search ? { adjustmentNumber: { contains: search, mode: 'insensitive' as const } } : {}), ...(status && Object.values(StockAdjustmentStatus).includes(status as StockAdjustmentStatus) ? { status: status as StockAdjustmentStatus } : {}) };
    const [adjustments, totalCount] = await Promise.all([
      prisma.stockAdjustment.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { date: 'desc' }, include: { warehouse: { select: { name: true } }, _count: { select: { items: true } } } }),
      prisma.stockAdjustment.count({ where }),
    ]);
    return { success: true, data: { adjustments, totalCount, totalPages: Math.ceil(totalCount / limit), currentPage: page } };
  } catch (error) { return { success: false, error: message(error) }; }
}

export async function getAdjustmentById(id: string) {
  try {
    await requireInventoryUser();
    const adj = await prisma.stockAdjustment.findUnique({ where: { id }, include: { warehouse: true, items: { include: { product: { select: { id: true, name: true, sku: true } }, variant: { select: { id: true, name: true, sku: true } } } } } });
    if (!adj) throw new Error('Adjustment not found');
    return { success: true, data: adj };
  } catch (error) { return { success: false, error: message(error) }; }
}

export async function createAdjustment(data: AdjustmentFormData) {
  try {
    await requireInventoryUser();
    assertInventoryItems(data.items);
    if (!data.note?.trim()) throw new Error('Add a note explaining the count or stock loss.');
    const created = await inventoryTransaction(async tx => {
      await activeWarehouse(tx, data.warehouseId);
      const items = [];
      for (const item of data.items) {
        const product = await inventoryProduct(tx, item.productId, item.variantId);
        const systemQty = await warehouseQuantity(tx, data.warehouseId, item.productId, item.variantId);
        if (systemQty !== item.systemQty) throw new Error(`${product.name}: stock changed from ${item.systemQty} to ${systemQty}. Remove this item, add it again and recount.`);
        const quantity = adjustmentVariance(systemQty, item.actualQty, data.reason);
        if (quantity === 0) continue;
        items.push({ productId: item.productId, variantId: item.variantId || null, systemQty, actualQty: item.actualQty, quantity, unitCost: product.cost });
      }
      if (!items.length) throw new Error('No stock differences to save. Enter the counted quantity for at least one item.');
      return tx.stockAdjustment.create({ data: { adjustmentNumber: inventoryNumber('ADJ'), warehouseId: data.warehouseId, reason: data.reason, note: data.note!.trim(), status: 'DRAFT', items: { create: items } } });
    });
    refreshInventory();
    return { success: true, message: 'Stock adjustment draft saved', id: created.id };
  } catch (error) { return { success: false, message: message(error) }; }
}

export async function getSystemQtyForAdjustment(productId: string, variantId?: string | null, warehouseId?: string) {
  try {
    await requireInventoryUser();
    if (!warehouseId) throw new Error('Select a warehouse first.');
    const qty = await warehouseQuantity(prisma, warehouseId, productId, variantId);
    return { success: true, qty };
  } catch (error) { return { success: false, qty: 0, error: message(error) }; }
}

export async function approveAdjustment(id: string) {
  try {
    const actor = await requireInventoryUser();
    await inventoryTransaction(async tx => {
      const adj = await tx.stockAdjustment.findUnique({ where: { id }, include: { items: true } });
      if (!adj || adj.status !== 'DRAFT') throw new Error('Only draft adjustments can be approved.');
      await activeWarehouse(tx, adj.warehouseId);
      assertInventoryItems(adj.items);
      const claimed = await tx.stockAdjustment.updateMany({ where: { id, status: 'DRAFT' }, data: { status: 'APPROVED', approvedBy: actor } });
      if (claimed.count !== 1) throw new Error('This adjustment has changed. Refresh and try again.');
      for (const item of adj.items) {
        if (item.systemQty === null || item.actualQty === null) throw new Error('This older draft has no saved count. Reject it and create a fresh count before approval.');
        const stock = await transferAvailable(tx, adj.warehouseId, item.productId, item.variantId);
        const movement = await tx.stockLedger.findFirst({ where: { warehouseId: adj.warehouseId, productId: item.productId, variantId: item.variantId, createdAt: { gt: adj.createdAt } }, select: { id: true } });
        if (movement || stock.physical !== item.systemQty) throw new Error('Stock changed after this count. Reject this draft and create a fresh adjustment.');
        const variance = adjustmentVariance(item.systemQty, item.actualQty, adj.reason);
        if (variance !== item.quantity || variance === 0) throw new Error('Invalid adjustment quantities. Create a fresh count.');
        if (variance < 0 && -variance > stock.available) throw new Error('This adjustment would consume reserved stock. Resolve the pending transfer or order before approving.');
        await createStockLedgerEntry({ referenceType: 'ADJUSTMENT', referenceId: id, warehouseId: adj.warehouseId, productId: item.productId, variantId: item.variantId, inQty: Math.max(0, variance), outQty: Math.max(0, -variance), unitCost: item.unitCost, remarks: `${adj.adjustmentNumber}: ${adj.reason} — ${adj.note || ''}`, createdBy: actor }, tx);
      }
    });
    refreshInventory();
    return { success: true };
  } catch (error) { return { success: false, error: message(error) }; }
}

export async function rejectAdjustment(id: string) {
  try {
    await requireInventoryUser();
    const result = await prisma.stockAdjustment.updateMany({ where: { id, status: { in: ['DRAFT', 'PENDING_APPROVAL'] } }, data: { status: 'REJECTED' } });
    if (result.count !== 1) throw new Error('Only unapproved adjustments can be rejected.');
    refreshInventory();
    return { success: true };
  } catch (error) { return { success: false, error: message(error) }; }
}
