'use server';

import { prisma } from '@/lib/prisma';

// -----------------------------------------------
// CUSTOMER LEDGER
// -----------------------------------------------

export async function getCustomerLedger(customerId: string) {
  try {
  const customer = await prisma.pOSCustomer.findUnique({
    where: { id: customerId },
    include: {
      orders: {
        where: { isPos: true },
        orderBy: { createdAt: 'asc' },
        include: {
          payments: true,
        },
      },
    },
  });

  if (!customer) return null;

  // Build ledger entries
  type LedgerEntry = {
    date: Date;
    type: 'Invoice' | 'Payment';
    reference: string;
    description: string;
    debit: number;   // amount charged (invoice)
    credit: number;  // amount paid
    balance: number; // running balance
  };

  const entries: LedgerEntry[] = [];
  let runningBalance = 0;

  for (const order of customer.orders) {
    // Invoice entry
    runningBalance += order.grandTotal;
    entries.push({
      date: order.createdAt,
      type: 'Invoice',
      reference: order.orderNumber,
      description: `Invoice #${order.orderNumber}`,
      debit: order.grandTotal,
      credit: 0,
      balance: runningBalance,
    });

    // Payment entries from OrderPayment table (initial payments at time of sale)
    for (const payment of order.payments) {
      runningBalance -= payment.amount;
      entries.push({
        date: payment.createdAt,
        type: 'Payment',
        reference: order.orderNumber,
        description: `Payment via ${payment.method.replace('_', ' ')}${payment.provider ? ` (${payment.provider})` : ''}`,
        debit: 0,
        credit: payment.amount,
        balance: runningBalance,
      });
    }
  }

  // Also include DuePayments (subsequent due collections)
  // Filter by orderId IN (orders belonging to this customer)
  const customerOrderIds = customer.orders.map((o) => o.id);
  // Build a map of orderId -> orderNumber for DuePayment lookup
  const orderNumberMap = Object.fromEntries(customer.orders.map((o) => [o.id, o.orderNumber]));

  const duePayments = await prisma.duePayment.findMany({
    where: { orderId: { in: customerOrderIds } },
    orderBy: { createdAt: 'asc' },
  });

  // Re-build full ledger with all events sorted by date
  type RawEvent =
    | { date: Date; type: 'Invoice'; orderNumber: string; grandTotal: number; initialPaid: number; payments: { createdAt: Date; amount: number; method: string; provider: string | null }[] }
    | { date: Date; type: 'DuePayment'; orderNumber: string; amount: number; note: string | null };

  const rawEvents: RawEvent[] = [];

  for (const order of customer.orders) {
    rawEvents.push({
      date: order.createdAt,
      type: 'Invoice',
      orderNumber: order.orderNumber,
      grandTotal: order.grandTotal,
      initialPaid: order.paidAmount ?? order.grandTotal,
      payments: order.payments.map((p) => ({
        createdAt: p.createdAt,
        amount: p.amount,
        method: p.method,
        provider: p.provider,
      })),
    });
  }

  for (const dp of duePayments) {
    rawEvents.push({
      date: dp.createdAt,
      type: 'DuePayment',
      orderNumber: orderNumberMap[dp.orderId] ?? dp.orderId,
      amount: dp.amount,
      note: dp.note,
    });
  }

  rawEvents.sort((a, b) => a.date.getTime() - b.date.getTime());

  const ledgerEntries: LedgerEntry[] = [];
  let balance = 0;

  for (const event of rawEvents) {
    if (event.type === 'Invoice') {
      balance += event.grandTotal;
      ledgerEntries.push({
        date: event.date,
        type: 'Invoice',
        reference: event.orderNumber,
        description: `Invoice #${event.orderNumber}`,
        debit: event.grandTotal,
        credit: 0,
        balance,
      });
      // Include initial payments linked to the order
      for (const p of event.payments) {
        balance -= p.amount;
        ledgerEntries.push({
          date: p.createdAt,
          type: 'Payment',
          reference: event.orderNumber,
          description: `Payment via ${p.method.replace('_', ' ')}${p.provider ? ` (${p.provider})` : ''}`,
          debit: 0,
          credit: p.amount,
          balance,
        });
      }
    } else {
      balance -= event.amount;
      ledgerEntries.push({
        date: event.date,
        type: 'Payment',
        reference: event.orderNumber,
        description: `Due Payment${event.note ? ` - ${event.note}` : ''}`,
        debit: 0,
        credit: event.amount,
        balance,
      });
    }
  }

  // Re-sort by date (payments on same invoice might be same date)
  ledgerEntries.sort((a, b) => a.date.getTime() - b.date.getTime());

  // Recalculate balances after sort
  let bal = 0;
  for (const e of ledgerEntries) {
    bal += e.debit - e.credit;
    e.balance = bal;
  }

  const totalPurchase = customer.orders.reduce((s, o) => s + o.grandTotal, 0);
  const totalDue = customer.totalDue;
  const totalPaid = totalPurchase - totalDue;

  return {
    customer: {
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      address: customer.address,
      totalPurchase,
      totalPaid,
      totalDue,
      totalOrders: customer.orders.length,
    },
    ledger: ledgerEntries,
  };
  } catch (error: any) {
    console.error('getCustomerLedger error:', error);
    return null;
  }
}

// -----------------------------------------------
// ALL CUSTOMERS REPORT
// -----------------------------------------------

export async function getAllCustomersReport() {
  try {
    const customers = await prisma.pOSCustomer.findMany({
      orderBy: { totalDue: 'desc' },
      include: {
        orders: {
          where: { isPos: true },
          select: {
            grandTotal: true,
            paidAmount: true,
            dueAmount: true,
            posPaymentStatus: true,
          },
        },
      },
    });

    return customers.map((c) => {
      const totalPurchase = c.orders.reduce((s, o) => s + o.grandTotal, 0);
      const totalDue = c.totalDue;
      const totalPaid = totalPurchase - totalDue;
      return {
        id: c.id,
        name: c.name,
        phone: c.phone,
        email: c.email,
        address: c.address,
        totalPurchase,
        totalPaid,
        totalDue,
        totalOrders: c.orders.length,
        createdAt: c.createdAt,
      };
    });
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
  const where: any = {
    order: { isPos: true },
  };

  if (filter?.startDate || filter?.endDate) {
    where.createdAt = {};
    if (filter?.startDate) where.createdAt.gte = filter.startDate;
    if (filter?.endDate) where.createdAt.lte = filter.endDate;
  }

  if (filter?.method && filter.method !== 'ALL') {
    where.method = filter.method;
  }

  if (filter?.customerId && filter.customerId !== 'ALL') {
    where.order = { ...where.order, posCustomerId: filter.customerId };
  }

  // Fetch OrderPayments (initial payments)
  const orderPayments = await prisma.orderPayment.findMany({
    where,
    include: {
      order: {
        select: {
          orderNumber: true,
          customerName: true,
          posCustomer: { select: { id: true, name: true } },
          posCustomerId: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Fetch DuePayments — filter via orderId subquery
  let dueOrderIds: string[] | undefined;
  if (filter?.customerId && filter.customerId !== 'ALL') {
    const custOrders = await prisma.order.findMany({
      where: { isPos: true, posCustomerId: filter.customerId },
      select: { id: true },
    });
    dueOrderIds = custOrders.map((o) => o.id);
  } else {
    const posOrders = await prisma.order.findMany({
      where: { isPos: true },
      select: { id: true },
    });
    dueOrderIds = posOrders.map((o) => o.id);
  }

  const dueWhere2: any = { orderId: { in: dueOrderIds } };
  if (filter?.startDate || filter?.endDate) {
    dueWhere2.createdAt = (where as any).createdAt;
  }

  const duePayments = await prisma.duePayment.findMany({
    where: dueWhere2,
    orderBy: { createdAt: 'desc' },
  });

  // Get order details for due payments (separate query since no relation defined)
  const dueOrderDetails = await prisma.order.findMany({
    where: { id: { in: dueOrderIds } },
    select: {
      id: true,
      orderNumber: true,
      customerName: true,
      posCustomerId: true,
      posCustomer: { select: { id: true, name: true } },
    },
  });
  const dueOrderMap = Object.fromEntries(dueOrderDetails.map((o) => [o.id, o]));

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
      customerName: p.order.posCustomer?.name ?? p.order.customerName ?? 'Walk-in',
      customerId: p.order.posCustomerId,
      method: p.method,
      amount: p.amount,
      invoiceNumber: p.order.orderNumber,
      type: 'Initial Payment' as const,
      note: p.note,
    })),
    ...duePayments
      .filter((dp) => {
        if (filter?.method && filter.method !== 'ALL') return false; // Due payments have no method filter
        return true;
      })
      .map((dp) => {
        const ord = dueOrderMap[dp.orderId];
        return {
          id: dp.id,
          date: dp.createdAt,
          customerName: ord?.posCustomer?.name ?? ord?.customerName ?? 'Walk-in',
          customerId: ord?.posCustomer?.id ?? null,
          method: 'Due Collection',
          amount: dp.amount,
          invoiceNumber: ord?.orderNumber ?? dp.orderId,
          type: 'Due Payment' as const,
          note: dp.note,
        };
      }),
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
    return await prisma.pOSCustomer.findMany({
      select: { id: true, name: true, phone: true },
      orderBy: { name: 'asc' },
    });
  } catch (error: any) {
    console.error('getPOSCustomerList error:', error);
    return [];
  }
}
