'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

const db = prisma as any;

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• TYPES â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

export interface SupplierInput {
  name: string;
  companyName?: string;
  phone: string;
  address?: string;
  notes?: string;
}

export interface PurchaseInput {
  supplierId: string;
  invoiceNumber: string;
  date?: string;
  discount?: number;
  paidAmount?: number;
  note?: string;
  attachment?: string;
  items: PurchaseItemInput[];
}

export interface PurchaseItemInput {
  productId: string;
  quantity: number;
  costPrice: number;
}

export interface SupplierPaymentInput {
  supplierId: string;
  amount: number;
  paymentMethod?: string;
  note?: string;
}

export interface SupplierFilters {
  page?: number;
  limit?: number;
  search?: string;
}

export interface PurchaseFilters {
  page?: number;
  limit?: number;
  supplierId?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• SUPPLIER CRUD â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

export async function getSuppliers(filters: SupplierFilters = {}) {
  try {
    const { page = 1, limit = 20, search } = filters;
    const skip = (page - 1) * limit;

    const where: any = { isActive: true };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { companyName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [suppliers, total] = await Promise.all([
      db.supplier.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          purchases: {
            select: {
              totalAmount: true,
              paidAmount: true,
              dueAmount: true,
            },
          },
          _count: {
            select: { purchases: true, payments: true },
          },
        },
      }),
      db.supplier.count({ where }),
    ]);

    // Calculate aggregated info
    const suppliersWithTotals = suppliers.map((s: any) => {
      const totalPurchase = s.purchases.reduce((sum: number, p: any) => sum + p.totalAmount, 0);
      const totalPaid = s.purchases.reduce((sum: number, p: any) => sum + p.paidAmount, 0);
      const totalDue = s.purchases.reduce((sum: number, p: any) => sum + p.dueAmount, 0);
      return {
        id: s.id,
        name: s.name,
        companyName: s.companyName,
        phone: s.phone,
        address: s.address,
        notes: s.notes,
        isActive: s.isActive,
        createdAt: s.createdAt.toISOString(),
        totalPurchase,
        totalPaid,
        totalDue,
        purchaseCount: s._count.purchases,
      };
    });

    return {
      success: true,
      data: suppliersWithTotals,
      total,
      pages: Math.ceil(total / limit),
    };
  } catch (error: any) {
    return { success: false, error: error.message, data: [], total: 0, pages: 0 };
  }
}

export async function getSupplierById(id: string) {
  try {
    const supplier = await db.supplier.findUnique({
      where: { id },
      include: {
        purchases: {
          orderBy: { date: 'desc' },
          include: {
            items: true,
          },
        },
        payments: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!supplier) return { success: false, error: 'Supplier not found' };

    const totalPurchase = supplier.purchases.reduce((sum: number, p: any) => sum + p.totalAmount, 0);
    const totalPayments = supplier.payments.reduce((sum: number, p: any) => sum + p.amount, 0);
    const purchasePaid = supplier.purchases.reduce((sum: number, p: any) => sum + p.paidAmount, 0);
    const totalPaid = purchasePaid + totalPayments;
    const totalDue = totalPurchase - totalPaid;

    return {
      success: true,
      data: {
        ...supplier,
        createdAt: supplier.createdAt.toISOString(),
        updatedAt: supplier.updatedAt.toISOString(),
        totalPurchase,
        totalPaid,
        totalDue: totalDue < 0 ? 0 : totalDue,
        purchases: supplier.purchases.map((p: any) => ({
          ...p,
          date: p.date.toISOString(),
          createdAt: p.createdAt.toISOString(),
          updatedAt: p.updatedAt.toISOString(),
          itemCount: p.items.length,
          items: p.items.map((i: any) => ({
            ...i,
            createdAt: i.createdAt.toISOString(),
          })),
        })),
        payments: supplier.payments.map((p: any) => ({
          ...p,
          createdAt: p.createdAt.toISOString(),
        })),
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createSupplier(input: SupplierInput) {
  try {
    const supplier = await db.supplier.create({
      data: {
        name: input.name,
        companyName: input.companyName || null,
        phone: input.phone,
        address: input.address || null,
        notes: input.notes || null,
      },
    });

    revalidatePath('/admin/vendors');
    return { success: true, data: supplier };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateSupplier(id: string, input: SupplierInput) {
  try {
    const supplier = await db.supplier.update({
      where: { id },
      data: {
        name: input.name,
        companyName: input.companyName || null,
        phone: input.phone,
        address: input.address || null,
        notes: input.notes || null,
      },
    });

    revalidatePath('/admin/vendors');
    revalidatePath(`/admin/vendors/${id}`);
    return { success: true, data: supplier };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteSupplier(id: string) {
  try {
    // Check if supplier has purchases
    const purchaseCount = await db.purchase.count({
      where: { supplierId: id },
    });

    if (purchaseCount > 0) {
      // Soft delete
      await db.supplier.update({
        where: { id },
        data: { isActive: false },
      });
    } else {
      await db.supplier.delete({ where: { id } });
    }

    revalidatePath('/admin/vendors');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• SUPPLIER LIST (for dropdowns) â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

export async function getSupplierList() {
  try {
    const suppliers = await db.supplier.findMany({
      where: { isActive: true },
      select: { id: true, name: true, companyName: true, phone: true },
      orderBy: { name: 'asc' },
    });
    return { success: true, data: suppliers };
  } catch (error: any) {
    return { success: false, error: error.message, data: [] };
  }
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• PURCHASE MANAGEMENT â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

export async function getPurchases(filters: PurchaseFilters = {}) {
  try {
    const { page = 1, limit = 20, supplierId, status, dateFrom, dateTo, search } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (supplierId) where.supplierId = supplierId;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search, mode: 'insensitive' } },
        { supplier: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }
    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) where.date.gte = new Date(dateFrom);
      if (dateTo) where.date.lte = new Date(dateTo + 'T23:59:59.999Z');
    }

    const [purchases, total] = await Promise.all([
      db.purchase.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: 'desc' },
        include: {
          supplier: {
            select: { id: true, name: true, companyName: true },
          },
          _count: {
            select: { items: true },
          },
        },
      }),
      db.purchase.count({ where }),
    ]);

    return {
      success: true,
      data: purchases.map((p: any) => ({
        ...p,
        date: p.date.toISOString(),
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
        itemCount: p._count.items,
      })),
      total,
      pages: Math.ceil(total / limit),
    };
  } catch (error: any) {
    return { success: false, error: error.message, data: [], total: 0, pages: 0 };
  }
}

export async function getPurchaseById(id: string) {
  try {
    const purchase = await db.purchase.findUnique({
      where: { id },
      include: {
        supplier: true,
        items: true,
      },
    });

    if (!purchase) return { success: false, error: 'Purchase not found' };

    // Fetch product names for items
    const productIds = purchase.items.map((i: any) => i.productId);
    const products = await db.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, sku: true, images: true },
    });
    const productMap = Object.fromEntries(products.map((p: any) => [p.id, p]));

    return {
      success: true,
      data: {
        ...purchase,
        date: purchase.date.toISOString(),
        createdAt: purchase.createdAt.toISOString(),
        updatedAt: purchase.updatedAt.toISOString(),
        items: purchase.items.map((i: any) => ({
          ...i,
          productName: productMap[i.productId]?.name || 'Unknown Product',
          productSku: productMap[i.productId]?.sku || null,
          productImage: productMap[i.productId]?.images?.[0] || null,
          createdAt: i.createdAt.toISOString(),
        })),
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Create a purchase and:
 * 1. Create purchase items
 * 2. Increase product stock
 * 3. Update product cost price using weighted average
 * 4. Record stock history
 */
export async function createPurchase(input: PurchaseInput) {
  try {
    const totalAmount =
      input.items.reduce((sum, item) => sum + item.quantity * item.costPrice, 0) -
      (input.discount || 0);
    const paidAmount = input.paidAmount || 0;
    const dueAmount = totalAmount - paidAmount;

    let status: 'PAID' | 'PARTIAL' | 'CONFIRMED' = 'CONFIRMED';
    if (paidAmount >= totalAmount) status = 'PAID';
    else if (paidAmount > 0) status = 'PARTIAL';

    const result = await db.$transaction(async (tx: any) => {
      // 1. Create the purchase
      const purchase = await tx.purchase.create({
        data: {
          supplierId: input.supplierId,
          invoiceNumber: input.invoiceNumber,
          date: input.date ? new Date(input.date) : new Date(),
          totalAmount,
          paidAmount,
          dueAmount: dueAmount < 0 ? 0 : dueAmount,
          discount: input.discount || 0,
          status,
          note: input.note || null,
          attachment: input.attachment || null,
          items: {
            create: input.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              costPrice: item.costPrice,
              subtotal: item.quantity * item.costPrice,
            })),
          },
        },
        include: { items: true },
      });

      // 2a. If paid at purchase time, create a SupplierPayment record so ledger is clean
      if (paidAmount > 0) {
        await tx.supplierPayment.create({
          data: {
            supplierId: input.supplierId,
            amount: paidAmount,
            paymentMethod: 'CASH',
            note: `Paid at purchase #${input.invoiceNumber}`,
          },
        });
      }

      // 3. Update each product's stock and cost price (weighted average)
      for (const item of input.items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
          select: { id: true, stock: true, costPrice: true, name: true },
        });

        if (!product) continue;

        const oldStock = product.stock;
        const oldCostPrice = product.costPrice || 0;
        const newQuantity = item.quantity;
        const newCostPrice = item.costPrice;

        // Weighted average cost calculation
        const oldStockValue = oldStock * oldCostPrice;
        const newPurchaseValue = newQuantity * newCostPrice;
        const totalQuantity = oldStock + newQuantity;
        const weightedAvgCost =
          totalQuantity > 0 ? (oldStockValue + newPurchaseValue) / totalQuantity : newCostPrice;

        // Update product stock and cost price
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: { increment: newQuantity },
            costPrice: Math.round(weightedAvgCost * 100) / 100,
          },
        });

        // Record stock history
        await tx.stockHistory.create({
          data: {
            productId: item.productId,
            action: 'ADD',
            quantity: newQuantity,
            previousStock: oldStock,
            newStock: oldStock + newQuantity,
            reason: 'Purchase',
            note: `Purchase Invoice: ${input.invoiceNumber}`,
            source: 'Purchase',
          },
        });
      }

      return purchase;
    });

    revalidatePath('/admin/vendors');
    revalidatePath('/admin/products');
    return { success: true, data: result };
  } catch (error: any) {
    if (error.code === 'P2002') {
      return { success: false, error: 'Invoice number already exists' };
    }
    return { success: false, error: error.message };
  }
}

export async function deletePurchase(id: string) {
  try {
    const purchase = await db.purchase.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!purchase) return { success: false, error: 'Purchase not found' };

    await db.$transaction(async (tx: any) => {
      // Reverse stock changes
      for (const item of purchase.items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
          select: { stock: true, costPrice: true },
        });

        if (product) {
          const newStock = Math.max(0, product.stock - item.quantity);

          await tx.product.update({
            where: { id: item.productId },
            data: { stock: newStock },
          });

          await tx.stockHistory.create({
            data: {
              productId: item.productId,
              action: 'REDUCE',
              quantity: item.quantity,
              previousStock: product.stock,
              newStock,
              reason: 'Purchase Deleted',
              note: `Reversed purchase ${purchase.invoiceNumber}`,
              source: 'Purchase',
            },
          });
        }
      }

      await tx.purchase.delete({ where: { id } });
    });

    revalidatePath('/admin/vendors');
    revalidatePath('/admin/products');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• SUPPLIER PAYMENT â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

export async function createSupplierPayment(input: SupplierPaymentInput) {
  try {
    const result = await db.$transaction(async (tx: any) => {
      // Create the payment
      const payment = await tx.supplierPayment.create({
        data: {
          supplierId: input.supplierId,
          amount: input.amount,
          paymentMethod: input.paymentMethod || 'CASH',
          note: input.note || null,
        },
      });

      // Find unpaid/partial purchases and apply payment
      const duePurchases = await tx.purchase.findMany({
        where: {
          supplierId: input.supplierId,
          dueAmount: { gt: 0 },
        },
        orderBy: { date: 'asc' }, // Pay oldest first
      });

      let remaining = input.amount;
      for (const purchase of duePurchases) {
        if (remaining <= 0) break;

        const payable = Math.min(remaining, purchase.dueAmount);
        const newPaid = purchase.paidAmount + payable;
        const newDue = purchase.totalAmount - newPaid;

        let newStatus: 'PAID' | 'PARTIAL' | 'CONFIRMED' = 'PARTIAL';
        if (newDue <= 0) newStatus = 'PAID';
        else if (newPaid > 0) newStatus = 'PARTIAL';

        await tx.purchase.update({
          where: { id: purchase.id },
          data: {
            paidAmount: newPaid,
            dueAmount: newDue < 0 ? 0 : newDue,
            status: newStatus,
          },
        });

        remaining -= payable;
      }

      return payment;
    });

    revalidatePath('/admin/vendors');
    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteSupplierPayment(paymentId: string) {
  try {
    const payment = await db.supplierPayment.findUnique({
      where: { id: paymentId },
      select: { supplierId: true, amount: true },
    });
    if (!payment) return { success: false, error: 'Payment not found' };

    // Reverse: find the oldest purchases that are now fully/partially paid and subtract
    // Simple approach: delete the payment and re-apply all remaining payments from scratch
    // to recalculate purchase statuses correctly.
    await db.$transaction(async (tx: any) => {
      // Delete the payment record
      await tx.supplierPayment.delete({ where: { id: paymentId } });

      // Reset all purchases for this supplier to original unpaid state (use totalAmount - paidAtPurchase)
      // We know paidAtPurchase is the amount paid at the time of purchase creation.
      // Recalculate: get all remaining payments ordered by date
      const remainingPayments = await tx.supplierPayment.findMany({
        where: { supplierId: payment.supplierId },
        orderBy: { createdAt: 'asc' },
      });

      // Reset all purchase paid amounts to their original purchase-time paid values
      // (stored in paidAmount when status was first created)
      // We can't know original paidAtPurchase directly, so we reset due purchases
      // by zeroing out external payments and re-applying them.
      // Simplest: fetch all purchases, reset paidAmount/dueAmount based on original data.
      // Since we store paidAmount = (paid at purchase time + external payments applied),
      // we need a different approach.
      //
      // Best approach: mark all purchases as having dueAmount = totalAmount first,
      // then re-apply all remaining external payments.
      const allPurchases = await tx.purchase.findMany({
        where: { supplierId: payment.supplierId },
        orderBy: { date: 'asc' },
      });

      // Reset each purchase: assume initial paidAmount = 0, dueAmount = totalAmount
      // (This is a simplification - if purchases had partial payment at entry time,
      // we cannot recover that info. For now, treat initial paidAmount as 0.)
      for (const p of allPurchases) {
        await tx.purchase.update({
          where: { id: p.id },
          data: {
            paidAmount: 0,
            dueAmount: p.totalAmount,
            status: 'CONFIRMED',
          },
        });
      }

      // Re-apply all remaining payments
      for (const pay of remainingPayments) {
        let remaining = pay.amount;
        const duePurchases = await tx.purchase.findMany({
          where: { supplierId: payment.supplierId, dueAmount: { gt: 0 } },
          orderBy: { date: 'asc' },
        });
        for (const p of duePurchases) {
          if (remaining <= 0) break;
          const payable = Math.min(remaining, p.dueAmount);
          const newPaid = p.paidAmount + payable;
          const newDue = p.totalAmount - newPaid;
          await tx.purchase.update({
            where: { id: p.id },
            data: {
              paidAmount: newPaid,
              dueAmount: newDue < 0 ? 0 : newDue,
              status: newDue <= 0 ? 'PAID' : newPaid > 0 ? 'PARTIAL' : 'CONFIRMED',
            },
          });
          remaining -= payable;
        }
      }
    });

    revalidatePath('/admin/vendors');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getSupplierPayments(supplierId: string) {
  try {
    const payments = await db.supplierPayment.findMany({
      where: { supplierId },
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      data: payments.map((p: any) => ({
        ...p,
        createdAt: p.createdAt.toISOString(),
      })),
    };
  } catch (error: any) {
    return { success: false, error: error.message, data: [] };
  }
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• SUPPLIER LEDGER â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

export async function getSupplierLedger(supplierId: string) {
  try {
    const supplier = await db.supplier.findUnique({
      where: { id: supplierId },
      include: {
        purchases: {
          orderBy: { date: 'asc' },
        },
        payments: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!supplier) return { success: false, error: 'Supplier not found' };

    type LedgerEntry = {
      date: string;
      type: 'Purchase' | 'Payment';
      reference: string;
      description: string;
      debit: number;
      credit: number;
      balance: number;
      paymentId?: string; // only for standalone Payment entries (deletable)
    };

    const entries: LedgerEntry[] = [];

    // Merge purchases and payments chronologically
    const allEvents: { date: Date; type: 'Purchase' | 'Payment'; data: any }[] = [
      ...supplier.purchases.map((p: any) => ({ date: p.date, type: 'Purchase' as const, data: p })),
      ...supplier.payments.map((p: any) => ({ date: p.createdAt, type: 'Payment' as const, data: p })),
    ];
    allEvents.sort((a, b) => a.date.getTime() - b.date.getTime());

    let runningBalance = 0;

    for (const event of allEvents) {
      if (event.type === 'Purchase') {
        runningBalance += event.data.totalAmount;
        entries.push({
          date: event.date.toISOString(),
          type: 'Purchase',
          reference: event.data.invoiceNumber,
          description: `Purchase Invoice #${event.data.invoiceNumber}`,
          debit: event.data.totalAmount,
          credit: 0,
          balance: runningBalance,
        });
      } else {
        // Standalone SupplierPayment record (includes auto-created ones at purchase time)
        runningBalance -= event.data.amount;
        entries.push({
          date: event.date.toISOString(),
          type: 'Payment',
          reference: `PAY-${event.data.id.slice(0, 8).toUpperCase()}`,
          description: event.data.note || 'Supplier Payment',
          debit: 0,
          credit: event.data.amount,
          balance: runningBalance,
          paymentId: event.data.id,
        });
      }
    }

    return { success: true, data: entries };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• DASHBOARD STATS â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

export async function getVendorDashboardStats() {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      supplierCount,
      totalPurchaseAgg,
      monthlyPurchaseAgg,
      recentPurchases,
      topSuppliers,
    ] = await Promise.all([
      db.supplier.count({ where: { isActive: true } }),
      db.purchase.aggregate({
        _sum: { totalAmount: true, paidAmount: true, dueAmount: true },
      }),
      db.purchase.aggregate({
        where: { date: { gte: startOfMonth } },
        _sum: { totalAmount: true },
        _count: true,
      }),
      db.purchase.findMany({
        take: 5,
        orderBy: { date: 'desc' },
        include: {
          supplier: { select: { name: true } },
          _count: { select: { items: true } },
        },
      }),
      db.supplier.findMany({
        where: { isActive: true },
        take: 5,
        include: {
          purchases: {
            select: { totalAmount: true, dueAmount: true },
          },
        },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    // Calculate top suppliers by purchase amount
    const topSuppliersFormatted = topSuppliers
      .map((s: any) => ({
        id: s.id,
        name: s.name,
        totalPurchase: s.purchases.reduce((sum: number, p: any) => sum + p.totalAmount, 0),
        totalDue: s.purchases.reduce((sum: number, p: any) => sum + p.dueAmount, 0),
      }))
      .sort((a: any, b: any) => b.totalPurchase - a.totalPurchase);

    return {
      success: true,
      data: {
        supplierCount,
        totalPurchase: totalPurchaseAgg._sum.totalAmount || 0,
        totalPaid: totalPurchaseAgg._sum.paidAmount || 0,
        totalDue: totalPurchaseAgg._sum.dueAmount || 0,
        monthlyPurchase: monthlyPurchaseAgg._sum.totalAmount || 0,
        monthlyPurchaseCount: monthlyPurchaseAgg._count || 0,
        recentPurchases: recentPurchases.map((p: any) => ({
          ...p,
          date: p.date.toISOString(),
          createdAt: p.createdAt.toISOString(),
          updatedAt: p.updatedAt.toISOString(),
          itemCount: p._count.items,
        })),
        topSuppliers: topSuppliersFormatted,
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• PRODUCT LIST FOR PURCHASE â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

export async function getProductsForPurchase(search?: string) {
  try {
    const where: any = { isActive: true };
    if (search && search.trim()) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { barcode: { contains: search, mode: 'insensitive' } },
      ];
    }

    const products = await prisma.product.findMany({
      where,
      select: {
        id: true,
        name: true,
        sku: true,
        barcode: true,
        stock: true,
        costPrice: true,
        price: true,
        images: true,
        category: { select: { name: true } },
      },
      orderBy: { name: 'asc' },
      take: 50,
    });

    return { success: true, data: products };
  } catch (error: any) {
    return { success: false, error: error.message, data: [] };
  }
}
