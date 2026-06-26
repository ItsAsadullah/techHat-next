'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { createStockLedgerEntry } from '@/lib/actions/stock-ledger-actions';
import type { ReturnType, ReturnCondition } from '@prisma/client';
import { startOfDay, subDays, endOfDay } from 'date-fns';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ProcessReturnInput {
  orderId: string;
  type: ReturnType;
  reason: string;
  note?: string;
  processedBy?: string;
  restockingFeePercent?: number;
  items: {
    productId: string;
    variantId?: string | null;
    quantity: number;
    unitPrice: number;
    condition: ReturnCondition;
    reason?: string;
  }[];
  refundMethod: 'CASH' | 'CARD' | 'MOBILE_BANKING' | 'STORE_CREDIT';
  storeCreditAmount?: number;
  refundToWallet?: boolean;
}

export interface ProcessExchangeInput {
  orderId: string;
  processedBy?: string;
  note?: string;
  returnItem: {
    productId: string;
    variantId?: string | null;
    quantity: number;
    unitPrice: number;
    condition: ReturnCondition;
  };
  newProductId: string;
  newVariantId?: string | null;
  newProductPrice: number;
  newProductName: string;
}

// ─── Helper ──────────────────────────────────────────────────────────────────

function mapConditionToWarehouseType(cond: ReturnCondition) {
  switch (cond) {
    case 'DAMAGED': return 'DAMAGE';
    case 'DEFECTIVE': return 'SERVICE_CENTER';
    case 'NEEDS_INSPECTION': return 'INSPECTION';
    case 'USED': return 'RETURN_GOODS';
    default: return 'MAIN';
  }
}

async function generateReturnNumber() {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  const count = await prisma.return.count({
    where: {
      createdAt: {
        gte: startOfDay(today),
        lte: endOfDay(today),
      },
    },
  });
  return `RET-${dateStr}-${String(count + 1).padStart(4, '0')}`;
}

// ─── Search / Filter ─────────────────────────────────────────────────────────

export async function getRecentSalesForReturn({
  search,
  dateRange,
}: {
  search?: string;
  dateRange?: 'TODAY' | 'LAST_7' | 'LAST_30' | 'ALL';
}) {
  try {
    let dateFilter: any = {};
    if (dateRange === 'TODAY') {
      dateFilter = { gte: startOfDay(new Date()), lte: endOfDay(new Date()) };
    } else if (dateRange === 'LAST_7') {
      dateFilter = { gte: startOfDay(subDays(new Date(), 6)) };
    } else if (dateRange === 'LAST_30') {
      dateFilter = { gte: startOfDay(subDays(new Date(), 29)) };
    }

    const where: any = {
      paymentStatus: { in: ['PAID', 'PARTIALLY_PAID'] as any },
      status: { notIn: ['CANCELLED', 'RETURNED'] as any },
      ...(Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {}),
    };

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { orderNumber: { contains: q, mode: 'insensitive' } },
        { customerPhone: { contains: q } },
        { customerName: { contains: q, mode: 'insensitive' } },
        { items: { some: { productName: { contains: q, mode: 'insensitive' } } } },
        { items: { some: { product: { sku: { contains: q, mode: 'insensitive' } } } } },
        { items: { some: { variant: { sku: { contains: q, mode: 'insensitive' } } } } },
      ];
    }

    const orders = await prisma.order.findMany({
      where,
      take: 50,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        orderNumber: true,
        customerName: true,
        customerPhone: true,
        grandTotal: true,
        paymentMethod: true,
        paymentStatus: true,
        posPaymentStatus: true,
        isPos: true,
        cashierId: true,
        createdAt: true,
        status: true,
        items: {
          select: {
            id: true,
            productId: true,
            variantId: true,
            productName: true,
            quantity: true,
            unitPrice: true,
            total: true,
            product: {
              select: {
                id: true,
                name: true,
                images: true,
                productImages: { select: { url: true } },
                sku: true,
                warrantyMonths: true,
                warrantyType: true,
              }
            },
            variant: {
              select: { id: true, name: true, sku: true, image: true }
            }
          }
        },
        returns: {
          select: {
            id: true,
            returnNumber: true,
            type: true,
            status: true,
            refundAmount: true,
            items: { select: { productId: true, variantId: true, quantity: true } }
          }
        },
        user: { select: { id: true, fullName: true, walletBalance: true } },
      },
    });

    return { success: true, orders };
  } catch (error: any) {
    console.error('getRecentSalesForReturn error:', error);
    return { success: false, orders: [], error: error.message };
  }
}

export async function searchOrderForReturn(query: string) {
  try {
    const order = await prisma.order.findFirst({
      where: {
        paymentStatus: { in: ['PAID', 'PARTIALLY_PAID'] as any },
        status: { notIn: ['CANCELLED', 'RETURNED'] as any },
        OR: [
          { orderNumber: { equals: query.trim(), mode: 'insensitive' } },
          { customerPhone: { equals: query.trim() } },
        ],
      },
      include: {
        items: { include: { product: true, variant: true } },
        returns: { include: { items: true } },
        user: true,
      },
    });

    if (!order) return { success: false, error: 'Order not found or not eligible for return' };

    const returnableItems = order.items.map((item) => {
      const alreadyReturned = order.returns.reduce((sum, ret) => {
        const match = ret.items.find(ri => ri.productId === item.productId && ri.variantId === item.variantId);
        return sum + (match ? match.quantity : 0);
      }, 0);
      return { ...item, alreadyReturned, availableToReturn: item.quantity - alreadyReturned };
    }).filter(i => i.availableToReturn > 0);

    if (returnableItems.length === 0) return { success: false, error: 'All items in this order have already been returned.' };

    return { success: true, order: { ...order, items: returnableItems } };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to search order' };
  }
}

// ─── Process Return ───────────────────────────────────────────────────────────

export async function processReturn(input: ProcessReturnInput) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: input.orderId },
      include: { items: true, returns: { include: { items: true } }, user: true },
    });
    if (!order) return { success: false, error: 'Order not found' };

    const warehouses = await prisma.warehouse.findMany({
      where: { type: { in: ['MAIN', 'INSPECTION', 'DAMAGE', 'SERVICE_CENTER', 'RETURN_GOODS'] as any } },
    });
    const getWh = (type: string) => warehouses.find(w => w.type === type) || warehouses.find(w => w.type === 'MAIN');
    const mainWh = getWh('MAIN');
    if (!mainWh) return { success: false, error: 'MAIN warehouse not configured.' };

    const rawRefund = input.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    const restockingFee = input.restockingFeePercent ? rawRefund * (input.restockingFeePercent / 100) : 0;
    const finalRefund = rawRefund - restockingFee;
    const returnNumber = await generateReturnNumber();

    const result = await prisma.$transaction(async (tx) => {
      const returnRecord = await tx.return.create({
        data: {
          returnNumber,
          orderId: input.orderId,
          type: input.type,
          reason: input.reason,
          status: 'COMPLETED',
          refundAmount: finalRefund,
          storeCreditAmount: input.storeCreditAmount || 0,
          processedBy: input.processedBy || null,
          note: input.note || null,
        },
      });

      for (const item of input.items) {
        if (item.quantity <= 0) continue;
        const originalItem = order.items.find(
          oi => oi.productId === item.productId && (oi.variantId ?? null) === (item.variantId ?? null)
        );

        await tx.returnItem.create({
          data: {
            returnId: returnRecord.id,
            productId: item.productId,
            variantId: item.variantId || null,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.unitPrice * item.quantity,
            condition: item.condition,
            reason: item.reason,
          },
        });

        const targetWhType = mapConditionToWarehouseType(item.condition);
        const targetWh = getWh(targetWhType);
        await createStockLedgerEntry({
          referenceType: 'RETURN',
          referenceId: returnRecord.id,
          warehouseId: targetWh!.id,
          productId: item.productId,
          variantId: item.variantId || null,
          inQty: item.quantity,
          outQty: 0,
          unitCost: (originalItem as any)?.costPrice || 0,
          remarks: `Return ${returnNumber} | Condition: ${item.condition}`,
        }, tx);
      }

      // Store Credit → Wallet
      if ((input.type === 'STORE_CREDIT' || input.refundToWallet) && input.storeCreditAmount && order.userId) {
        const user = await tx.user.findUnique({ where: { id: order.userId } });
        if (user) {
          await tx.walletTransaction.create({
            data: { userId: user.id, amount: input.storeCreditAmount, type: 'CREDIT', referenceId: returnRecord.id, note: `Store Credit – Return ${returnNumber}` },
          });
          await tx.user.update({ where: { id: user.id }, data: { walletBalance: user.walletBalance + input.storeCreditAmount } });
        }
      }

      // Update order status
      const allReturned = order.items.every(oi => {
        const prev = order.returns.reduce((s, r) => {
          const m = r.items.find(ri => ri.productId === oi.productId && ri.variantId === oi.variantId);
          return s + (m ? m.quantity : 0);
        }, 0);
        const cur = input.items.find(ri => ri.productId === oi.productId && ri.variantId === oi.variantId)?.quantity || 0;
        return prev + cur >= oi.quantity;
      });
      if (allReturned) {
        await tx.order.update({ where: { id: order.id }, data: { status: 'RETURNED' } });
      }

      return returnRecord;
    }, { timeout: 30000 });

    revalidatePath('/admin/returns');
    revalidatePath('/admin/inventory');
    return { success: true, returnNumber: result.returnNumber, returnId: result.id };
  } catch (error: any) {
    console.error('processReturn error:', error);
    return { success: false, error: error?.message || 'Failed to process return' };
  }
}

// ─── Process Exchange ─────────────────────────────────────────────────────────

export async function processExchange(input: ProcessExchangeInput) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: input.orderId },
      include: { items: true, returns: { include: { items: true } }, user: true },
    });
    if (!order) return { success: false, error: 'Order not found' };

    const mainWh = await prisma.warehouse.findFirst({ where: { type: 'MAIN' } });
    if (!mainWh) return { success: false, error: 'MAIN warehouse not configured.' };

    const returnNumber = await generateReturnNumber();
    const oldTotal = input.returnItem.unitPrice * input.returnItem.quantity;
    const newTotal = input.newProductPrice * input.returnItem.quantity;
    const difference = newTotal - oldTotal; // positive = customer pays more

    const result = await prisma.$transaction(async (tx) => {
      const returnRecord = await tx.return.create({
        data: {
          returnNumber,
          orderId: input.orderId,
          type: 'EXCHANGE',
          reason: 'Exchange',
          status: 'COMPLETED',
          refundAmount: difference < 0 ? Math.abs(difference) : 0,
          exchangeDifference: difference,
          processedBy: input.processedBy || null,
          note: input.note || null,
        },
      });

      await tx.returnItem.create({
        data: {
          returnId: returnRecord.id,
          productId: input.returnItem.productId,
          variantId: input.returnItem.variantId || null,
          quantity: input.returnItem.quantity,
          unitPrice: input.returnItem.unitPrice,
          total: oldTotal,
          condition: input.returnItem.condition,
          exchangeProductId: input.newProductId,
          exchangeVariantId: input.newVariantId || null,
        },
      });

      await tx.exchange.create({
        data: {
          returnId: returnRecord.id,
          newProductId: input.newProductId,
          newVariantId: input.newVariantId || null,
          quantity: input.returnItem.quantity,
          price: input.newProductPrice,
          difference,
          status: 'COMPLETED',
        },
      });

      // Stock: return old product to appropriate WH
      const targetWhType = mapConditionToWarehouseType(input.returnItem.condition);
      const targetWh = await prisma.warehouse.findFirst({ where: { type: targetWhType as any } }) || mainWh;
      await createStockLedgerEntry({ referenceType: 'RETURN', referenceId: returnRecord.id, warehouseId: targetWh.id, productId: input.returnItem.productId, variantId: input.returnItem.variantId || null, inQty: input.returnItem.quantity, outQty: 0, unitCost: 0, remarks: `Exchange Return ${returnNumber}` }, tx);

      // Stock: deduct new product from MAIN WH
      await createStockLedgerEntry({ referenceType: 'EXCHANGE', referenceId: returnRecord.id, warehouseId: mainWh.id, productId: input.newProductId, variantId: input.newVariantId || null, inQty: 0, outQty: input.returnItem.quantity, unitCost: input.newProductPrice, remarks: `Exchange Out ${returnNumber}` }, tx);

      return returnRecord;
    }, { timeout: 30000 });

    revalidatePath('/admin/returns');
    revalidatePath('/admin/inventory');
    return { success: true, returnNumber: result.returnNumber, returnId: result.id, difference };
  } catch (error: any) {
    console.error('processExchange error:', error);
    return { success: false, error: error?.message || 'Failed to process exchange' };
  }
}

// ─── Get Summary ──────────────────────────────────────────────────────────────

export async function getReturnsDashboardSummary() {
  try {
    const today = startOfDay(new Date());
    const todayEnd = endOfDay(new Date());

    const [todayReturns, todayExchanges, totalReturnValue, totalExchangeValue] = await Promise.all([
      prisma.return.count({ where: { type: { not: 'EXCHANGE' }, createdAt: { gte: today, lte: todayEnd } } }),
      prisma.return.count({ where: { type: 'EXCHANGE', createdAt: { gte: today, lte: todayEnd } } }),
      prisma.return.aggregate({ where: { type: { not: 'EXCHANGE' }, createdAt: { gte: today, lte: todayEnd } }, _sum: { refundAmount: true } }),
      prisma.return.aggregate({ where: { type: 'EXCHANGE', createdAt: { gte: today, lte: todayEnd } }, _sum: { refundAmount: true } }),
    ]);

    return {
      todayReturns,
      todayExchanges,
      returnValue: totalReturnValue._sum.refundAmount || 0,
      exchangeValue: totalExchangeValue._sum.refundAmount || 0,
    };
  } catch (error) {
    return { todayReturns: 0, todayExchanges: 0, returnValue: 0, exchangeValue: 0 };
  }
}

export async function getReturns(status?: string) {
  try {
    const where = status ? { status: status as any } : {};
    return await prisma.return.findMany({
      where,
      include: {
        order: { select: { orderNumber: true, customerName: true, customerPhone: true, user: true } },
        items: { include: { product: { select: { name: true } }, variant: { select: { name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
  } catch {
    return [];
  }
}
