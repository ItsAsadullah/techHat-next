'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { PaymentMethod } from '@prisma/client';

// Helper to sanitize scanner input (remove CR/LF and trim)
function sanitizeInput(input?: string | null) {
  if (input === null || input === undefined) return input as any;
  try {
    return String(input).replace(/[\r\n]+/g, '').trim();
  } catch (e) {
    return String(input);
  }
}

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
  model: string | null;
  barcode: string | null;
  price: number;
  offerPrice: number | null;
  costPrice: number;
  stock: number;
  image: string | null;
  categoryName: string;
  variants: {
    id: string;
    name: string;
    sku: string | null;
    upc: string | null;
    price: number;
    offerPrice: number | null;
    costPrice: number;
    stock: number;
    image: string | null;
  }[];
}

export async function searchPOSProducts(query: string, categoryId?: string): Promise<POSProduct[]> {
  try {
    const where: any = {
      status: 'ACTIVE',
    };

    if (query && query.trim().length > 0) {
      const q = sanitizeInput(query);
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { sku: { contains: q, mode: 'insensitive' } },
        { model: { contains: q, mode: 'insensitive' } },
        { barcode: { contains: q, mode: 'insensitive' } },
        { variants: { some: { sku: { contains: q, mode: 'insensitive' } } } },
        { variants: { some: { upc: { contains: q, mode: 'insensitive' } } } },
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
        model: true,
        barcode: true,
        price: true,
        offerPrice: true,
        costPrice: true,
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
            upc: true,
            price: true,
            offerPrice: true,
            costPrice: true,
            stock: true,
            image: true,
          },
        },
      },
      take: 500,
      orderBy: { name: 'asc' },
    });

    const mappedProducts = products.map((p) => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      model: p.model,
      barcode: p.barcode,
      price: p.price,
      offerPrice: p.offerPrice,
      costPrice: p.costPrice,
      stock: p.stock,
      image: p.productImages[0]?.url || null,
      categoryName: p.category.name,
      variants: p.variants,
    }));

    if (query && query.trim().length > 0) {
      const q = query.trim().toLowerCase();
      
      const getScore = (p: POSProduct) => {
        let score = 0;
        const name = p.name.toLowerCase();
        const sku = p.sku?.toLowerCase() || '';
        const model = p.model?.toLowerCase() || '';
        const barcode = p.barcode?.toLowerCase() || '';
        
        // Product Model gets highest priority
        if (model === q) score += 1000;
        else if (model.startsWith(q)) score += 500;
        else if (model.includes(q)) score += 100;
        
        // Product Title gets second highest priority
        if (name === q) score += 800;
        else if (name.startsWith(q)) score += 400;
        else if (name.includes(q)) score += 50;

        // SKU/Barcode gets third priority
        if (sku === q || barcode === q) score += 600;
        else if (sku.startsWith(q) || barcode.startsWith(q)) score += 300;
        else if (sku.includes(q) || barcode.includes(q)) score += 30;

        for (const v of p.variants) {
           const vsku = v.sku?.toLowerCase() || '';
           const vupc = v.upc?.toLowerCase() || '';
           if (vsku === q) score += 600;
           else if (vsku.startsWith(q)) score += 300;
           else if (vsku.includes(q)) score += 30;
           if (vupc === q) score += 600;
           else if (vupc.startsWith(q)) score += 300;
           else if (vupc.includes(q)) score += 30;
        }
        
        return score;
      };
      
      mappedProducts.sort((a, b) => {
        const scoreDiff = getScore(b) - getScore(a);
        if (scoreDiff !== 0) return scoreDiff;
        
        // Secondary sort: out of stock at the bottom
        const aStock = a.stock > 0 || a.variants.some((v) => v.stock > 0) ? 1 : 0;
        const bStock = b.stock > 0 || b.variants.some((v) => v.stock > 0) ? 1 : 0;
        return bStock - aStock;
      });
    } else {
      // Sort initial products: out of stock at the bottom, then alphabetical
      mappedProducts.sort((a, b) => {
        const aStock = a.stock > 0 || a.variants.some((v) => v.stock > 0) ? 1 : 0;
        const bStock = b.stock > 0 || b.variants.some((v) => v.stock > 0) ? 1 : 0;
        if (aStock !== bStock) return bStock - aStock;
        return a.name.localeCompare(b.name);
      });
    }

    return mappedProducts;
  } catch (error: any) {
    console.error('searchPOSProducts error:', error);
    return [];
  }
}

export async function findProductByBarcode(barcode: string): Promise<POSProduct | null> {
  try {
    const b = sanitizeInput(barcode);
    const product = await prisma.product.findFirst({
      where: {
        status: 'ACTIVE',
        OR: [
          { barcode: b },
          { sku: b },
          { model: b },
          { variants: { some: { sku: b } } },
          { variants: { some: { upc: b } } },
        ],
      },
      select: {
        id: true,
        name: true,
        sku: true,
        model: true,
        barcode: true,
        price: true,
        offerPrice: true,
        costPrice: true,
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
            upc: true,
            price: true,
            offerPrice: true,
            costPrice: true,
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
      model: product.model,
      barcode: product.barcode,
      price: product.price,
      offerPrice: product.offerPrice,
      costPrice: product.costPrice,
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
  costPrice: number;
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
    // PERF: Batch stock validation — replaces the original per-item sequential
    // findUnique loop (2N DB queries for N items) with 2 batch findMany calls
    // + Map lookups. For a 10-item cart this goes from 20 queries → 2 queries.
    // We need to fetch product stock for ALL items to allow fallback logic
    // when a variant's stock is out of sync with its parent product.
    const productIds = Array.from(new Set(input.items.map(i => i.productId)));
    const variantIds = Array.from(new Set(input.items.filter(i => i.variantId).map(i => i.variantId!)));

    const [stockProducts, stockVariants] = await Promise.all([
      productIds.length
        ? prisma.product.findMany({
            where: { id: { in: productIds } },
            select: { id: true, stock: true, name: true },
          })
        : Promise.resolve([]),
      variantIds.length
        ? prisma.variant.findMany({
            where: { id: { in: variantIds } },
            select: { id: true, stock: true, name: true },
          })
        : Promise.resolve([]),
    ]);

    const productStockMap = new Map(stockProducts.map((p) => [p.id, p]));
    const variantStockMap = new Map(stockVariants.map((v) => [v.id, v]));

    for (const item of input.items) {
      if (item.variantId) {
        const variant = variantStockMap.get(item.variantId);
        const product = productStockMap.get(item.productId);
        
        const availableStock = variant?.stock || 0;

        if (!variant || availableStock < item.quantity) {
          return {
            success: false,
            error: `Insufficient stock for "${item.name}${variant?.name && variant.name.toLowerCase() !== 'default' ? ` - ${variant.name}` : ''}". Available: ${availableStock}, Requested: ${item.quantity}`,
          };
        }
      } else {
        const product = productStockMap.get(item.productId);
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
      const orderItemsData = input.items.map((item) => ({
        orderId: order.id,
        productId: item.productId,
        variantId: item.variantId || null,
        productName: item.name + (item.variantName ? ` - ${item.variantName}` : ''),
        quantity: item.quantity,
        unitPrice: item.price,
        total: item.price * item.quantity,
      }));
      await tx.orderItem.createMany({ data: orderItemsData });

      // 4b. Log stock movement
      const stockHistoryData = input.items.map((item) => ({
        productId: item.productId,
        variantId: item.variantId || null,
        action: 'REDUCE' as const,
        quantity: item.quantity,
        previousStock: item.maxStock,
        newStock: item.maxStock - item.quantity,
        reason: 'POS Sale',
        note: `Order: ${orderNumber}`,
        source: 'POS',
      }));
      await tx.stockHistory.createMany({ data: stockHistoryData });

      // 4c. Deduct stock concurrently and increment soldCount
      const variantDecrements: Record<string, number> = {};
      const productDecrements: Record<string, number> = {};

      for (const item of input.items) {
        if (item.variantId) {
          variantDecrements[item.variantId] = (variantDecrements[item.variantId] || 0) + item.quantity;
        }
        productDecrements[item.productId] = (productDecrements[item.productId] || 0) + item.quantity;
      }

      const variantPromises = Object.entries(variantDecrements).map(([id, qty]) =>
        tx.variant.update({
          where: { id },
          data: { stock: { decrement: qty } },
        })
      );

      const productPromises = Object.entries(productDecrements).map(([id, qty]) =>
        tx.product.update({
          where: { id },
          data: { stock: { decrement: qty }, soldCount: { increment: qty } },
        })
      );

      // Create StockLedger entries for ERP
      let mainWarehouse = await tx.warehouse.findFirst({ where: { type: 'MAIN' } });
      if (!mainWarehouse) {
        mainWarehouse = await tx.warehouse.findFirst();
      }

      if (mainWarehouse) {
        for (const item of input.items) {
          const lastLedger = await tx.stockLedger.findFirst({
            where: {
              warehouseId: mainWarehouse.id,
              productId: item.productId,
              variantId: item.variantId || null
            },
            orderBy: { createdAt: 'desc' }
          });
          const warehouseOpeningQty = lastLedger ? lastLedger.balanceQty : item.maxStock;
          
          await tx.stockLedger.create({
            data: {
              referenceType: 'POS Sale',
              referenceId: orderNumber,
              warehouseId: mainWarehouse.id,
              productId: item.productId,
              variantId: item.variantId || null,
              outQty: item.quantity,
              balanceQty: warehouseOpeningQty - item.quantity,
              unitCost: item.costPrice || 0,
              totalValue: item.quantity * (item.costPrice || 0),
              note: `POS Order: ${orderNumber}`
            }
          });
        }
      }

      await Promise.all([...variantPromises, ...productPromises]);

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
  const categories = await prisma.category.findMany({
    select: { 
      id: true, 
      name: true,
      _count: {
        select: { products: { where: { status: 'ACTIVE' } } }
      }
    },
    orderBy: { name: 'asc' },
  });
  return categories.map((c) => ({
    id: c.id,
    name: c.name,
    productCount: c._count.products,
  }));
}

export async function getDailySalesSummary(targetDate?: Date | string) {
  const dateObj = targetDate ? new Date(targetDate) : new Date();
  const startOfDay = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
  const endOfDay = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate() + 1);

  const [totalSales, totalOrders, totalItems] = await Promise.all([
    prisma.order.aggregate({
      where: {
        isPos: true,
        createdAt: { gte: startOfDay, lt: endOfDay },
      },
      _sum: { grandTotal: true },
    }),
    prisma.order.count({
      where: {
        isPos: true,
        createdAt: { gte: startOfDay, lt: endOfDay },
      },
    }),
    prisma.orderItem.aggregate({
      where: {
        order: {
          isPos: true,
          createdAt: { gte: startOfDay, lt: endOfDay },
        },
      },
      _sum: { quantity: true },
    }),
  ]);

  return {
    totalSales: totalSales._sum.grandTotal || 0,
    totalOrders,
    totalItems: totalItems._sum.quantity || 0,
  };
}

export async function getPOSSalesDates() {
  try {
    const dates = await prisma.$queryRaw<{ date: Date }[]>`
      SELECT DISTINCT DATE_TRUNC('day', "created_at") as date
      FROM "orders"
      WHERE "is_pos" = true
      ORDER BY date DESC
    `;

    return dates.map((d) => {
      // Handle depending on the DB driver returning Date or string
      const dateObj = d.date instanceof Date ? d.date : new Date(d.date);
      return dateObj.toISOString().split('T')[0];
    });
  } catch (error) {
    console.error('getPOSSalesDates error:', error);
    return [];
  }
}

export async function getDailyPOSOrders(targetDate?: Date | string) {
  const dateObj = targetDate ? new Date(targetDate) : new Date();
  const startOfDay = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
  const endOfDay = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate() + 1);

  const orders = await prisma.order.findMany({
    where: {
      isPos: true,
      createdAt: { gte: startOfDay, lt: endOfDay },
    },
    include: {
      items: {
        include: {
          product: {
            select: {
              productImages: {
                where: { isThumbnail: true },
                select: { url: true },
                take: 1
              }
            }
          },
          variant: { select: { image: true } }
        }
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return JSON.parse(JSON.stringify(orders));
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

