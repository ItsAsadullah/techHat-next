'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { PaymentMethod } from '@prisma/client';

// Internal helpers (plain async functions, NOT server actions) used within completeSale
async function _upsertCustomerInternal(name: string, phone: string, tx?: any) {
  const client = tx || prisma;
  const existing = await client.pOSCustomer.findUnique({ where: { phone } });
  if (existing) return existing;
  return client.pOSCustomer.create({ data: { name, phone } });
}

async function _updateCustomerStatsInternal(customerId: string) {
  const agg = await prisma.order.aggregate({
    where: { posCustomerId: customerId, isPos: true },
    _sum: { grandTotal: true, dueAmount: true },
  });
  await prisma.pOSCustomer.update({
    where: { id: customerId },
    data: {
      totalPurchase: agg._sum?.grandTotal || 0,
      totalDue: agg._sum?.dueAmount || 0,
    },
  });
}

export interface POSProduct {
  id: string;
  name: string;
  sku: string | null;
  barcode: string | null;
  price: number;
  offerPrice: number | null;
  stock: number;
  image: string | null;
  categoryName: string;
  variants: {
    id: string;
    name: string;
    sku: string | null;
    price: number;
    offerPrice: number | null;
    stock: number;
    image: string | null;
  }[];
}

export async function searchPOSProducts(query: string, categoryId?: string): Promise<POSProduct[]> {
  try {
    const where: any = {
      isActive: true,
    };

    if (query && query.trim().length > 0) {
      where.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { sku: { contains: query, mode: 'insensitive' } },
        { barcode: { contains: query, mode: 'insensitive' } },
        { variants: { some: { sku: { contains: query, mode: 'insensitive' } } } },
      ];
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    const products = await prisma.product.findMany({
      where,
      select: {
        id: true,
        name: true,
        sku: true,
        barcode: true,
        price: true,
        offerPrice: true,
        stock: true,
        category: { select: { name: true } },
        productImages: {
          where: { isThumbnail: true },
          select: { url: true },
          take: 1,
        },
        variants: {
          select: {
            id: true,
            name: true,
            sku: true,
            price: true,
            offerPrice: true,
            stock: true,
            image: true,
          },
        },
      },
      take: 30,
      orderBy: { name: 'asc' },
    });

    return products.map((p) => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      barcode: p.barcode,
      price: p.price,
      offerPrice: p.offerPrice,
      stock: p.stock,
      image: p.productImages[0]?.url || null,
      categoryName: p.category.name,
      variants: p.variants,
    }));
  } catch (error: any) {
    console.error('searchPOSProducts error:', error);
    return [];
  }
}

export async function findProductByBarcode(barcode: string): Promise<POSProduct | null> {
  try {
    const product = await prisma.product.findFirst({
      where: {
        isActive: true,
        OR: [
          { barcode },
          { sku: barcode },
          { variants: { some: { sku: barcode } } },
        ],
      },
      select: {
        id: true,
        name: true,
        sku: true,
        barcode: true,
        price: true,
        offerPrice: true,
        stock: true,
        category: { select: { name: true } },
        productImages: {
          where: { isThumbnail: true },
          select: { url: true },
          take: 1,
        },
        variants: {
          select: {
            id: true,
            name: true,
            sku: true,
            price: true,
            offerPrice: true,
            stock: true,
            image: true,
          },
        },
      },
    });

    if (!product) return null;

    return {
      id: product.id,
      name: product.name,
      sku: product.sku,
      barcode: product.barcode,
      price: product.price,
      offerPrice: product.offerPrice,
      stock: product.stock,
      image: product.productImages[0]?.url || null,
      categoryName: product.category.name,
      variants: product.variants,
    };
  } catch (error: any) {
    console.error('findProductByBarcode error:', error);
    return null;
  }
}

export interface CartItem {
  productId: string;
  variantId?: string | null;
  name: string;
  variantName?: string;
  price: number;
  originalPrice: number;
  quantity: number;
  image: string | null;
  maxStock: number;
}

export interface CompleteSaleInput {
  items: CartItem[];
  paymentMethod: 'CASH' | 'MOBILE_BANKING' | 'CARD' | 'MIXED';
  subtotal: number;
  discount: number;
  tax: number;
  grandTotal: number;
  amountReceived: number;
  change: number;
  customerName?: string;
  customerPhone?: string;
  note?: string;
  cashierId?: string;
  // For mixed payments
  cashPayment?: number;
  cardPayment?: number;
  mobilePayment?: number;
  // Mobile Banking Details
  mobileTrxId?: string;
  mobileNumber?: string;
  mobileProvider?: string;
  mobileCashOutCharge?: number;
  // Card details
  cardTrxId?: string;
  cardLast4?: string;
  // Due / Partial payment
  paidAmount?: number;
  dueAmount?: number;
  posPaymentStatus?: 'PAID' | 'PARTIAL' | 'DUE';
  // Guarantor
  guarantorName?: string;
  guarantorPhone?: string;
  guarantorRelation?: string;
  guarantorAddress?: string;
}

export interface SaleResult {
  success: boolean;
  orderId?: string;
  orderNumber?: string;
  error?: string;
}

export async function completeSale(input: CompleteSaleInput): Promise<SaleResult> {
  try {
    // Validate stock availability before proceeding
    for (const item of input.items) {
      if (item.variantId) {
        const variant = await prisma.variant.findUnique({
          where: { id: item.variantId },
          select: { stock: true, name: true },
        });
        if (!variant || variant.stock < item.quantity) {
          return {
            success: false,
            error: `Insufficient stock for "${item.name} - ${variant?.name || item.variantName}". Available: ${variant?.stock || 0}, Requested: ${item.quantity}`,
          };
        }
      } else {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          select: { stock: true, name: true },
        });
        if (!product || product.stock < item.quantity) {
          return {
            success: false,
            error: `Insufficient stock for "${item.name}". Available: ${product?.stock || 0}, Requested: ${item.quantity}`,
          };
        }
      }
    }

    // Generate order number
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const count = await prisma.order.count({
      where: {
        createdAt: {
          gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
        },
      },
    });
    const orderNumber = `POS-${dateStr}-${String(count + 1).padStart(4, '0')}`;

    // Construct Transaction ID / Note for Mobile Payment
    let finalTransactionId = orderNumber;
    
    if (input.mobileTrxId || input.mobileNumber) {
        const details = [];
        if (input.mobileProvider) details.push(input.mobileProvider);
        if (input.mobileNumber) details.push(input.mobileNumber);
        if (input.mobileTrxId) details.push(`Trx: ${input.mobileTrxId}`);
        
        if (details.length > 0) {
            finalTransactionId = details.join(' - ');
        }
    } else if (input.cardTrxId) {
        const details = [`Trx: ${input.cardTrxId}`];
        if (input.cardLast4) details.push(`Last4: ${input.cardLast4}`);
        finalTransactionId = details.join(' - ');
    }

    const result = await prisma.$transaction(async (tx) => {
      // 0. Upsert POS Customer if name+phone provided
      let posCustomerId: string | null = null;
      if (input.customerName && input.customerPhone) {
        const customer = await _upsertCustomerInternal(input.customerName, input.customerPhone, tx);
        posCustomerId = customer.id;
      }

      // Compute due/paid
      const paidAmount = input.paidAmount ?? input.grandTotal;
      const dueAmount = input.dueAmount ?? 0;
      const posPaymentStatus =
        dueAmount <= 0 ? 'PAID' : paidAmount > 0 ? 'PARTIAL' : 'DUE';

      // 1. Create Order
      const order = await tx.order.create({
        data: {
          orderNumber,
          isPos: true,
          paymentStatus: dueAmount > 0 ? 'PENDING' : 'PAID',
          posPaymentStatus: posPaymentStatus as any,
          paidAmount,
          dueAmount,
          paymentMethod: input.paymentMethod,
          totalAmount: input.subtotal,
          discount: input.discount,
          tax: input.tax,
          grandTotal: input.grandTotal,
          shippingCost: 0,
          customerName: input.customerName || null,
          customerPhone: input.customerPhone || null,
          transactionId: finalTransactionId,
          cashierId: input.cashierId || null,
          cashPayment: input.cashPayment || null,
          cardPayment: input.cardPayment || null,
          mobilePayment: input.mobilePayment || null,
          posCustomerId,
        },
      });

      // 2. Create Order Payments
      const payments = [];
      if (input.paymentMethod === 'MIXED') {
          if (input.cashPayment && input.cashPayment > 0) {
              payments.push({
                  orderId: order.id,
                  method: 'CASH' as PaymentMethod,
                  amount: input.cashPayment
              });
          }
          if (input.cardPayment && input.cardPayment > 0) {
              payments.push({
                  orderId: order.id,
                  method: 'CARD' as PaymentMethod,
                  amount: input.cardPayment,
                  transactionId: input.cardTrxId,
                  note: input.cardLast4 ? `Last4: ${input.cardLast4}` : undefined
              });
          }
          if (input.mobilePayment && input.mobilePayment > 0) {
              payments.push({
                  orderId: order.id,
                  method: 'MOBILE_BANKING' as PaymentMethod,
                  amount: input.mobilePayment,
                  provider: input.mobileProvider,
                  transactionId: input.mobileTrxId,
                  phoneNumber: input.mobileNumber,
                  note: input.mobileCashOutCharge ? `Charge: ${input.mobileCashOutCharge}` : undefined
              });
          }
      } else {
          // Single payment
          payments.push({
              orderId: order.id,
              method: input.paymentMethod as PaymentMethod,
              amount: input.grandTotal, 
              provider: input.mobileProvider,
              transactionId: input.paymentMethod === 'CARD' ? input.cardTrxId : input.mobileTrxId,
              phoneNumber: input.mobileNumber,
              note: input.paymentMethod === 'CARD' && input.cardLast4 
                  ? `Last4: ${input.cardLast4}` 
                  : (input.mobileCashOutCharge ? `Charge: ${input.mobileCashOutCharge}` : undefined)
          });
      }

      if (payments.length > 0) {
          await tx.orderPayment.createMany({ data: payments });
      }

      // 3. Create Guarantor if provided (before stock loop to avoid timeout)
      if (input.guarantorName && input.guarantorPhone) {
        await tx.guarantor.create({
          data: {
            orderId: order.id,
            name: input.guarantorName,
            phone: input.guarantorPhone,
            relation: input.guarantorRelation || null,
            address: input.guarantorAddress || null,
          },
        });
      }

      // 4. Create Order Items & Deduct Stock
      for (const item of input.items) {
        await tx.orderItem.create({
          data: {
            orderId: order.id,
            productId: item.productId,
            variantId: item.variantId || null,
            productName: item.name + (item.variantName ? ` - ${item.variantName}` : ''),
            quantity: item.quantity,
            unitPrice: item.price,
            total: item.price * item.quantity,
          },
        });

        // Deduct stock
        if (item.variantId) {
          await tx.variant.update({
            where: { id: item.variantId },
            data: { stock: { decrement: item.quantity } },
          });

          // Also update parent product stock
          const allVariants = await tx.variant.findMany({
            where: { productId: item.productId },
            select: { stock: true },
          });
          const totalStock = allVariants.reduce((sum: number, v: { stock: number }) => sum + v.stock, 0);
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: totalStock },
          });
        } else {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } },
          });
        }

        // 4b. Log stock movement
        await tx.stockHistory.create({
          data: {
            productId: item.productId,
            variantId: item.variantId || null,
            action: 'REDUCE',
            quantity: item.quantity,
            previousStock: item.maxStock,
            newStock: item.maxStock - item.quantity,
            reason: 'POS Sale',
            note: `Order: ${orderNumber}`,
            source: 'POS',
          },
        });
      }

      return order;
    }, { timeout: 30000 });

    // Update customer stats after transaction
    if (result.posCustomerId) {
      await _updateCustomerStatsInternal(result.posCustomerId);
    }

    revalidatePath('/admin/products');
    revalidatePath('/admin/pos');

    return {
      success: true,
      orderId: result.id,
      orderNumber,
    };
  } catch (error: any) {
    console.error('POS Sale Error:', error);
    return {
      success: false,
      error: (error as any)?.message || 'Failed to complete sale',
    };
  }
}

export async function getPOSCategories() {
  return prisma.category.findMany({
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });
}

export async function getDailySalesSummary() {
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  const [totalSales, totalOrders, totalItems] = await Promise.all([
    prisma.order.aggregate({
      where: {
        isPos: true, // Changed from type: 'POS'
        paymentStatus: 'PAID', // Changed from status: 'COMPLETED'
        createdAt: { gte: startOfDay },
      },
      _sum: { grandTotal: true }, // Changed from total
    }),
    prisma.order.count({
      where: {
        isPos: true, // Changed from type: 'POS'
        paymentStatus: 'PAID', // Changed from status: 'COMPLETED'
        createdAt: { gte: startOfDay },
      },
    }),
    prisma.orderItem.aggregate({
      where: {
        order: {
          isPos: true, // Changed from type: 'POS'
          paymentStatus: 'PAID', // Changed from status: 'COMPLETED'
          createdAt: { gte: startOfDay },
        },
      },
      _sum: { quantity: true },
    }),
  ]);

  return {
    totalSales: totalSales._sum.grandTotal || 0, // Changed from total
    totalOrders,
    totalItems: totalItems._sum.quantity || 0,
  };
}

export async function getRecentPOSOrders(limit = 10) {
  return prisma.order.findMany({
    where: { isPos: true }, // Changed from type: 'POS'
    include: {
      items: true,
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

export async function getPOSSalesReport(startDate?: Date, endDate?: Date) {
  const where: any = {
    isPos: true,
    paymentStatus: 'PAID',
  };

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = startDate;
    if (endDate) where.createdAt.lte = endDate;
  }

  const [orders, summary] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        items: {
          include: {
            product: { select: { name: true } },
            variant: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.order.aggregate({
      where,
      _sum: {
        grandTotal: true,
        discount: true,
        tax: true,
      },
      _count: true,
    }),
  ]);

  const totalItems = await prisma.orderItem.aggregate({
    where: {
      order: where,
    },
    _sum: { quantity: true },
  });

  // Payment method breakdown
  const paymentBreakdown = await prisma.order.groupBy({
    by: ['paymentMethod'],
    where,
    _sum: { grandTotal: true },
    _count: true,
  });

  return {
    orders,
    summary: {
      totalSales: summary._sum.grandTotal || 0,
      totalOrders: summary._count,
      totalItems: totalItems._sum.quantity || 0,
      totalDiscount: summary._sum.discount || 0,
      totalTax: summary._sum.tax || 0,
    },
    paymentBreakdown: paymentBreakdown.map((p) => ({
      method: p.paymentMethod,
      total: p._sum.grandTotal || 0,
      count: p._count,
    })),
  };
}

