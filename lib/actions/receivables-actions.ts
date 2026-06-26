'use server';

import { prisma } from '@/lib/prisma';
import { differenceInDays } from 'date-fns';

export interface ReceivablesAgingBucket {
  customerId: string;
  customerName: string;
  totalReceivable: number;
  current: number;       // 0-30 days
  days31To60: number;    // 31-60 days
  days61To90: number;    // 61-90 days
  over90: number;        // 90+ days
}

export async function getReceivablesAging() {
  try {
    // A positive balance for a Customer means they owe us money
    const customers = await prisma.customer.findMany({
      where: { balance: { gt: 0 } },
      select: {
        id: true,
        name: true,
        balance: true,
        customerLedgers: {
          where: { type: 'SALE' },
          orderBy: { date: 'desc' },
          select: { debit: true, date: true } // SALE adds to debit (increases receivable)
        }
      }
    });

    const agingData: ReceivablesAgingBucket[] = [];
    const today = new Date();

    for (const cus of customers) {
      const bucket: ReceivablesAgingBucket = {
        customerId: cus.id,
        customerName: cus.name,
        totalReceivable: cus.balance,
        current: 0,
        days31To60: 0,
        days61To90: 0,
        over90: 0
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

      // If there's still balance left (e.g. from Opening Balance)
      if (remainingBalance > 0) {
        bucket.over90 += remainingBalance;
      }

      agingData.push(bucket);
    }

    return { success: true, data: agingData };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getReceivablesSummary() {
  try {
    const customers = await prisma.customer.findMany({
      orderBy: { balance: 'desc' },
      select: {
        id: true,
        name: true,
        phone: true,
        balance: true,
        customerGroup: true
      }
    });

    const summary = {
      totalReceivable: customers.filter(c => c.balance > 0).reduce((sum, c) => sum + c.balance, 0),
      totalAdvance: customers.filter(c => c.balance < 0).reduce((sum, c) => sum + Math.abs(c.balance), 0),
      customerCount: customers.length,
      customers
    };

    return { success: true, data: summary };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getCustomerStatement(customerId: string, fromDateStr?: string, toDateStr?: string) {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId }
    });

    if (!customer) throw new Error('Customer not found');

    const fromDate = fromDateStr ? new Date(fromDateStr) : new Date(0);
    const toDate = toDateStr ? new Date(toDateStr) : new Date();
    toDate.setHours(23, 59, 59, 999);

    const allLedgers = await prisma.customerLedger.findMany({
      where: { customerId },
      orderBy: { date: 'asc' }
    });

    let statementOpeningBalance = customer.openingBalance;

    for (const l of allLedgers) {
      if (l.date < fromDate) {
        statementOpeningBalance = l.runningBalance;
      }
    }

    const periodLedgers = allLedgers.filter(l => l.date >= fromDate && l.date <= toDate);
    
    return { 
      success: true, 
      data: {
        customer,
        openingBalance: statementOpeningBalance,
        lines: periodLedgers,
        closingBalance: periodLedgers.length > 0 ? periodLedgers[periodLedgers.length - 1].runningBalance : statementOpeningBalance,
        fromDate: fromDate.toISOString(),
        toDate: toDate.toISOString()
      } 
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// -----------------------------------------------
// OUTSTANDING INVOICES & DUE COLLECTION
// -----------------------------------------------

export async function getOutstandingInvoices(customerId: string) {
  try {
    const invoices = await prisma.order.findMany({
      where: {
        customerId,
        dueAmount: { gt: 0 },
        status: { notIn: ['CANCELLED', 'FAILED', 'RETURNED'] }
      },
      orderBy: { createdAt: 'asc' }, // FIFO allocation naturally
      select: {
        id: true,
        orderNumber: true,
        createdAt: true,
        grandTotal: true,
        paidAmount: true,
        dueAmount: true,
      }
    });
    return { success: true, data: invoices };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

import { PaymentMethod } from '@prisma/client';

export interface DueCollectionInput {
  customerId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  reference?: string;
  allocations: { orderId: string, amount: number }[];
  idempotencyKey?: string;
}

export async function processDueCollection(input: DueCollectionInput) {
  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Idempotency Check
      if (input.idempotencyKey) {
         const existing = await tx.customerPayment.findUnique({ where: { idempotencyKey: input.idempotencyKey }});
         if (existing) return existing;
      }

      // 2. Generate payment number
      const count = await tx.customerPayment.count();
      const paymentNumber = `PAY-${Date.now().toString().slice(-4)}-${count + 1}`;

      // 3. Insert CustomerPayment
      const payment = await tx.customerPayment.create({
        data: {
          paymentNumber,
          customerId: input.customerId,
          amount: input.amount,
          paymentMethod: input.paymentMethod,
          reference: input.reference,
          idempotencyKey: input.idempotencyKey,
        }
      });

      // 4. Process Allocations
      let unallocated = input.amount;
      for (const alloc of input.allocations) {
        if (alloc.amount <= 0) continue;
        if (unallocated < alloc.amount) throw new Error("Allocated more than payment amount.");

        unallocated -= alloc.amount;

        // Update Order
        const order = await tx.order.findUnique({ where: { id: alloc.orderId } });
        if (!order || !order.dueAmount || order.dueAmount < alloc.amount) {
           throw new Error(`Invalid allocation for invoice ${order?.orderNumber}`);
        }

        const newDue = order.dueAmount - alloc.amount;
        const newPaid = (order.paidAmount || 0) + alloc.amount;
        
        await tx.order.update({
          where: { id: alloc.orderId },
          data: {
             dueAmount: newDue,
             paidAmount: newPaid,
             paymentStatus: newDue <= 0 ? 'PAID' : 'PARTIALLY_PAID',
             posPaymentStatus: newDue <= 0 ? 'PAID' : 'PARTIAL'
          }
        });

        // Insert PaymentAllocation
        await tx.paymentAllocation.create({
           data: {
             paymentId: payment.id,
             orderId: alloc.orderId,
             amount: alloc.amount
           }
        });
      }

      // Update Unallocated balance
      if (unallocated > 0) {
         await tx.customerPayment.update({
            where: { id: payment.id },
            data: { unallocated }
         });
      }

      // 5. Update Customer Ledger (Credit)
      const customer = await tx.customer.findUnique({ where: { id: input.customerId }});
      if (!customer) throw new Error("Customer not found");

      let runningBalance = customer.balance;
      runningBalance -= input.amount;

      await tx.customerLedger.create({
         data: {
           customerId: input.customerId,
           type: 'Payment',
           debit: 0,
           credit: input.amount,
           runningBalance,
           referenceId: paymentNumber,
           note: `Due Collection via ${input.paymentMethod}${input.reference ? ` (${input.reference})` : ''}`
         }
      });

      // 6. Recalculate Cache inline
      const ledgers = await tx.customerLedger.findMany({ where: { customerId: input.customerId }, orderBy: { date: 'asc' } });
      let tp = 0; let tpaid = 0; let rb = 0; let lpd = null;
      for (const l of ledgers) {
        rb += l.debit - l.credit;
        if (l.type === 'Invoice') { tp += l.debit; lpd = l.date; }
        if (l.type === 'Payment') tpaid += l.credit;
      }
      await tx.customer.update({
        where: { id: input.customerId },
        data: { balance: rb, totalPurchase: tp, totalPaid: tpaid, totalDue: rb > 0 ? rb : 0, lastPurchaseDate: lpd }
      });

      return payment;
    }, { timeout: 30000 });

    return { success: true, paymentId: result.id, paymentNumber: result.paymentNumber };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
