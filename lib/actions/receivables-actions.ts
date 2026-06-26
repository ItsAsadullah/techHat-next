'use server';

import { prisma } from '@/lib/prisma';
import { differenceInDays, format } from 'date-fns';
import { PaymentMethod } from '@prisma/client';

// ─────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────

export interface ReceivablesAgingBucket {
  customerId: string;
  customerName: string;
  phone: string | null;
  creditRating: string | null;
  totalReceivable: number;
  current: number;
  days31To60: number;
  days61To90: number;
  over90: number;
}

export interface DueCollectionInput {
  customerId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  reference?: string;
  remarks?: string;
  collector?: string;
  collectionDate?: string;
  allocations: { orderId: string; amount: number }[];
  idempotencyKey?: string;
  // Mixed payment breakdown
  cashAmount?: number;
  bkashAmount?: number;
  nagadAmount?: number;
  rocketAmount?: number;
  cardAmount?: number;
  bankAmount?: number;
  chequeAmount?: number;
}

// ─────────────────────────────────────────────────────────
// DASHBOARD KPIs
// ─────────────────────────────────────────────────────────

export async function getReceivablesDashboard() {
  try {
    const today = new Date();
    const todayStart = new Date(today.setHours(0, 0, 0, 0));
    const todayEnd = new Date(new Date().setHours(23, 59, 59, 999));

    const [totalReceivable, todayCollections, overdueCustomers, nearLimitCustomers, recentPayments] =
      await Promise.all([
        // Total receivable (customers with positive balance)
        prisma.customer.aggregate({
          where: { balance: { gt: 0 } },
          _sum: { balance: true },
          _count: true,
        }),

        // Today's collections
        prisma.customerPayment.aggregate({
          where: { paymentDate: { gte: todayStart, lte: todayEnd } },
          _sum: { amount: true },
          _count: true,
        }),

        // Overdue customers (balance > 0 and last purchase > 30 days)
        prisma.customer.count({
          where: {
            balance: { gt: 0 },
            lastPurchaseDate: { lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
          },
        }),

        // Near credit limit customers (balance > 80% of credit limit)
        prisma.customer.findMany({
          where: { creditLimit: { gt: 0 }, balance: { gt: 0 } },
          select: { id: true, name: true, balance: true, creditLimit: true },
        }),

        // Recent 10 payments
        prisma.customerPayment.findMany({
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: { customer: { select: { name: true, phone: true } } },
        }),
      ]);

    const nearLimit = nearLimitCustomers.filter(
      (c) => c.creditLimit > 0 && c.balance / c.creditLimit >= 0.8
    );

    return {
      success: true,
      data: {
        totalReceivable: totalReceivable._sum.balance || 0,
        totalCustomersWithDue: totalReceivable._count,
        todayCollection: todayCollections._sum.amount || 0,
        todayCollectionCount: todayCollections._count,
        overdueCustomers,
        nearLimitCount: nearLimit.length,
        recentPayments,
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ─────────────────────────────────────────────────────────
// CUSTOMER FULL PROFILE
// ─────────────────────────────────────────────────────────

export async function getCustomerFullProfile(customerId: string) {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });
    if (!customer) throw new Error('Customer not found');

    const [outstandingOrders, recentPayments, recentLedger] = await Promise.all([
      // Outstanding invoices with aging
      prisma.order.findMany({
        where: {
          customerId,
          dueAmount: { gt: 0 },
          status: { notIn: ['CANCELLED', 'FAILED', 'RETURNED'] },
        },
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          orderNumber: true,
          createdAt: true,
          grandTotal: true,
          paidAmount: true,
          dueAmount: true,
          guarantor: true,
        },
      }),

      // Last 10 payments
      prisma.customerPayment.findMany({
        where: { customerId },
        orderBy: { paymentDate: 'desc' },
        take: 10,
        include: {
          allocations: {
            include: {
              order: { select: { orderNumber: true } },
            },
          },
        },
      }),

      // Last 20 ledger entries
      prisma.customerLedger.findMany({
        where: { customerId },
        orderBy: { date: 'desc' },
        take: 20,
      }),
    ]);

    const orderNumbers = recentLedger
      .map(l => l.referenceId)
      .filter(id => id !== null && id !== undefined) as string[];

    const matchedOrders = await prisma.order.findMany({
      where: { orderNumber: { in: orderNumbers } },
      select: { id: true, orderNumber: true },
    });

    const orderMap = new Map(matchedOrders.map(o => [o.orderNumber, o.id]));

    const enrichedLedger = recentLedger.map(l => ({
      ...l,
      orderId: l.referenceId ? orderMap.get(l.referenceId) : null,
    }));

    // Calculate aging for outstanding invoices
    const today = new Date();
    const invoicesWithAging = outstandingOrders.map((inv) => ({
      ...inv,
      ageDays: differenceInDays(today, inv.createdAt),
      ageBucket:
        differenceInDays(today, inv.createdAt) <= 30
          ? 'current'
          : differenceInDays(today, inv.createdAt) <= 60
          ? '31-60'
          : differenceInDays(today, inv.createdAt) <= 90
          ? '61-90'
          : 'over90',
    }));

    // Credit warning suggestion
    const creditWarning = getCreditWarning(customer);

    return {
      success: true,
      data: {
        customer,
        outstandingInvoices: invoicesWithAging,
        recentPayments,
        recentLedger: enrichedLedger,
        creditWarning,
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

function getCreditWarning(customer: any): string | null {
  if (!customer) return null;
  if (customer.balance <= 0) return null;
  const score = customer.creditScore ?? 100;
  const rating = customer.creditRating ?? 'GOOD';
  if (rating === 'BLOCKED') return `⛔ এই কাস্টমার ক্রেডিট ব্লক। পূর্বের বাকি: ৳${customer.balance.toLocaleString()}`;
  if (rating === 'RISKY') return `⚠️ ঝুঁকিপূর্ণ কাস্টমার। বাকি: ৳${customer.balance.toLocaleString()}, স্কোর: ${score}`;
  if (customer.creditLimit > 0 && customer.balance >= customer.creditLimit)
    return `🔴 ক্রেডিট লিমিট পার হয়েছে। বাকি: ৳${customer.balance.toLocaleString()} / লিমিট: ৳${customer.creditLimit.toLocaleString()}`;
  if (customer.balance > 0)
    return `ℹ️ পূর্বের বাকি আছে: ৳${customer.balance.toLocaleString()}। বিক্রি করা যাবে।`;
  return null;
}

// ─────────────────────────────────────────────────────────
// OUTSTANDING INVOICES WITH AGING
// ─────────────────────────────────────────────────────────

export async function getOutstandingInvoices(customerId: string) {
  try {
    const today = new Date();
    const invoices = await prisma.order.findMany({
      where: {
        customerId,
        dueAmount: { gt: 0 },
        status: { notIn: ['CANCELLED', 'FAILED', 'RETURNED'] },
      },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        orderNumber: true,
        createdAt: true,
        grandTotal: true,
        paidAmount: true,
        dueAmount: true,
        guarantor: { select: { name: true, phone: true } },
      },
    });

    const mapped = invoices.map((inv) => ({
      ...inv,
      ageDays: differenceInDays(today, inv.createdAt),
    }));

    return { success: true, data: mapped };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ─────────────────────────────────────────────────────────
// RECEIVABLES AGING REPORT
// ─────────────────────────────────────────────────────────

export async function getReceivablesAging() {
  try {
    const customers = await prisma.customer.findMany({
      where: { balance: { gt: 0 } },
      select: {
        id: true,
        name: true,
        phone: true,
        balance: true,
        creditRating: true,
        customerLedgers: {
          where: { type: 'SALE' },
          orderBy: { date: 'desc' },
          select: { debit: true, date: true },
        },
      },
    });

    const agingData: ReceivablesAgingBucket[] = [];
    const today = new Date();

    for (const cus of customers) {
      const bucket: ReceivablesAgingBucket = {
        customerId: cus.id,
        customerName: cus.name,
        phone: cus.phone,
        creditRating: cus.creditRating,
        totalReceivable: cus.balance,
        current: 0,
        days31To60: 0,
        days61To90: 0,
        over90: 0,
      };

      let remainingBalance = cus.balance;

      for (const sale of cus.customerLedgers) {
        if (remainingBalance <= 0) break;
        if (sale.debit <= 0) continue;
        const allocatedDebt = Math.min(remainingBalance, sale.debit);
        const age = differenceInDays(today, sale.date);
        if (age <= 30) bucket.current += allocatedDebt;
        else if (age <= 60) bucket.days31To60 += allocatedDebt;
        else if (age <= 90) bucket.days61To90 += allocatedDebt;
        else bucket.over90 += allocatedDebt;
        remainingBalance -= allocatedDebt;
      }

      if (remainingBalance > 0) bucket.over90 += remainingBalance;
      agingData.push(bucket);
    }

    return { success: true, data: agingData };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ─────────────────────────────────────────────────────────
// RECEIVABLES SUMMARY
// ─────────────────────────────────────────────────────────

export async function getReceivablesSummary() {
  try {
    const customers = await prisma.customer.findMany({
      orderBy: { balance: 'desc' },
      select: {
        id: true,
        name: true,
        phone: true,
        balance: true,
        creditLimit: true,
        creditScore: true,
        creditRating: true,
        customerGroup: true,
        lastPurchaseDate: true,
        lastPaymentDate: true,
      },
    });

    const summary = {
      totalReceivable: customers.filter((c) => c.balance > 0).reduce((s, c) => s + c.balance, 0),
      totalAdvance: customers.filter((c) => c.balance < 0).reduce((s, c) => s + Math.abs(c.balance), 0),
      customerCount: customers.length,
      customers,
    };

    return { success: true, data: summary };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ─────────────────────────────────────────────────────────
// CUSTOMER STATEMENT
// ─────────────────────────────────────────────────────────

export async function getCustomerStatement(
  customerId: string,
  fromDateStr?: string,
  toDateStr?: string
) {
  try {
    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) throw new Error('Customer not found');

    const fromDate = fromDateStr ? new Date(fromDateStr) : new Date(0);
    const toDate = toDateStr ? new Date(toDateStr) : new Date();
    toDate.setHours(23, 59, 59, 999);

    const allLedgers = await prisma.customerLedger.findMany({
      where: { customerId },
      orderBy: { date: 'asc' },
    });

    let statementOpeningBalance = customer.openingBalance;
    for (const l of allLedgers) {
      if (l.date < fromDate) statementOpeningBalance = l.runningBalance;
    }

    const periodLedgers = allLedgers.filter((l) => l.date >= fromDate && l.date <= toDate);
    const closingBalance =
      periodLedgers.length > 0
        ? periodLedgers[periodLedgers.length - 1].runningBalance
        : statementOpeningBalance;

    return {
      success: true,
      data: {
        customer,
        openingBalance: statementOpeningBalance,
        lines: periodLedgers,
        closingBalance,
        fromDate: fromDate.toISOString(),
        toDate: toDate.toISOString(),
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ─────────────────────────────────────────────────────────
// PROCESS DUE COLLECTION
// ─────────────────────────────────────────────────────────

export async function processDueCollection(input: DueCollectionInput) {
  try {
    const result = await prisma.$transaction(
      async (tx) => {
        // 1. Idempotency Check
        if (input.idempotencyKey) {
          const existing = await tx.customerPayment.findUnique({
            where: { idempotencyKey: input.idempotencyKey },
          });
          if (existing) return existing;
        }

        // 2. Generate payment & receipt numbers
        const count = await tx.customerPayment.count();
        const year = new Date().getFullYear();
        const paymentNumber = `PAY-${Date.now().toString().slice(-4)}-${count + 1}`;
        const receiptNumber = `RCPT-${year}-${String(count + 1).padStart(6, '0')}`;

        // 3. Insert CustomerPayment
        const payment = await tx.customerPayment.create({
          data: {
            paymentNumber,
            receiptNumber,
            customerId: input.customerId,
            amount: input.amount,
            paymentMethod: input.paymentMethod,
            reference: input.reference,
            remarks: input.remarks,
            collector: input.collector,
            collectionDate: input.collectionDate ? new Date(input.collectionDate) : new Date(),
            idempotencyKey: input.idempotencyKey,
            cashAmount: input.cashAmount || 0,
            bkashAmount: input.bkashAmount || 0,
            nagadAmount: input.nagadAmount || 0,
            rocketAmount: input.rocketAmount || 0,
            cardAmount: input.cardAmount || 0,
            bankAmount: input.bankAmount || 0,
            chequeAmount: input.chequeAmount || 0,
          },
        });

        // 4. Process Allocations (FIFO)
        let unallocated = input.amount;
        for (const alloc of input.allocations) {
          if (alloc.amount <= 0) continue;
          if (unallocated < alloc.amount) throw new Error('Allocated more than payment amount.');
          unallocated -= alloc.amount;

          const order = await tx.order.findUnique({ where: { id: alloc.orderId } });
          if (!order || !order.dueAmount || order.dueAmount < alloc.amount - 0.01) {
            throw new Error(`Invalid allocation for invoice ${order?.orderNumber}`);
          }

          const newDue = Math.max(0, order.dueAmount - alloc.amount);
          const newPaid = (order.paidAmount || 0) + alloc.amount;

          await tx.order.update({
            where: { id: alloc.orderId },
            data: {
              dueAmount: newDue,
              paidAmount: newPaid,
              paymentStatus: newDue <= 0 ? 'PAID' : 'PARTIALLY_PAID',
              posPaymentStatus: newDue <= 0 ? 'PAID' : 'PARTIAL',
            },
          });

          await tx.paymentAllocation.create({
            data: { paymentId: payment.id, orderId: alloc.orderId, amount: alloc.amount },
          });
        }

        // Update unallocated (advance)
        if (unallocated > 0.01) {
          await tx.customerPayment.update({
            where: { id: payment.id },
            data: { unallocated },
          });
        }

        // 5. Update Customer Ledger
        const customer = await tx.customer.findUnique({ where: { id: input.customerId } });
        if (!customer) throw new Error('Customer not found');

        const runningBalance = customer.balance - input.amount;

        await tx.customerLedger.create({
          data: {
            customerId: input.customerId,
            type: 'Payment',
            debit: 0,
            credit: input.amount,
            runningBalance,
            referenceId: receiptNumber,
            note: `Due Collection — ${input.paymentMethod}${input.reference ? ` (${input.reference})` : ''}${input.remarks ? ` | ${input.remarks}` : ''}`,
          },
        });

        // If advance: record in ledger
        if (unallocated > 0.01) {
          await tx.customerLedger.create({
            data: {
              customerId: input.customerId,
              type: 'ADVANCE',
              debit: 0,
              credit: 0,
              runningBalance,
              referenceId: receiptNumber,
              note: `Advance/Unallocated Credit: ৳${unallocated.toFixed(2)}`,
            },
          });
        }

        // 6. Recalculate Customer cache
        const ledgers = await tx.customerLedger.findMany({
          where: { customerId: input.customerId },
          orderBy: { date: 'asc' },
        });
        let tp = 0; let tpaid = 0; let rb = 0; let lpd: Date | null = null;
        for (const l of ledgers) {
          rb += l.debit - l.credit;
          if (l.type === 'Invoice' || l.type === 'SALE') { tp += l.debit; lpd = l.date; }
          if (l.type === 'Payment') tpaid += l.credit;
        }

        // 7. Calculate credit score
        const payments = await tx.customerPayment.findMany({
          where: { customerId: input.customerId },
          orderBy: { paymentDate: 'desc' },
          take: 20,
        });
        const lateCount = payments.filter((p) => p.unallocated === 0).length;
        const totalCount = payments.length;
        const newScore = totalCount === 0 ? 100 : Math.min(100, Math.round((lateCount / totalCount) * 100 + 30));
        const newRating =
          newScore >= 90 ? 'EXCELLENT' : newScore >= 70 ? 'GOOD' : newScore >= 50 ? 'AVERAGE' : newScore >= 30 ? 'RISKY' : 'BLOCKED';

        await tx.customer.update({
          where: { id: input.customerId },
          data: {
            balance: rb,
            totalPurchase: tp,
            totalPaid: tpaid,
            totalDue: rb > 0 ? rb : 0,
            lastPurchaseDate: lpd,
            lastPaymentDate: new Date(),
            creditScore: newScore,
            creditRating: newRating,
          },
        });

        return { ...payment, receiptNumber };
      },
      { timeout: 30000 }
    );

    // Send Telegram notification (non-blocking)
    sendPaymentTelegramNotification(result, input).catch(() => {});

    return {
      success: true,
      paymentId: result.id,
      paymentNumber: result.paymentNumber,
      receiptNumber: result.receiptNumber,
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ─────────────────────────────────────────────────────────
// TELEGRAM NOTIFICATION
// ─────────────────────────────────────────────────────────

async function sendPaymentTelegramNotification(payment: any, input: DueCollectionInput) {
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    if (!botToken || !chatId) return;

    const customer = await prisma.customer.findUnique({
      where: { id: input.customerId },
      select: { name: true, phone: true },
    });

    const methodLabel: Record<string, string> = {
      CASH: '💵 Cash', CARD: '💳 Card', MOBILE_BANKING: '📱 Mobile Banking',
      ONLINE: '🌐 Online', MIXED: '🔀 Mixed',
    };

    const text =
      `✅ *Payment Received*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `🧾 Receipt: \`${payment.receiptNumber}\`\n` +
      `👤 Customer: *${customer?.name}* (${customer?.phone || 'N/A'})\n` +
      `💰 Amount: *৳${input.amount.toLocaleString()}*\n` +
      `💳 Method: ${methodLabel[input.paymentMethod] || input.paymentMethod}\n` +
      `${input.reference ? `🔗 Ref: \`${input.reference}\`\n` : ''}` +
      `${input.remarks ? `📝 ${input.remarks}\n` : ''}` +
      `📅 Date: ${format(new Date(), 'dd MMM yyyy, hh:mm a')}\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `_TechHat ERP_`;

    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' }),
    });
  } catch (e) {
    // Silent fail — notification is non-critical
  }
}

// ─────────────────────────────────────────────────────────
// CUSTOMER PAYMENT HISTORY
// ─────────────────────────────────────────────────────────

export async function getCustomerPaymentHistory(
  customerId: string,
  page = 1,
  limit = 20
) {
  try {
    const [payments, total] = await Promise.all([
      prisma.customerPayment.findMany({
        where: { customerId },
        orderBy: { paymentDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          allocations: {
            include: { order: { select: { orderNumber: true, grandTotal: true } } },
          },
        },
      }),
      prisma.customerPayment.count({ where: { customerId } }),
    ]);
    return { success: true, data: payments, total, page, limit };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
