'use server';

import { prisma } from '@/lib/prisma';
import { differenceInDays } from 'date-fns';

export interface AgingBucket {
  supplierId: string;
  supplierName: string;
  totalPayable: number;
  current: number;       // 0-30 days
  days31To60: number;    // 31-60 days
  days61To90: number;    // 61-90 days
  over90: number;        // 90+ days
}

export async function getPayablesAging() {
  try {
    const allSuppliers = await prisma.supplier.findMany({
      include: {
        supplierLedgers: {
          orderBy: { date: 'desc' },
          take: 1
        },
        purchaseOrders: {
          // Getting purchase details for aging
          select: { id: true } // We might need to rethink if purchases are tracked here or ledgers
        }
      }
    });

    // Instead of querying by balance, we compute it
    const suppliers = allSuppliers.map(s => {
      const balance = s.supplierLedgers.length > 0 ? s.supplierLedgers[0].runningBalance : s.openingBalance;
      return { ...s, balance };
    }).filter(s => s.balance > 0);

    // We also need all PURCHASE ledgers for the aging loop
    const supplierPurchaseLedgers = await prisma.supplierLedger.findMany({
      where: {
        supplierId: { in: suppliers.map(s => s.id) },
        type: 'PURCHASE'
      },
      orderBy: { date: 'desc' },
      select: { supplierId: true, credit: true, date: true }
    });

    const agingData: AgingBucket[] = [];
    const today = new Date();

    for (const sup of suppliers) {
      const bucket: AgingBucket = {
        supplierId: sup.id,
        supplierName: sup.name,
        totalPayable: sup.balance,
        current: 0,
        days31To60: 0,
        days61To90: 0,
        over90: 0
      };

      let remainingBalance = sup.balance;
      const purchases = supplierPurchaseLedgers.filter(l => l.supplierId === sup.id);

      for (const purchase of purchases) {
        if (remainingBalance <= 0) break;

        // purchase.credit is the liability added by this purchase
        if (purchase.credit <= 0) continue;

        const allocatedDebt = Math.min(remainingBalance, purchase.credit);
        const age = differenceInDays(today, purchase.date);

        if (age <= 30) bucket.current += allocatedDebt;
        else if (age <= 60) bucket.days31To60 += allocatedDebt;
        else if (age <= 90) bucket.days61To90 += allocatedDebt;
        else bucket.over90 += allocatedDebt;

        remainingBalance -= allocatedDebt;
      }

      // If there's still balance left (e.g. from Opening Balance or unrecorded invoices)
      if (remainingBalance > 0) {
        bucket.over90 += remainingBalance;
      }

      agingData.push(bucket);
    }

    return { success: true, data: agingData };
  } catch (error: any) {
    console.error('Failed to get aging report:', error);
    return { success: false, error: error.message };
  }
}

export async function getPayablesSummary() {
  try {
    const allSuppliers = await prisma.supplier.findMany({
      select: {
        id: true,
        name: true,
        phone: true,
        openingBalance: true,
        supplierLedgers: {
          orderBy: { date: 'desc' },
          take: 1,
          select: { runningBalance: true }
        }
      }
    });

    const suppliers = allSuppliers.map(s => {
      const balance = s.supplierLedgers.length > 0 ? s.supplierLedgers[0].runningBalance : s.openingBalance;
      return {
        id: s.id,
        name: s.name,
        phone: s.phone,
        balance
      };
    }).sort((a, b) => b.balance - a.balance);

    const summary = {
      totalPayable: suppliers.filter(s => s.balance > 0).reduce((sum, s) => sum + s.balance, 0),
      totalAdvance: suppliers.filter(s => s.balance < 0).reduce((sum, s) => sum + Math.abs(s.balance), 0),
      supplierCount: suppliers.length,
      suppliers
    };

    return { success: true, data: summary };
  } catch (error: any) {
    console.error('Failed to get payables summary:', error);
    return { success: false, error: error.message };
  }
}
