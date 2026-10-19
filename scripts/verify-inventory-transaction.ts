// Integration verification with isolated fixtures. Every write is rolled back.
import { loadEnvConfig } from '@next/env';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';

async function main() {
  loadEnvConfig(process.cwd(), true);
  const { prisma } = await import('../lib/prisma');
  const { createStockLedgerEntry } = await import('../lib/actions/stock-ledger-actions');
  const { warehouseQuantity, transferAvailable, syncInventoryReservations } = await import('../lib/inventory/server');
  const suffix = randomUUID();
  const rollback = new Error('ROLLBACK_INVENTORY_VERIFICATION');
  let productId = '';
  try {
    try {
      await prisma.$transaction(async tx => {
        const category = await tx.category.create({ data: { name: 'Inventory verification', slug: `inventory-check-${suffix}` } });
        const product = await tx.product.create({ data: { name: 'Inventory verification', slug: `inventory-check-${suffix}`, sku: `CHECK-${suffix}`, categoryId: category.id, price: 20, images: [], tags: [] } });
        productId = product.id;
        const source = await tx.warehouse.create({ data: { name: 'Verification source', code: `CHECK-S-${suffix}` } });
        const destination = await tx.warehouse.create({ data: { name: 'Verification destination', code: `CHECK-D-${suffix}` } });
        const base = { productId, warehouseId: source.id, referenceId: suffix };
        await createStockLedgerEntry({ ...base, referenceType: 'GRN', inQty: 10, unitCost: 10 }, tx);
        const transfer = await tx.warehouseTransfer.create({ data: { transferNumber: `CHECK-${suffix}`, sourceId: source.id, destinationId: destination.id, status: 'APPROVED', items: { create: { productId, quantity: 4, unitCost: 10 } } } });
        await syncInventoryReservations(tx, productId);
        assert.equal((await transferAvailable(tx, source.id, productId)).available, 6);
        await tx.warehouseTransfer.update({ where: { id: transfer.id }, data: { status: 'IN_TRANSIT' } });
        await createStockLedgerEntry({ ...base, referenceId: transfer.id, referenceType: 'TRANSFER_DISPATCH', outQty: 4, unitCost: 10, affectsGlobalStock: false }, tx);
        assert.equal(await warehouseQuantity(tx, source.id, productId), 6);
        assert.equal((await transferAvailable(tx, source.id, productId)).available, 6);
        assert.equal((await tx.product.findUniqueOrThrow({ where: { id: productId } })).stock, 10);
        await tx.warehouseTransfer.update({ where: { id: transfer.id }, data: { status: 'RECEIVED' } });
        await createStockLedgerEntry({ ...base, warehouseId: destination.id, referenceId: transfer.id, referenceType: 'TRANSFER_RECEIPT', inQty: 4, unitCost: 10, affectsGlobalStock: false }, tx);
        await syncInventoryReservations(tx, productId);
        assert.equal(await warehouseQuantity(tx, destination.id, productId), 4);
        const owned = await tx.product.findUniqueOrThrow({ where: { id: productId } });
        assert.equal(owned.stock, 10);
        assert.equal(owned.reservedStock, 0);
        assert.equal(owned.costPrice, 10);
        const count = await tx.stockAdjustment.create({ data: { adjustmentNumber: `CHECK-${suffix}`, warehouseId: destination.id, reason: 'COUNT', items: { create: { productId, systemQty: 4, actualQty: 3, quantity: -1, unitCost: 10 } } }, include: { items: true } });
        assert.equal(count.items[0].systemQty, 4);
        assert.equal(count.items[0].actualQty, 3);
        await createStockLedgerEntry({ ...base, warehouseId: destination.id, referenceType: 'ADJUSTMENT', referenceId: count.id, outQty: 1, unitCost: 10 }, tx);
        assert.equal(await warehouseQuantity(tx, destination.id, productId), 3);
        assert.equal((await tx.product.findUniqueOrThrow({ where: { id: productId } })).stock, 9);
        throw rollback;
      }, { isolationLevel: 'Serializable', timeout: 60000 });
    } catch (error) { if (error !== rollback) throw error; }
    assert.equal(await prisma.product.count({ where: { id: productId } }), 0);
    assert.equal(await prisma.warehouse.count({ where: { code: { endsWith: suffix } } }), 0);
    console.log('PASS: receipt, reservation, dispatch, destination receipt, count snapshots and adjustment. All fixtures rolled back.');
  } finally { await prisma.$disconnect(); }
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
