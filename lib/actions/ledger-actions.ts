'use server';

import { prisma } from '@/lib/prisma';

// -----------------------------------------------
// CUSTOMER LEDGER (Source of Truth)
// -----------------------------------------------

export async function getCustomerLedger(customerId: string) {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) return null;

    const ledgerEntries = await prisma.customerLedger.findMany({
      where: { customerId },
      orderBy: { date: 'asc' }, // Use ID as tie-breaker if same date
    });

    // Also get total orders count (approximate since we don't query orders explicitly here, 
    // but we can query it quickly)
    const totalOrders = await prisma.order.count({
      where: { customerId }
    });

    return {
      customer: {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        address: customer.address,
        totalPurchase: customer.totalPurchase,
        totalPaid: customer.totalPaid,
        totalDue: customer.totalDue,
        totalOrders,
      },
      ledger: ledgerEntries.map(l => ({
        date: l.date,
        type: l.type as 'Invoice' | 'Payment' | 'Refund' | 'Adjustment',
        reference: l.referenceId || '',
        description: l.note || '',
        debit: l.debit,
        credit: l.credit,
        balance: l.runningBalance,
      })),
    };
  } catch (error: any) {
    console.error('getCustomerLedger error:', error);
    return null;
  }
}

// -----------------------------------------------
// RECALCULATE CUSTOMER CACHE
// -----------------------------------------------

export async function recalculateCustomerCache(customerId: string) {
  // Recalculates Customer.balance, totalPurchase, totalPaid, totalDue directly from ledger
  const ledgers = await prisma.customerLedger.findMany({
    where: { customerId },
    orderBy: { date: 'asc' }
  });

  let totalPurchase = 0;
  let totalPaid = 0;
  let runningBalance = 0;
  let lastPurchaseDate = null;

  for (const entry of ledgers) {
    runningBalance += entry.debit;
    runningBalance -= entry.credit;

    if (entry.type === 'Invoice') {
      totalPurchase += entry.debit;
      lastPurchaseDate = entry.date;
    }
    if (entry.type === 'Payment') {
      totalPaid += entry.credit;
    }
  }

  // Update customer cache
  await prisma.customer.update({
    where: { id: customerId },
    data: {
      balance: runningBalance,
      totalPurchase,
      totalPaid,
      totalDue: runningBalance > 0 ? runningBalance : 0,
      lastPurchaseDate,
    }
  });

  return { success: true, balance: runningBalance };
}


// -----------------------------------------------
// ALL CUSTOMERS REPORT
// -----------------------------------------------

export async function getAllCustomersReport() {
  try {
    const customers = await prisma.customer.findMany({
      orderBy: { totalDue: 'desc' },
      include: {
        _count: { select: { orders: true } }
      }
    });

    return customers.map((c) => ({
      id: c.id,
      name: c.name,
      phone: c.phone,
      email: c.email,
      address: c.address,
      totalPurchase: c.totalPurchase,
      totalPaid: c.totalPaid,
      totalDue: c.totalDue,
      balance: c.balance,
      totalOrders: c._count.orders,
      createdAt: c.createdAt,
    }));
  } catch (error: any) {
    console.error('getAllCustomersReport error:', error);
    return [];
  }
}

// -----------------------------------------------
// PAYMENT HISTORY REPORT
// -----------------------------------------------

export type PaymentHistoryFilter = {
  startDate?: Date;
  endDate?: Date;
  customerId?: string;
  method?: string;
};

export async function getPaymentHistory(filter?: PaymentHistoryFilter) {
  try {
    const where: any = {};
    const cpWhere: any = {};

    if (filter?.startDate || filter?.endDate) {
      where.createdAt = {};
      cpWhere.createdAt = {};
      if (filter?.startDate) {
        where.createdAt.gte = filter.startDate;
        cpWhere.createdAt.gte = filter.startDate;
      }
      if (filter?.endDate) {
        where.createdAt.lte = filter.endDate;
        cpWhere.createdAt.lte = filter.endDate;
      }
    }

    if (filter?.method && filter.method !== 'ALL') {
      where.method = filter.method;
      cpWhere.paymentMethod = filter.method;
    }

    if (filter?.customerId && filter.customerId !== 'ALL') {
      where.order = { customerId: filter.customerId };
      cpWhere.customerId = filter.customerId;
    }

    // Fetch OrderPayments (initial payments at sale time)
    const orderPayments = await prisma.orderPayment.findMany({
      where,
      include: {
        order: {
          select: {
            orderNumber: true,
            customerName: true,
            Customer: { select: { id: true, name: true } },
            customerId: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Fetch CustomerPayments (due collections)
    const duePayments = await prisma.customerPayment.findMany({
      where: cpWhere,
      include: {
        customer: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: 'desc' },
    });

    type PaymentEntry = {
      id: string;
      date: Date;
      customerName: string;
      customerId: string | null;
      method: string;
      amount: number;
      invoiceNumber: string;
      type: 'Initial Payment' | 'Due Payment';
      note?: string | null;
    };

    const combined: PaymentEntry[] = [
      ...orderPayments.map((p) => ({
        id: p.id,
        date: p.createdAt,
        customerName: p.order.Customer?.name ?? p.order.customerName ?? 'Walk-in',
        customerId: p.order.customerId,
        method: p.method,
        amount: p.amount,
        invoiceNumber: p.order.orderNumber,
        type: 'Initial Payment' as const,
        note: p.note,
      })),
      ...duePayments.map((dp) => ({
        id: dp.id,
        date: dp.createdAt,
        customerName: dp.customer?.name ?? 'Unknown',
        customerId: dp.customerId,
        method: dp.paymentMethod,
        amount: dp.amount,
        invoiceNumber: dp.paymentNumber,
        type: 'Due Payment' as const,
        note: dp.reference,
      })),
    ];

    combined.sort((a, b) => b.date.getTime() - a.date.getTime());
    const totalAmount = combined.reduce((s, p) => s + p.amount, 0);

    return { payments: combined, totalAmount };
  } catch (error: any) {
    console.error('getPaymentHistory error:', error);
    return { payments: [], totalAmount: 0 };
  }
}

// -----------------------------------------------
// CUSTOMERS LIST FOR FILTER DROPDOWNS
// -----------------------------------------------

export async function getPOSCustomerList() {
  try {
    return await prisma.customer.findMany({
      select: { id: true, name: true, phone: true, balance: true, creditLimit: true },
      orderBy: { name: 'asc' },
    });
  } catch (error: any) {
    console.error('getPOSCustomerList error:', error);
    return [];
  }
}
