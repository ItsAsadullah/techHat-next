'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { randomUUID } from 'crypto';
import {
  ORDER_STATUS_TRANSITIONS,
  PAYMENT_STATUS_TRANSITIONS,
  calculateShippingCost,
  calculateEstimatedDelivery,
  canTransitionStatus,
  canTransitionPayment,
  getAllowedTransitions,
} from '@/lib/utils/order-helpers';

// ─── String-typed enums (Prisma client may lag behind schema changes) ─────────
type OrderStatus =
  | 'DRAFT' | 'PENDING_PAYMENT' | 'PENDING' | 'CONFIRMED' | 'PROCESSING'
  | 'PACKED' | 'SHIPPED' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'COMPLETED'
  | 'CANCELLED' | 'REFUND_REQUESTED' | 'REFUNDED' | 'FAILED' | 'RETURNED';

type PaymentStatus =
  | 'UNPAID' | 'PENDING' | 'PAID' | 'FAILED' | 'PARTIALLY_PAID' | 'REFUNDED';

type PaymentMethod = 'CASH' | 'CARD' | 'MOBILE_BANKING' | 'ONLINE' | 'MIXED';

const db = prisma as any;

// ─── INPUT TYPES ───────────────────────────────────────────────────────────────

export interface OrderItemInput {
  productId: string;
  variantId?: string | null;
  productName: string;
  quantity: number;
  unitPrice: number;
}

export interface PlaceOrderInput {
  userId?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  division: string;
  district: string;
  upazila?: string;
  shippingAddress: string;
  orderNote?: string;
  paymentMethod: PaymentMethod;
  transactionId?: string;
  mobileProvider?: string;
  mobileNumber?: string;
  couponCode?: string;
  items: OrderItemInput[];
  ipAddress?: string;
}

export interface OrderFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  dateFrom?: string;
  dateTo?: string;
  isPos?: boolean;
}

// ─── ORDER NUMBER: TH-2026-000001 ─────────────────────────────────────────────

async function generateOrderNumberSequential(): Promise<string> {
  const year = new Date().getFullYear();
  try {
    const result: any[] = await db.$queryRaw`
      INSERT INTO order_counter (year, seq) VALUES (${year}, 1)
      ON CONFLICT (year) DO UPDATE SET seq = order_counter.seq + 1
      RETURNING seq
    `;
    const seq = result[0]?.seq ?? 1;
    return `TH-${year}-${String(seq).padStart(6, '0')}`;
  } catch {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const ts = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    return `TH-${year}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${ts}`;
  }
}

// ─── COUPON VALIDATOR (server-side) ───────────────────────────────────────────

async function validateCouponServer(
  code: string,
  subTotal: number
): Promise<{ valid: boolean; discount: number; error?: string }> {
  try {
    const rows: any[] = await db.$queryRaw`
      SELECT id, discount_type, discount_value, min_order_amount,
             usage_limit, used_count, expires_at, is_active
      FROM coupons
      WHERE code = ${code.toUpperCase()} AND is_active = true
      LIMIT 1
    `;
    if (!rows.length) return { valid: false, discount: 0, error: 'Invalid coupon code' };
    const c = rows[0];
    if (c.expires_at && new Date(c.expires_at) < new Date())
      return { valid: false, discount: 0, error: 'Coupon has expired' };
    if (c.usage_limit && c.used_count >= c.usage_limit)
      return { valid: false, discount: 0, error: 'Coupon usage limit reached' };
    if (c.min_order_amount && subTotal < c.min_order_amount)
      return { valid: false, discount: 0, error: `Minimum order ৳${c.min_order_amount} required` };
    const discount = c.discount_type === 'PERCENTAGE'
      ? Math.round((subTotal * c.discount_value) / 100)
      : c.discount_value;
    return { valid: true, discount: Math.min(discount, subTotal) };
  } catch {
    return { valid: false, discount: 0 };
  }
}

// ─── LOG ORDER EVENT ──────────────────────────────────────────────────────────

export async function logOrderEvent(params: {
  orderId: string;
  eventType: string;
  oldStatus?: string;
  newStatus?: string;
  oldPaymentStatus?: string;
  newPaymentStatus?: string;
  changedBy?: string;
  note?: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    await db.orderEvent.create({ data: params });
  } catch (err) {
    console.error('logOrderEvent error:', err);
  }
}

// ─── PLACE ORDER ─────────────────────────────────────────────────────────────

export async function placeOrder(input: PlaceOrderInput) {
  try {
    // 1. Validate required fields
    const phoneRegex = /^(\+?880|0)?1[3-9]\d{8}$/;
    if (!input.customerName?.trim())
      return { success: false, error: 'Customer name is required' };
    if (!phoneRegex.test(input.customerPhone?.replace(/\s/g, '')))
      return { success: false, error: 'Enter a valid phone number' };
    if (!input.shippingAddress?.trim())
      return { success: false, error: 'Shipping address is required' };
    if (!input.items?.length)
      return { success: false, error: 'Cart is empty' };
    if (!input.division || !input.district)
      return { success: false, error: 'Division and district are required' };

    // 2. Fetch current prices & stock from DB (never trust client)
    const productIds = input.items.map((i) => i.productId);
    const variantIds = input.items.filter((i) => i.variantId).map((i) => i.variantId!);

    const [products, variants] = await Promise.all([
      db.product.findMany({
        where: { id: { in: productIds }, isActive: true },
        select: { id: true, name: true, price: true, offerPrice: true, stock: true, isActive: true },
      }),
      variantIds.length
        ? db.variant.findMany({
            where: { id: { in: variantIds } },
            select: { id: true, price: true, offerPrice: true, stock: true },
          })
        : Promise.resolve([]),
    ]);

    const productMap = new Map(products.map((p: any) => [p.id, p]));
    const variantMap = new Map(variants.map((v: any) => [v.id, v]));

    // 3. Build server-priced items with stock validation
    const validatedItems: {
      productId: string; variantId: string | null;
      productName: string; quantity: number; unitPrice: number; total: number;
    }[] = [];
    const stockErrors: string[] = [];

    for (const item of input.items) {
      const product = productMap.get(item.productId);
      if (!product || !product.isActive) {
        stockErrors.push(`${item.productName} — not available`);
        continue;
      }
      let qty = Math.max(1, Math.floor(item.quantity));

      if (item.variantId) {
        const variant = variantMap.get(item.variantId);
        if (!variant) { stockErrors.push(`${product.name} — variant not found`); continue; }
        if (variant.stock === 0) { stockErrors.push(`${product.name} — out of stock`); continue; }
        if (variant.stock < qty) qty = variant.stock;
        const price = variant.offerPrice ?? variant.price;
        validatedItems.push({ productId: item.productId, variantId: item.variantId, productName: item.productName || product.name, quantity: qty, unitPrice: price, total: price * qty });
      } else {
        if (product.stock === 0) { stockErrors.push(`${product.name} — out of stock`); continue; }
        if (product.stock < qty) qty = product.stock;
        const price = product.offerPrice ?? product.price;
        validatedItems.push({ productId: item.productId, variantId: null, productName: item.productName || product.name, quantity: qty, unitPrice: price, total: price * qty });
      }
    }

    if (!validatedItems.length)
      return { success: false, error: 'All items are out of stock', stockErrors };

    // 4. Server-side totals
    const subTotal = validatedItems.reduce((s, i) => s + i.total, 0);
    const shippingCost = calculateShippingCost(input.division);

    // 5. Coupon validation (server-side)
    let couponDiscount = 0;
    let appliedCouponCode: string | null = null;
    if (input.couponCode?.trim()) {
      const cr = await validateCouponServer(input.couponCode.trim(), subTotal);
      if (cr.valid) { couponDiscount = cr.discount; appliedCouponCode = input.couponCode.trim().toUpperCase(); }
    }

    const grandTotal = Math.max(0, subTotal - couponDiscount + shippingCost);
    const estimatedDelivery = calculateEstimatedDelivery(input.division);
    const orderNumber = await generateOrderNumberSequential();
    const trackingToken = randomUUID();
    const initialPaymentStatus: PaymentStatus = input.paymentMethod === 'CASH' ? 'UNPAID' : 'PENDING';

    // 6. Atomic transaction: lock stock → create order → log event
    const order = await db.$transaction(async (tx: any) => {
      for (const item of validatedItems) {
        if (item.variantId) {
          const v = await tx.variant.findUnique({ where: { id: item.variantId }, select: { stock: true } });
          if (!v || v.stock < item.quantity) throw new Error(`Insufficient stock: ${item.productName}`);
          await tx.variant.update({ where: { id: item.variantId }, data: { stock: { decrement: item.quantity } } });
        } else {
          const p = await tx.product.findUnique({ where: { id: item.productId }, select: { stock: true } });
          if (!p || p.stock < item.quantity) throw new Error(`Insufficient stock: ${item.productName}`);
          await tx.product.update({ where: { id: item.productId }, data: { stock: { decrement: item.quantity }, soldCount: { increment: item.quantity } } });
        }
      }

      const newOrder = await tx.order.create({
        data: {
          orderNumber, trackingToken,
          userId: input.userId || null,
          customerName: input.customerName.trim(),
          customerPhone: input.customerPhone.replace(/\s/g, ''),
          customerEmail: input.customerEmail?.trim() || null,
          shippingAddress: input.shippingAddress.trim(),
          division: input.division, district: input.district, upazila: input.upazila || null,
          orderNote: input.orderNote?.trim() || null,
          subTotal, totalAmount: subTotal, discount: couponDiscount,
          couponCode: appliedCouponCode, couponDiscount,
          tax: 0, shippingCost, grandTotal,
          paymentMethod: input.paymentMethod,
          paymentStatus: initialPaymentStatus,
          transactionId: input.transactionId?.trim() || null,
          mobileProvider: input.mobileProvider || null,
          mobileNumber: input.mobileNumber?.trim() || null,
          status: 'PENDING', ipAddress: input.ipAddress || null,
          estimatedDelivery, isPos: false,
          items: { create: validatedItems },
        },
        include: { items: true },
      });

      await tx.orderEvent.create({
        data: {
          orderId: newOrder.id, eventType: 'ORDER_CREATED',
          newStatus: 'PENDING', newPaymentStatus: initialPaymentStatus,
          changedBy: input.userId || 'guest',
          note: `Order placed via website. Payment: ${input.paymentMethod}`,
        },
      });

      if (appliedCouponCode) {
        await tx.$executeRaw`UPDATE coupons SET used_count = used_count + 1 WHERE code = ${appliedCouponCode}`;
      }

      return newOrder;
    });

    revalidatePath('/admin/orders');
    return { success: true, order, orderNumber, trackingToken, grandTotal, estimatedDelivery, stockErrors };
  } catch (error: any) {
    console.error('placeOrder error:', error);
    if (error?.message?.includes('Insufficient stock'))
      return { success: false, error: error.message };
    return { success: false, error: 'Could not place order. Please try again.' };
  }
}

// ─── UPDATE ORDER STATUS (ADMIN — with state machine) ─────────────────────────

export async function updateOrderStatus(
  orderId: string,
  newStatus: OrderStatus,
  options?: { note?: string; cancelReason?: string; changedBy?: string; refundAmount?: number }
) {
  try {
    const order = await db.order.findUnique({ where: { id: orderId }, include: { items: true } });
    if (!order) return { success: false, error: 'Order not found' };

    if (!canTransitionStatus(order.status, newStatus)) {
      const allowed = getAllowedTransitions(order.status).join(', ') || 'none';
      return { success: false, error: `Cannot change ${order.status} → ${newStatus}. Allowed: ${allowed}` };
    }

    const updateData: Record<string, unknown> = { status: newStatus };
    const now = new Date();
    if (newStatus === 'SHIPPED') updateData.shippedAt = now;
    if (newStatus === 'DELIVERED' || newStatus === 'COMPLETED') updateData.deliveredAt = now;
    if (newStatus === 'CANCELLED') {
      updateData.cancelledAt = now;
      if (options?.cancelReason) updateData.cancelReason = options.cancelReason;
    }
    if (newStatus === 'REFUNDED' && options?.refundAmount) {
      updateData.refundAmount = options.refundAmount;
      updateData.paymentStatus = 'REFUNDED';
    }

    await db.$transaction(async (tx: any) => {
      if (newStatus === 'CANCELLED' && order.status !== 'CANCELLED') {
        for (const item of order.items) {
          if (item.variantId) {
            await tx.variant.update({ where: { id: item.variantId }, data: { stock: { increment: item.quantity } } });
          } else {
            await tx.product.update({ where: { id: item.productId }, data: { stock: { increment: item.quantity }, soldCount: { decrement: item.quantity } } });
          }
        }
      }
      await tx.order.update({ where: { id: orderId }, data: updateData });
      await tx.orderEvent.create({
        data: {
          orderId, eventType: 'STATUS_CHANGE',
          oldStatus: order.status, newStatus,
          changedBy: options?.changedBy || 'admin',
          note: options?.note || options?.cancelReason || null,
        },
      });
    });

    revalidatePath('/admin/orders');
    revalidatePath(`/admin/orders/${orderId}`);
    return { success: true };
  } catch (error) {
    console.error('updateOrderStatus error:', error);
    return { success: false, error: 'Failed to update order status' };
  }
}

// ─── UPDATE PAYMENT STATUS (ADMIN) ───────────────────────────────────────────

export async function updatePaymentStatus(
  orderId: string,
  newPaymentStatus: PaymentStatus,
  options?: { note?: string; changedBy?: string }
) {
  try {
    const order = await db.order.findUnique({ where: { id: orderId }, select: { id: true, status: true, paymentStatus: true } });
    if (!order) return { success: false, error: 'Order not found' };

    if (!canTransitionPayment(order.paymentStatus, newPaymentStatus)) {
      return { success: false, error: `Invalid payment transition: ${order.paymentStatus} → ${newPaymentStatus}` };
    }

    const updateData: Record<string, unknown> = { paymentStatus: newPaymentStatus };
    if (newPaymentStatus === 'PAID' && (order.status === 'PENDING' || order.status === 'PENDING_PAYMENT')) {
      updateData.status = 'CONFIRMED';
    }

    await db.$transaction(async (tx: any) => {
      await tx.order.update({ where: { id: orderId }, data: updateData });
      await tx.orderEvent.create({
        data: {
          orderId, eventType: 'PAYMENT_UPDATE',
          oldPaymentStatus: order.paymentStatus, newPaymentStatus,
          newStatus: updateData.status as string | undefined,
          changedBy: options?.changedBy || 'admin',
          note: options?.note || null,
        },
      });
    });

    revalidatePath('/admin/orders');
    revalidatePath(`/admin/orders/${orderId}`);
    return { success: true };
  } catch (error) {
    console.error('updatePaymentStatus error:', error);
    return { success: false, error: 'Failed to update payment status' };
  }
}

// ─── INTERNAL NOTE ────────────────────────────────────────────────────────────

export async function setOrderInternalNote(orderId: string, note: string, changedBy?: string) {
  try {
    await db.$transaction(async (tx: any) => {
      await tx.order.update({ where: { id: orderId }, data: { internalNote: note } });
      await tx.orderEvent.create({ data: { orderId, eventType: 'NOTE_ADDED', changedBy: changedBy || 'admin', note } });
    });
    revalidatePath(`/admin/orders/${orderId}`);
    return { success: true };
  } catch (error) {
    console.error('setOrderInternalNote error:', error);
    return { success: false, error: 'Failed to save note' };
  }
}

// ─── PUBLIC TRACKING: order number + phone ────────────────────────────────────

export async function trackOrderByNumberAndPhone(orderNumber: string, phone: string) {
  try {
    const normalizedPhone = phone.replace(/\s|-/g, '');
    const order = await db.order.findFirst({
      where: {
        orderNumber: orderNumber.trim().toUpperCase(),
        customerPhone: { contains: normalizedPhone.slice(-10) },
      },
      select: {
        id: true, orderNumber: true, trackingToken: true,
        status: true, paymentStatus: true, paymentMethod: true,
        grandTotal: true, shippingCost: true, discount: true, couponDiscount: true,
        division: true, district: true, upazila: true, shippingAddress: true,
        customerName: true, estimatedDelivery: true, shippedAt: true,
        deliveredAt: true, cancelledAt: true, cancelReason: true,
        createdAt: true, updatedAt: true,
        items: {
          select: {
            id: true, productName: true, quantity: true, unitPrice: true, total: true,
            product: { select: { slug: true, productImages: { where: { isThumbnail: true }, select: { url: true }, take: 1 } } },
          },
        },
        events: {
          select: { id: true, eventType: true, oldStatus: true, newStatus: true, note: true, createdAt: true },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!order) return { success: false, error: 'No order found with this order number and phone combination' };
    return { success: true, order };
  } catch (error) {
    console.error('trackOrderByNumberAndPhone error:', error);
    return { success: false, error: 'Could not retrieve order' };
  }
}

// ─── TOKEN-BASED TRACKING ─────────────────────────────────────────────────────

export async function trackOrderByToken(token: string) {
  try {
    if (!token || token.length < 10) return { success: false, error: 'Invalid tracking token' };

    const order = await db.order.findUnique({
      where: { trackingToken: token },
      select: {
        id: true, orderNumber: true, trackingToken: true,
        status: true, paymentStatus: true, paymentMethod: true,
        grandTotal: true, shippingCost: true, discount: true, couponDiscount: true,
        division: true, district: true, shippingAddress: true,
        customerName: true, estimatedDelivery: true, shippedAt: true,
        deliveredAt: true, createdAt: true,
        items: {
          select: {
            id: true, productName: true, quantity: true, unitPrice: true, total: true,
            product: { select: { slug: true, productImages: { where: { isThumbnail: true }, select: { url: true }, take: 1 } } },
          },
        },
        events: {
          select: { id: true, eventType: true, oldStatus: true, newStatus: true, note: true, createdAt: true },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!order) return { success: false, error: 'Order not found' };
    return { success: true, order };
  } catch (error) {
    console.error('trackOrderByToken error:', error);
    return { success: false, error: 'Could not retrieve order' };
  }
}

// ─── ACCOUNT MERGE ────────────────────────────────────────────────────────────

export async function mergeGuestOrdersToUser(userId: string, email?: string, phone?: string) {
  try {
    if (!email && !phone) return { success: false, error: 'Email or phone required' };

    const where: Record<string, unknown> = { userId: null, isPos: false };
    if (email && phone) {
      where.OR = [{ customerEmail: email }, { customerPhone: { contains: phone.slice(-10) } }];
    } else if (email) {
      where.customerEmail = email;
    } else {
      where.customerPhone = { contains: phone!.slice(-10) };
    }

    const guestOrders = await db.order.findMany({ where, select: { id: true, orderNumber: true } });
    if (!guestOrders.length) return { success: true, merged: 0 };

    const orderIds = guestOrders.map((o: any) => o.id);
    await db.$transaction(async (tx: any) => {
      await tx.order.updateMany({ where: { id: { in: orderIds } }, data: { userId } });
      for (const o of guestOrders) {
        await tx.orderEvent.create({
          data: { orderId: o.id, eventType: 'ACCOUNT_MERGED', changedBy: 'system', note: `Guest order linked to user ${userId}` },
        });
      }
    });

    revalidatePath('/admin/orders');
    return { success: true, merged: guestOrders.length };
  } catch (error) {
    console.error('mergeGuestOrdersToUser error:', error);
    return { success: false, error: 'Failed to merge orders' };
  }
}

// ─── GET ORDERS (ADMIN) ───────────────────────────────────────────────────────

export async function getOrders(filters: OrderFilters = {}) {
  try {
    const { page = 1, limit = 20, search, status, paymentStatus, dateFrom, dateTo, isPos } = filters;
    const where: any = {};
    if (isPos !== undefined) where.isPos = isPos; else where.isPos = false;
    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
        { customerPhone: { contains: search, mode: 'insensitive' } },
        { customerEmail: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (status) where.status = status;
    if (paymentStatus) where.paymentStatus = paymentStatus;
    if (dateFrom || dateTo) {
      where.createdAt = {} as any;
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo + 'T23:59:59.999Z');
    }

    const [orders, total] = await Promise.all([
      db.order.findMany({
        where,
        include: {
          items: { include: { product: { select: { id: true, name: true, productImages: { where: { isThumbnail: true }, select: { url: true }, take: 1 } } }, variant: { select: { id: true, name: true, image: true } } } },
          user: { select: { fullName: true, email: true, phone: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.order.count({ where }),
    ]);

    return { success: true, orders, total, totalPages: Math.ceil(total / limit), currentPage: page };
  } catch (error) {
    console.error('getOrders error:', error);
    return { success: false, orders: [], total: 0, totalPages: 0, currentPage: 1 };
  }
}

// ─── GET ORDER BY ID (FULL DETAIL) ───────────────────────────────────────────

export async function getOrderById(orderId: string) {
  try {
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: { select: { id: true, name: true, slug: true, sku: true, productImages: { where: { isThumbnail: true }, select: { url: true }, take: 1 } } },
            variant: { select: { id: true, name: true, sku: true, image: true } },
          },
        },
        user: { select: { id: true, fullName: true, email: true, phone: true, avatarUrl: true } },
        payments: true,
        returns: { include: { items: true } },
        events: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!order) return { success: false, error: 'Order not found' };
    return { success: true, order };
  } catch (error) {
    console.error('getOrderById error:', error);
    return { success: false, error: 'Failed to fetch order' };
  }
}

// ─── CANCEL ORDER ─────────────────────────────────────────────────────────────

export async function cancelOrder(orderId: string, options?: { reason?: string; changedBy?: string }) {
  return updateOrderStatus(orderId, 'CANCELLED', {
    cancelReason: options?.reason || 'Cancelled by admin',
    changedBy: options?.changedBy || 'admin',
    note: options?.reason,
  });
}

// ─── DELETE ORDER ─────────────────────────────────────────────────────────────

export async function deleteOrder(orderId: string) {
  try {
    await db.order.delete({ where: { id: orderId } });
    revalidatePath('/admin/orders');
    return { success: true };
  } catch (error) {
    console.error('deleteOrder error:', error);
    return { success: false, error: 'Failed to delete order' };
  }
}

// ─── GET ORDER STATS ─────────────────────────────────────────────────────────

export async function getOrderStats() {
  try {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const [
      totalOrders, pendingOrders, confirmedOrders, processingOrders,
      shippedOrders, deliveredOrders, cancelledOrders,
      revenueResult, todayOrders, todayRevenueResult,
    ] = await Promise.all([
      db.order.count({ where: { isPos: false } }),
      db.order.count({ where: { isPos: false, status: 'PENDING' } }),
      db.order.count({ where: { isPos: false, status: 'CONFIRMED' } }),
      db.order.count({ where: { isPos: false, status: 'PROCESSING' } }),
      db.order.count({ where: { isPos: false, status: { in: ['SHIPPED', 'OUT_FOR_DELIVERY'] } } }),
      db.order.count({ where: { isPos: false, status: { in: ['DELIVERED', 'COMPLETED'] } } }),
      db.order.count({ where: { isPos: false, status: 'CANCELLED' } }),
      db.order.aggregate({ where: { isPos: false, status: { notIn: ['CANCELLED', 'FAILED', 'REFUNDED'] } }, _sum: { grandTotal: true } }),
      db.order.count({ where: { isPos: false, createdAt: { gte: today } } }),
      db.order.aggregate({ where: { isPos: false, status: { notIn: ['CANCELLED', 'FAILED'] }, createdAt: { gte: today } }, _sum: { grandTotal: true } }),
    ]);
    return {
      success: true,
      stats: { totalOrders, pendingOrders, confirmedOrders, processingOrders, shippedOrders, deliveredOrders, cancelledOrders, totalRevenue: revenueResult?._sum?.grandTotal || 0, todayOrders, todayRevenue: todayRevenueResult?._sum?.grandTotal || 0 },
    };
  } catch (error) {
    console.error('getOrderStats error:', error);
    return { success: false, stats: null };
  }
}

// ─── VALIDATE STOCK ───────────────────────────────────────────────────────────

export async function validateOrderStock(
  items: { productId: string; variantId?: string | null; quantity: number }[]
) {
  try {
    const productIds = items.map((i) => i.productId);
    const variantIds = items.filter((i) => i.variantId).map((i) => i.variantId!);
    const [products, variants] = await Promise.all([
      db.product.findMany({ where: { id: { in: productIds } }, select: { id: true, name: true, stock: true, isActive: true } }),
      variantIds.length ? db.variant.findMany({ where: { id: { in: variantIds } }, select: { id: true, stock: true } }) : Promise.resolve([]),
    ]);
    const productMap = new Map(products.map((p: any) => [p.id, p]));
    const variantMap = new Map(variants.map((v: any) => [v.id, v]));
    const outOfStock: string[] = [];
    const insufficientStock: { name: string; available: number; requested: number }[] = [];
    for (const item of items) {
      const product = productMap.get(item.productId);
      if (!product || !product.isActive) { outOfStock.push(item.productId); continue; }
      const stock = item.variantId ? (variantMap.get(item.variantId)?.stock ?? 0) : product.stock;
      if (stock === 0) outOfStock.push(product.name);
      else if (stock < item.quantity) insufficientStock.push({ name: product.name, available: stock, requested: item.quantity });
    }
    return { success: true, valid: !outOfStock.length && !insufficientStock.length, outOfStock, insufficientStock };
  } catch (error) {
    console.error('validateOrderStock error:', error);
    return { success: true, valid: true, outOfStock: [], insufficientStock: [] };
  }
}