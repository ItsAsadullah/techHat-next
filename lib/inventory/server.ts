import { randomUUID } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { createServerClient } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';

export async function requireInventoryUser() {
  const supabase = await createServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error('Please sign in to manage inventory.');
  if (['admin', 'super_admin', 'staff'].includes(user.app_metadata?.app_role)) return user.id;
  if (user.email) {
    const [account, staff] = await Promise.all([
      prisma.user.findFirst({ where: { email: user.email }, select: { role: true } }),
      prisma.staff.findFirst({ where: { email: user.email, isActive: true }, select: { id: true } }),
    ]);
    if (staff || (account && ['SUPER_ADMIN', 'STAFF'].includes(account.role))) return user.id;
  }
  throw new Error('Staff access is required to manage inventory.');
}

export function inventoryNumber(prefix: string) {
  return `${prefix}-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-${randomUUID().slice(0, 8).toUpperCase()}`;
}

export async function inventoryTransaction<T>(work: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await prisma.$transaction(work, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 20000 });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034' && attempt < 2) continue;
      throw error;
    }
  }
}

export async function activeWarehouse(tx: Prisma.TransactionClient, id: string) {
  const warehouse = await tx.warehouse.findUnique({ where: { id } });
  if (!warehouse?.isActive) throw new Error('Select an active warehouse.');
  return warehouse;
}

export async function inventoryProduct(tx: Prisma.TransactionClient, productId: string, variantId?: string | null) {
  const product = await tx.product.findUnique({ where: { id: productId }, include: { variants: true } });
  if (!product || product.status !== 'ACTIVE') throw new Error('Select an active product.');
  const variant = product.variants.find(v => v.id === variantId);
  if (variantId && !variant) throw new Error(`The selected variant does not belong to ${product.name}.`);
  if (!variantId && product.variants.length) throw new Error(`Select a variant for ${product.name}.`);
  return { name: product.name, cost: variant?.costPrice ?? product.costPrice ?? 0 };
}

export async function warehouseQuantity(tx: Prisma.TransactionClient, warehouseId: string, productId: string, variantId?: string | null) {
  const stock = await tx.stockLedger.aggregate({ where: { warehouseId, productId, variantId: variantId || null }, _sum: { inQty: true, outQty: true } });
  return (stock._sum.inQty ?? 0) - (stock._sum.outQty ?? 0);
}

export async function transferAvailable(tx: Prisma.TransactionClient, warehouseId: string, productId: string, variantId?: string | null, excludeId?: string) {
  const physical = await warehouseQuantity(tx, warehouseId, productId, variantId);
  const reserved = await tx.warehouseTransferItem.aggregate({
    where: { productId, variantId: variantId || null, warehouseTransfer: {
      sourceId: warehouseId, status: { in: ['APPROVED', 'IN_TRANSIT'] }, ...(excludeId ? { id: { not: excludeId } } : {}),
    } }, _sum: { quantity: true },
  });
  // In-transit transfers remain globally owned until receipt. Dispatch ledger entries
  // already remove them from warehouse stock, so only undisbursed reservations count.
  const dispatched = await tx.stockLedger.aggregate({ where: {
    warehouseId, productId, variantId: variantId || null, referenceType: 'TRANSFER_DISPATCH',
    referenceId: { in: (await tx.warehouseTransfer.findMany({ where: { sourceId: warehouseId, status: 'IN_TRANSIT', ...(excludeId ? { id: { not: excludeId } } : {}) }, select: { id: true } })).map(t => t.id) },
  }, _sum: { outQty: true } });
  const [globalItem, orders, allTransfers] = await Promise.all([
    variantId ? tx.variant.findUnique({ where: { id: variantId }, select: { stock: true } }) : tx.product.findUnique({ where: { id: productId }, select: { stock: true } }),
    tx.orderItem.aggregate({ where: { productId, variantId: variantId || null, order: { status: { in: ['DRAFT', 'PENDING_PAYMENT', 'PENDING', 'CONFIRMED', 'PROCESSING', 'PACKED'] } } }, _sum: { quantity: true } }),
    tx.warehouseTransferItem.aggregate({ where: { productId, variantId: variantId || null, warehouseTransfer: { status: { in: ['APPROVED', 'IN_TRANSIT'] }, ...(excludeId ? { id: { not: excludeId } } : {}) } }, _sum: { quantity: true } }),
  ]);
  const localAvailable = physical - (reserved._sum.quantity ?? 0) + (dispatched._sum.outQty ?? 0);
  const globalAvailable = (globalItem?.stock ?? 0) - (orders._sum.quantity ?? 0) - (allTransfers._sum.quantity ?? 0);
  return { physical, available: Math.max(0, Math.min(localAvailable, globalAvailable)) };
}

export async function syncInventoryReservations(tx: Prisma.TransactionClient, productId: string) {
  const [orders, transfers] = await Promise.all([
    tx.orderItem.aggregate({ where: { productId, order: { status: { in: ['DRAFT', 'PENDING_PAYMENT', 'PENDING', 'CONFIRMED', 'PROCESSING', 'PACKED'] } } }, _sum: { quantity: true } }),
    tx.warehouseTransferItem.aggregate({ where: { productId, warehouseTransfer: { status: { in: ['APPROVED', 'IN_TRANSIT'] } } }, _sum: { quantity: true } }),
  ]);
  await tx.product.update({ where: { id: productId }, data: { reservedStock: (orders._sum.quantity ?? 0) + (transfers._sum.quantity ?? 0) } });
}

export function refreshInventory() {
  revalidatePath('/admin/inventory', 'layout');
  revalidatePath('/admin/products');
  revalidatePath('/products');
}
