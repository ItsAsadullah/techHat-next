import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Prisma, StockLedger } from '@prisma/client';
import { adjustmentVariance, assertInventoryItems, assertQuantity, assertTransferTransition } from '../lib/inventory/rules';
import { createStockLedgerEntry } from '../lib/actions/stock-ledger-actions';
import { syncInventoryReservations, transferAvailable } from '../lib/inventory/server';

test('transfer lifecycle only permits ordered steps and cancellation before dispatch', () => {
  for (const [from, to] of [['DRAFT', 'APPROVED'], ['APPROVED', 'IN_TRANSIT'], ['IN_TRANSIT', 'RECEIVED'], ['DRAFT', 'CANCELLED'], ['APPROVED', 'CANCELLED']]) assert.doesNotThrow(() => assertTransferTransition(from, to));
  for (const [from, to] of [['DRAFT', 'RECEIVED'], ['DRAFT', 'IN_TRANSIT'], ['IN_TRANSIT', 'CANCELLED'], ['APPROVED', 'APPROVED'], ['RECEIVED', 'RECEIVED'], ['CANCELLED', 'APPROVED']]) assert.throws(() => assertTransferTransition(from, to));
});

test('quantities reject negative, fractional, non-finite and database-overflow values', () => {
  for (const quantity of [-1, 0.5, NaN, Infinity, 2147483648]) assert.throws(() => assertQuantity(quantity, 'Quantity'));
  assert.throws(() => assertQuantity(0, 'Transfer', 1));
  assert.doesNotThrow(() => assertQuantity(0, 'Count'));
});

test('duplicate SKUs cannot evade availability checks; separate variants are allowed', () => {
  assert.throws(() => assertInventoryItems([]));
  assert.throws(() => assertInventoryItems([{ productId: 'a' }, { productId: 'a', variantId: '' }]));
  assert.doesNotThrow(() => assertInventoryItems([{ productId: 'a', variantId: 'v1' }, { productId: 'a', variantId: 'v2' }]));
});

test('counts derive variance and loss reasons can never add stock', () => {
  assert.equal(adjustmentVariance(10, 8, 'COUNT'), -2);
  assert.equal(adjustmentVariance(10, 12, 'COUNT'), 2);
  assert.equal(adjustmentVariance(10, 0, 'DAMAGE'), -10);
  for (const reason of ['DAMAGE', 'THEFT', 'EXPIRED']) assert.throws(() => adjustmentVariance(10, 11, reason));
  assert.throws(() => adjustmentVariance(10, -1, 'COUNT'));
  assert.throws(() => adjustmentVariance(10, 8, 'UNKNOWN'));
});

function ledgerFixture({ stock = 100, variantStock = 10, warehouseStock = 10, cost = 10 } = {}) {
  const entries: Record<string, unknown>[] = [];
  const productUpdates: Record<string, unknown>[] = [];
  const variantUpdates: Record<string, unknown>[] = [];
  const tx = {
    product: { findUnique: async () => ({ stock, costPrice: cost, productVariantType: 'variable' }), update: async ({ data }: { data: Record<string, unknown> }) => { productUpdates.push(data); } },
    variant: { findUnique: async () => ({ stock: variantStock, costPrice: cost, productId: 'p1' }), update: async ({ data }: { data: Record<string, unknown> }) => { variantUpdates.push(data); } },
    stockLedger: {
      aggregate: async () => ({ _sum: { inQty: warehouseStock, outQty: 0 } }),
      create: async ({ data }: { data: Record<string, unknown> }) => { entries.push(data); return data as unknown as StockLedger; },
    },
  } as unknown as Prisma.TransactionClient;
  return { tx, entries, productUpdates, variantUpdates };
}
const movement = { referenceType: 'ADJUSTMENT', referenceId: 'adj1', warehouseId: 'w1', productId: 'p1' };

test('dispatch reduces warehouse balance without changing global ownership or purchase costs', async () => {
  const f = ledgerFixture();
  await createStockLedgerEntry({ ...movement, referenceType: 'TRANSFER_DISPATCH', outQty: 4, affectsGlobalStock: false }, f.tx);
  assert.equal(f.entries[0].balanceQty, 6);
  assert.equal(f.entries[0].totalValue, 40);
  assert.equal(f.productUpdates.length, 0);
  assert.equal(f.variantUpdates.length, 0);
});

test('receipt increases destination balance without double-counting global stock', async () => {
  const f = ledgerFixture({ warehouseStock: 3 });
  await createStockLedgerEntry({ ...movement, referenceType: 'TRANSFER_RECEIPT', inQty: 4, unitCost: 10, affectsGlobalStock: false }, f.tx);
  assert.equal(f.entries[0].balanceQty, 7);
  assert.equal(f.productUpdates.length, 0);
});

test('insufficient warehouse stock fails before any ledger or cached-stock write', async () => {
  const f = ledgerFixture({ warehouseStock: 3 });
  await assert.rejects(createStockLedgerEntry({ ...movement, outQty: 4 }, f.tx), /below 0/);
  assert.equal(f.entries.length, 0);
  assert.equal(f.productUpdates.length, 0);
});

test('variant moving-average cost uses variant stock rather than parent total', async () => {
  const f = ledgerFixture({ stock: 100, variantStock: 10, cost: 10 });
  await createStockLedgerEntry({ ...movement, variantId: 'v1', inQty: 10, unitCost: 20 }, f.tx);
  assert.equal(f.variantUpdates[0].costPrice, 15);
  assert.deepEqual(f.productUpdates[0].stock, { increment: 10 });
});

test('explicit zero cost stays zero and mismatched variants cannot write stock', async () => {
  const f = ledgerFixture();
  await createStockLedgerEntry({ ...movement, inQty: 2, unitCost: 0 }, f.tx);
  assert.equal(f.entries[0].unitCost, 0);
  const invalid = ledgerFixture();
  await assert.rejects(createStockLedgerEntry({ ...movement, productId: 'other', variantId: 'v1', inQty: 1 }, invalid.tx), /does not belong/);
  assert.equal(invalid.entries.length, 0);
});

test('ledger rejects ambiguous movements and negative costs', async () => {
  for (const quantities of [{ inQty: 1, outQty: 1 }, { inQty: -1 }, { outQty: 0.5 }, { inQty: 0, outQty: 0 }, { inQty: 1, unitCost: -10 }]) {
    const f = ledgerFixture();
    await assert.rejects(createStockLedgerEntry({ ...movement, ...quantities }, f.tx));
    assert.equal(f.entries.length, 0);
  }
});

function availabilityFixture({ physical = 6, globalStock = 10, reserved = 4, dispatched = 4, orders = 0 } = {}) {
  const updates: Record<string, unknown>[] = [];
  return { updates, tx: {
    stockLedger: { aggregate: async ({ where }: { where: { referenceType?: string } }) => ({ _sum: where.referenceType ? { outQty: dispatched } : { inQty: physical, outQty: 0 } }) },
    warehouseTransfer: { findMany: async () => [{ id: 'transfer' }] },
    warehouseTransferItem: { aggregate: async () => ({ _sum: { quantity: reserved } }) },
    orderItem: { aggregate: async () => ({ _sum: { quantity: orders } }) },
    product: { findUnique: async () => ({ stock: globalStock }), update: async ({ data }: { data: Record<string, unknown> }) => { updates.push(data); } },
  } as unknown as Prisma.TransactionClient };
}

test('in-transit reservations are not deducted from source stock twice', async () => {
  const f = availabilityFixture();
  assert.deepEqual(await transferAvailable(f.tx, 'w1', 'p1'), { physical: 6, available: 6 });
});

test('legacy undisbursed transfers and customer orders still protect stock', async () => {
  const legacy = availabilityFixture({ physical: 10, dispatched: 0 });
  assert.equal((await transferAvailable(legacy.tx, 'w1', 'p1')).available, 6);
  const orders = availabilityFixture({ orders: 3 });
  assert.equal((await transferAvailable(orders.tx, 'w1', 'p1')).available, 3);
});

test('reservation synchronization only writes reservedStock, never physical stock', async () => {
  const f = availabilityFixture({ reserved: 4, orders: 3 });
  await syncInventoryReservations(f.tx, 'p1');
  assert.deepEqual(f.updates, [{ reservedStock: 7 }]);
});
