'use server';

import { prisma } from '@/lib/prisma';
import { TransferStatus } from '@prisma/client';
import { createStockLedgerEntry } from './stock-ledger-actions';
import { assertInventoryItems, assertQuantity, assertTransferTransition } from '@/lib/inventory/rules';
import { activeWarehouse, inventoryNumber, inventoryProduct, inventoryTransaction, refreshInventory, requireInventoryUser, syncInventoryReservations, transferAvailable } from '@/lib/inventory/server';

const message = (error: unknown) => error instanceof Error ? error.message : 'Inventory operation failed. Please try again.';

export async function getTransfers(params?: { status?: string; sourceId?: string; destinationId?: string; search?: string }) {
  try {
    await requireInventoryUser();
    const transfers = await prisma.warehouseTransfer.findMany({
      where: {
        ...(params?.status && Object.values(TransferStatus).includes(params.status as TransferStatus) && { status: params.status as TransferStatus }),
        ...(params?.sourceId && { sourceId: params.sourceId }),
        ...(params?.destinationId && { destinationId: params.destinationId }),
        ...(params?.search && { OR: [
          { transferNumber: { contains: params.search, mode: 'insensitive' as const } },
          { sourceWarehouse: { name: { contains: params.search, mode: 'insensitive' as const } } },
          { destWarehouse: { name: { contains: params.search, mode: 'insensitive' as const } } },
        ] }),
      },
      include: { sourceWarehouse: { select: { name: true, code: true } }, destWarehouse: { select: { name: true, code: true } }, _count: { select: { items: true } } },
      orderBy: { createdAt: 'desc' }, take: 200,
    });
    return { success: true, data: transfers };
  } catch (error) { return { success: false as const, error: message(error) }; }
}

export async function getTransferById(id: string) {
  try {
    await requireInventoryUser();
    const transfer = await prisma.warehouseTransfer.findUnique({ where: { id }, include: {
      sourceWarehouse: true, destWarehouse: true,
      items: { include: { product: { select: { name: true, sku: true, costPrice: true } }, variant: { select: { name: true, sku: true, costPrice: true } } } },
    } });
    if (!transfer) throw new Error('Transfer not found');
    return { success: true, data: transfer };
  } catch (error) { return { success: false as const, error: message(error) }; }
}

export async function getTransferStock(warehouseId: string, productId: string, variantId?: string) {
  try {
    await requireInventoryUser();
    const data = await inventoryTransaction(tx => transferAvailable(tx, warehouseId, productId, variantId));
    return { success: true as const, ...data };
  } catch (error) { return { success: false as const, error: message(error) }; }
}

export async function createTransfer(data: { sourceId: string; destinationId: string; note?: string; items: { productId: string; variantId?: string; quantity: number }[] }) {
  try {
    await requireInventoryUser();
    if (!data.sourceId || !data.destinationId || data.sourceId === data.destinationId) throw new Error('Select two different warehouses.');
    assertInventoryItems(data.items);
    data.items.forEach(i => assertQuantity(i.quantity, 'Transfer quantity', 1));
    const transfer = await inventoryTransaction(async tx => {
      await activeWarehouse(tx, data.sourceId);
      await activeWarehouse(tx, data.destinationId);
      const items = [];
      for (const item of data.items) {
        const product = await inventoryProduct(tx, item.productId, item.variantId);
        const stock = await transferAvailable(tx, data.sourceId, item.productId, item.variantId);
        if (item.quantity > stock.available) throw new Error(`${product.name}: only ${stock.available} units available to transfer.`);
        items.push({ productId: item.productId, variantId: item.variantId || null, quantity: item.quantity, unitCost: product.cost });
      }
      return tx.warehouseTransfer.create({ data: { transferNumber: inventoryNumber('TRN'), sourceId: data.sourceId, destinationId: data.destinationId, note: data.note?.trim(), status: 'DRAFT', items: { create: items } } });
    });
    refreshInventory();
    return { success: true, data: transfer };
  } catch (error) { return { success: false as const, error: message(error) }; }
}

export async function updateTransferStatus(id: string, newStatus: 'APPROVED' | 'IN_TRANSIT' | 'RECEIVED' | 'CANCELLED') {
  try {
    const actor = await requireInventoryUser();
    await inventoryTransaction(async tx => {
      const transfer = await tx.warehouseTransfer.findUnique({ where: { id }, include: { items: true } });
      if (!transfer) throw new Error('Transfer not found.');
      assertTransferTransition(transfer.status, newStatus);
      assertInventoryItems(transfer.items);
      if (newStatus !== 'CANCELLED') {
        await activeWarehouse(tx, transfer.sourceId);
        await activeWarehouse(tx, transfer.destinationId);
      }
      const claimed = await tx.warehouseTransfer.updateMany({ where: { id, status: transfer.status }, data: {
        status: newStatus, ...(newStatus === 'IN_TRANSIT' ? { dispatchedBy: actor } : {}), ...(newStatus === 'RECEIVED' ? { receivedBy: actor } : {}),
      } });
      if (claimed.count !== 1) throw new Error('This transfer has changed. Refresh and try again.');
      for (const item of transfer.items) {
        assertQuantity(item.quantity, 'Transfer quantity', 1);
        const base = { referenceId: id, productId: item.productId, variantId: item.variantId, createdBy: actor, affectsGlobalStock: false };
        if (newStatus === 'APPROVED' || newStatus === 'IN_TRANSIT') {
          const product = await inventoryProduct(tx, item.productId, item.variantId);
          const stock = await transferAvailable(tx, transfer.sourceId, item.productId, item.variantId, id);
          if (stock.available < item.quantity) throw new Error(`${product.name}: only ${stock.available} units available at the source. Reduce or cancel this draft and create a new transfer.`);
          if (newStatus === 'IN_TRANSIT') {
            await tx.warehouseTransferItem.update({ where: { id: item.id }, data: { unitCost: product.cost } });
            await createStockLedgerEntry({ ...base, referenceType: 'TRANSFER_DISPATCH', warehouseId: transfer.sourceId, outQty: item.quantity, unitCost: product.cost, remarks: `${transfer.transferNumber}: dispatched to destination` }, tx);
          }
        }
        if (newStatus === 'RECEIVED') {
          // Older transfers were marked in transit without posting an outbound ledger.
          const dispatch = await tx.stockLedger.findFirst({ where: { referenceId: id, referenceType: 'TRANSFER_DISPATCH', productId: item.productId, variantId: item.variantId } });
          if (!dispatch) {
            const stock = await transferAvailable(tx, transfer.sourceId, item.productId, item.variantId, id);
            if (stock.available < item.quantity) throw new Error('This legacy transfer has insufficient source stock. Reconcile the source warehouse first.');
            await createStockLedgerEntry({ ...base, referenceType: 'TRANSFER_DISPATCH', warehouseId: transfer.sourceId, outQty: item.quantity, unitCost: item.unitCost, remarks: `${transfer.transferNumber}: legacy dispatch recorded on receipt` }, tx);
          }
          await createStockLedgerEntry({ ...base, referenceType: 'TRANSFER_RECEIPT', warehouseId: transfer.destinationId, inQty: item.quantity, unitCost: dispatch?.unitCost ?? item.unitCost, remarks: `${transfer.transferNumber}: received at destination` }, tx);
        }
      }
      for (const productId of new Set(transfer.items.map(i => i.productId))) await syncInventoryReservations(tx, productId);
    });
    refreshInventory();
    return { success: true };
  } catch (error) { return { success: false as const, error: message(error) }; }
}
