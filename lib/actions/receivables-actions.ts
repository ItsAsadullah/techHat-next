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
        ledgers: {
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

      for (const sale of cus.ledgers) {
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
