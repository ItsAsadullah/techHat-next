'use server';

import { prisma } from '@/lib/prisma';

const db = prisma as any

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function dateRange(from?: string, to?: string) {
  const gte = from ? new Date(from) : undefined;
  const lte = to ? new Date(new Date(to).setHours(23, 59, 59, 999)) : undefined;
  if (!gte && !lte) return undefined;
  return { ...(gte && { gte }), ...(lte && { lte }) };
}

// ─────────────────────────────────────────────────────────────────────────────
// SUMMARY CARDS
// ─────────────────────────────────────────────────────────────────────────────
export async function getReportSummary() {
  try {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    todaySales,
    monthSales,
    totalExpenses,
    customerDue,
    stockAgg,
    vendorDue,
  ] = await Promise.all([
    prisma.order.aggregate({
      _sum: { grandTotal: true },
      where: { createdAt: { gte: startOfToday }, status: { not: 'CANCELLED' } },
    }),
    prisma.order.aggregate({
      _sum: { grandTotal: true },
      where: { createdAt: { gte: startOfMonth }, status: { not: 'CANCELLED' } },
    }),
    prisma.expense.aggregate({ _sum: { amount: true } }),
    db.pOSCustomer.aggregate({ _sum: { totalDue: true } }),
    prisma.product.findMany({ select: { stock: true, costPrice: true } }),
    db.supplier.findMany({
      include: {
        purchases: { select: { totalAmount: true } },
        payments: { select: { amount: true } },
      },
    }),
  ]);

  const totalStockValue = stockAgg.reduce(
    (s: number, p: any) => s + p.stock * p.costPrice,
    0,
  );
  const totalSales = monthSales._sum.grandTotal ?? 0;
  const totalCost = await prisma.orderItem.aggregate({ _sum: { total: true } });
  const totalExpense = totalExpenses._sum.amount ?? 0;
  const totalVendorDue = (vendorDue as any).reduce((s: number, sup: any) => {
    const purchased = sup.purchases.reduce((a: number, p: any) => a + p.totalAmount, 0);
    const paid = sup.payments.reduce((a: number, p: any) => a + p.amount, 0);
    return s + Math.max(0, purchased - paid);
  }, 0);

  return {
    todaySales: todaySales._sum.grandTotal ?? 0,
    monthSales: totalSales,
    totalExpenses: totalExpense,
    netProfit: totalSales - totalExpense,
    totalStockValue,
    totalCustomerDue: customerDue._sum?.totalDue ?? 0,
    totalVendorDue,
  };
  } catch (error: any) {
    console.error('getReportSummary error:', error);
    return { todaySales: 0, monthSales: 0, totalExpenses: 0, netProfit: 0, totalStockValue: 0, totalCustomerDue: 0, totalVendorDue: 0 };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// A) SALES REPORT
// ─────────────────────────────────────────────────────────────────────────────
export async function getSalesReport(from?: string, to?: string) {
  try {
  const range = dateRange(from, to);
  const orders = await prisma.order.findMany({
    where: {
      status: { not: 'CANCELLED' },
      ...(range && { createdAt: range }),
    },
    select: {
      id: true,
      orderNumber: true,
      customerName: true,
      posCustomer: { select: { name: true, phone: true } },
      grandTotal: true,
      paidAmount: true,
      dueAmount: true,
      status: true,
      paymentStatus: true,
      posPaymentStatus: true,
      isPos: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  const totals = orders.reduce(
    (acc, o) => ({
      grandTotal: acc.grandTotal + (o.grandTotal ?? 0),
      paidAmount: acc.paidAmount + (o.paidAmount ?? 0),
      dueAmount: acc.dueAmount + (o.dueAmount ?? 0),
    }),
    { grandTotal: 0, paidAmount: 0, dueAmount: 0 },
  );

  return { rows: orders, totals };
  } catch (error: any) {
    console.error('getSalesReport error:', error);
    return { rows: [], totals: { grandTotal: 0, paidAmount: 0, dueAmount: 0 } };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// B) PRODUCT REPORT
// ─────────────────────────────────────────────────────────────────────────────
export async function getProductReport() {
  try {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      sku: true,
      price: true,
      costPrice: true,
      stock: true,
      category: { select: { name: true } },
      brand: { select: { name: true } },
    },
    orderBy: { name: 'asc' },
  });

  const rows = products.map((p) => ({
    ...p,
    stockValue: p.stock * p.costPrice,
    categoryName: p.category.name,
    brandName: p.brand?.name ?? '-',
  }));

  const totals = rows.reduce(
    (acc, r) => ({
      stock: acc.stock + r.stock,
      stockValue: acc.stockValue + r.stockValue,
    }),
    { stock: 0, stockValue: 0 },
  );

  return { rows, totals };
  } catch (error: any) {
    console.error('getProductReport error:', error);
    return { rows: [], totals: { stock: 0, stockValue: 0 } };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// C) STOCK REPORT
// ─────────────────────────────────────────────────────────────────────────────
export async function getStockReport(from?: string, to?: string) {
  try {
  const range = dateRange(from, to);

  const products = await prisma.product.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      sku: true,
      stock: true,
      category: { select: { name: true } },
      stockHistory: {
        where: range ? { createdAt: range } : undefined,
        select: { action: true, quantity: true, reason: true },
      },
    },
    orderBy: { name: 'asc' },
  });

  const rows = products.map((p) => {
    let purchased = 0, sold = 0, adjusted = 0;
    for (const h of p.stockHistory) {
      if (h.action === 'ADD' && h.reason?.toLowerCase().includes('purchase')) purchased += h.quantity;
      else if (h.action === 'REDUCE') sold += h.quantity;
      else if (h.action === 'ADJUST') adjusted += h.quantity;
      else if (h.action === 'ADD') purchased += h.quantity;
    }
    const closing = p.stock;
    const opening = closing - purchased + sold - adjusted;
    return {
      id: p.id,
      name: p.name,
      sku: p.sku ?? '-',
      categoryName: p.category.name,
      opening: Math.max(0, opening),
      purchased,
      sold,
      adjusted,
      closing,
    };
  });

  return { rows };
  } catch (error: any) {
    console.error('getStockReport error:', error);
    return { rows: [] };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// D) EXPENSE REPORT
// ─────────────────────────────────────────────────────────────────────────────
export async function getExpenseReport(from?: string, to?: string) {
  try {
  const range = dateRange(from, to);
  const expenses: any[] = await (db.expense.findMany({
    where: range ? { date: range } : undefined,
    include: { category: { select: { name: true } } },
    orderBy: { date: 'desc' },
  }) as Promise<any[]>);

  const total = expenses.reduce((s: number, e: any) => s + e.amount, 0);
  const rows = expenses.map((e: any) => ({ ...e, categoryName: e.category?.name ?? e.categoryId }));
  return { rows, total };
  } catch (error: any) {
    console.error('getExpenseReport error:', error);
    return { rows: [], total: 0 };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// E) CUSTOMER DUE REPORT
// ─────────────────────────────────────────────────────────────────────────────
export async function getCustomerDueReport() {
  try {
  const customers = await db.pOSCustomer.findMany({
    where: { totalDue: { gt: 0 } },
    orderBy: { totalDue: 'desc' },
    select: {
      id: true,
      name: true,
      phone: true,
      totalPurchase: true,
      totalDue: true,
    },
  });

  const rows = (customers as any).map((c: any) => ({
    ...c,
    totalPaid: c.totalPurchase - c.totalDue,
  }));

  const totals = rows.reduce(
    (acc: any, r: any) => ({
      totalPurchase: acc.totalPurchase + r.totalPurchase,
      totalPaid: acc.totalPaid + r.totalPaid,
      totalDue: acc.totalDue + r.totalDue,
    }),
    { totalPurchase: 0, totalPaid: 0, totalDue: 0 },
  );

  return { rows, totals };
  } catch (error: any) {
    console.error('getCustomerDueReport error:', error);
    return { rows: [], totals: { totalPurchase: 0, totalPaid: 0, totalDue: 0 } };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// F) VENDOR DUE REPORT
// ─────────────────────────────────────────────────────────────────────────────
export async function getVendorDueReport() {
  try {
  const suppliers = await db.supplier.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      phone: true,
      purchases: { select: { totalAmount: true } },
      payments: { select: { amount: true } },
    },
    orderBy: { name: 'asc' },
  });

  const rows = (suppliers as any).map((s: any) => {
    const totalPurchase = s.purchases.reduce((a: number, p: any) => a + p.totalAmount, 0);
    const totalPaid = s.payments.reduce((a: number, p: any) => a + p.amount, 0);
    const due = Math.max(0, totalPurchase - totalPaid);
    return { id: s.id, name: s.name, phone: s.phone, totalPurchase, totalPaid, due };
  }).filter((r: any) => r.totalPurchase > 0);

  const totals = rows.reduce(
    (acc: any, r: any) => ({
      totalPurchase: acc.totalPurchase + r.totalPurchase,
      totalPaid: acc.totalPaid + r.totalPaid,
      due: acc.due + r.due,
    }),
    { totalPurchase: 0, totalPaid: 0, due: 0 },
  );

  return { rows, totals };
  } catch (error: any) {
    console.error('getVendorDueReport error:', error);
    return { rows: [], totals: { totalPurchase: 0, totalPaid: 0, due: 0 } };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// G) PROFIT & LOSS REPORT
// ─────────────────────────────────────────────────────────────────────────────
export async function getProfitLossReport(from?: string, to?: string) {
  try {
  const range = dateRange(from, to);

  const [salesAgg, itemsAgg, expensesAgg, returnsAgg] = await Promise.all([
    prisma.order.aggregate({
      _sum: { grandTotal: true },
      where: {
        status: { not: 'CANCELLED' },
        ...(range && { createdAt: range }),
      },
    }),
    prisma.orderItem.aggregate({
      _sum: { total: true },
      where: range ? { createdAt: range } : undefined,
    }),
    prisma.expense.aggregate({
      _sum: { amount: true },
      where: range ? { date: range } : undefined,
    }),
    prisma.return.aggregate({
      _sum: { refundAmount: true },
      where: range ? { createdAt: range } : undefined,
    }),
  ]);

  // Get product costs for items sold
  const soldItems = await prisma.orderItem.findMany({
    where: range ? { createdAt: range } : undefined,
    select: {
      quantity: true,
      product: { select: { costPrice: true } },
      variant: { select: { costPrice: true } },
    },
  });

  const productCost = soldItems.reduce((s, item) => {
    const cost = item.variant?.costPrice ?? item.product.costPrice ?? 0;
    return s + cost * item.quantity;
  }, 0);

  const totalSales = salesAgg._sum.grandTotal ?? 0;
  const totalReturns = returnsAgg._sum.refundAmount ?? 0;
  const netSales = totalSales - totalReturns;
  const grossProfit = netSales - productCost;
  const totalExpenses = expensesAgg._sum.amount ?? 0;
  const netProfit = grossProfit - totalExpenses;

  // Category-wise expenses breakdown
  const expenseByCategory = await prisma.expense.groupBy({
    by: ['categoryId'],
    _sum: { amount: true },
    where: range ? { date: range } : undefined,
  });

  const expenseCategories = await prisma.expenseCategory.findMany({
    where: { id: { in: expenseByCategory.map((e) => e.categoryId) } },
    select: { id: true, name: true },
  });

  const expenseBreakdown = expenseByCategory.map((e) => ({
    name: expenseCategories.find((c) => c.id === e.categoryId)?.name ?? e.categoryId,
    amount: e._sum.amount ?? 0,
  }));

  return {
    totalSales,
    totalReturns,
    netSales,
    productCost,
    grossProfit,
    totalExpenses,
    netProfit,
    expenseBreakdown,
  };
  } catch (error: any) {
    console.error('getProfitLossReport error:', error);
    return { totalSales: 0, totalReturns: 0, netSales: 0, productCost: 0, grossProfit: 0, totalExpenses: 0, netProfit: 0, expenseBreakdown: [] };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// H) PAYMENT REPORT
// ─────────────────────────────────────────────────────────────────────────────
export async function getPaymentReport(from?: string, to?: string) {
  try {
  const range = dateRange(from, to);

  const payments = await prisma.orderPayment.findMany({
    where: range ? { createdAt: range } : undefined,
    select: {
      id: true,
      method: true,
      amount: true,
      provider: true,
      createdAt: true,
      order: {
        select: {
          orderNumber: true,
          customerName: true,
          posCustomer: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const byMethod: Record<string, number> = {};
  for (const p of payments) {
    const m = p.method as string;
    byMethod[m] = (byMethod[m] ?? 0) + p.amount;
  }

  const total = payments.reduce((s, p) => s + p.amount, 0);
  const rows = payments.map((p) => ({
    ...p,
    customerName: p.order.posCustomer?.name ?? p.order.customerName ?? 'N/A',
    orderNumber: p.order.orderNumber,
  }));

  return { rows, total, byMethod };
  } catch (error: any) {
    console.error('getPaymentReport error:', error);
    return { rows: [], total: 0, byMethod: {} };
  }
}
