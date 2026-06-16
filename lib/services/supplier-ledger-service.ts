import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export type SupplierLedgerType = 'PURCHASE' | 'PAYMENT' | 'RETURN' | 'ADJUSTMENT' | 'OPENING_BALANCE';

export interface SupplierLedgerEntry {
  supplierId: string;
  type: SupplierLedgerType;
  debit: number;   // Decreases what we owe (e.g., Payment, Return)
  credit: number;  // Increases what we owe (e.g., Purchase)
  referenceId?: string;
  note?: string;
  date?: Date;
}

export class SupplierLedgerService {
  /**
   * Adds an entry to the supplier ledger and updates running balance atomically.
   * This MUST be called within an existing Prisma transaction to ensure consistency.
   */
  static async addEntry(tx: Omit<Prisma.TransactionClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">, entry: SupplierLedgerEntry) {
    // 1. Get current balance
    // The previous entry's running balance gives us the current balance.
    // If no entries exist, start from 0. The Opening Balance itself should be an entry.
    const lastEntry = await tx.supplierLedger.findFirst({
      where: { supplierId: entry.supplierId },
      orderBy: { date: 'desc' }
    });

    const currentBalance = lastEntry ? lastEntry.runningBalance : 0;
    
    // Balance = Current Balance + Credit (we owe more) - Debit (we owe less)
    const newBalance = currentBalance + (entry.credit || 0) - (entry.debit || 0);

    // 2. Create the ledger entry
    const ledger = await tx.supplierLedger.create({
      data: {
        supplierId: entry.supplierId,
        type: entry.type,
        debit: entry.debit || 0,
        credit: entry.credit || 0,
        runningBalance: newBalance,
        referenceId: entry.referenceId,
        note: entry.note,
        date: entry.date || new Date(),
      }
    });

    return ledger;
  }

  /**
   * Recalculates the entire ledger for a supplier.
   * Useful for auditing or if historical entries are modified.
   */
  static async rebuildLedger(supplierId: string) {
    const supplier = await prisma.supplier.findUnique({
      where: { id: supplierId }
    });

    if (!supplier) throw new Error('Supplier not found');

    return await prisma.$transaction(async (tx) => {
      // 1. Delete all existing ledgers for this supplier
      await tx.supplierLedger.deleteMany({
        where: { supplierId }
      });

      let runningBalance = 0;

      // 2. Re-insert Opening Balance
      if (supplier.openingBalance > 0) {
        runningBalance += supplier.openingBalance;
        await tx.supplierLedger.create({
          data: {
            supplierId,
            type: 'OPENING_BALANCE',
            debit: 0,
            credit: supplier.openingBalance,
            runningBalance: runningBalance,
            note: 'Initial Opening Balance'
          }
        });
      }

      // 3. Fetch all purchases (PO APPROVED/RECEIVED)
      const purchases = await tx.purchaseOrder.findMany({
        where: { supplierId, status: { in: ['APPROVED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CLOSED'] } },
        orderBy: { createdAt: 'asc' }
      });

      // 4. Fetch all payments
      const payments = await tx.supplierPayment.findMany({
        where: { supplierId },
        orderBy: { createdAt: 'asc' }
      });

      // 5. Fetch all returns
      const returns = await tx.purchaseReturn.findMany({
        where: { supplierId, status: { in: ['RETURNED', 'CLOSED'] } },
        orderBy: { createdAt: 'asc' }
      });

      // Sort all events chronologically
      const events = [
        ...purchases.map(p => ({ date: p.createdAt, type: 'PURCHASE' as const, data: p })),
        ...payments.map(p => ({ date: p.createdAt, type: 'PAYMENT' as const, data: p })),
        ...returns.map(r => ({ date: r.createdAt, type: 'RETURN' as const, data: r }))
      ].sort((a, b) => a.date.getTime() - b.date.getTime());

      // Insert ledgers sequentially
      for (const event of events) {
        if (event.type === 'PURCHASE') {
          const po = event.data as any;
          runningBalance += po.totalAmount;
          await tx.supplierLedger.create({
            data: {
              supplierId,
              type: 'PURCHASE',
              debit: 0,
              credit: po.totalAmount,
              runningBalance,
              referenceId: po.id,
              date: po.createdAt,
              note: `Purchase Order ${po.poNumber}`
            }
          });
        } else if (event.type === 'PAYMENT') {
          const pay = event.data as any;
          runningBalance -= pay.amount;
          await tx.supplierLedger.create({
            data: {
              supplierId,
              type: 'PAYMENT',
              debit: pay.amount,
              credit: 0,
              runningBalance,
              referenceId: pay.id,
              date: pay.createdAt,
              note: `Payment via ${pay.paymentMethod}`
            }
          });
        } else if (event.type === 'RETURN') {
          const ret = event.data as any;
          runningBalance -= ret.refundAmount; // assuming refund amount decreases payable
          await tx.supplierLedger.create({
            data: {
              supplierId,
              type: 'RETURN',
              debit: ret.refundAmount,
              credit: 0,
              runningBalance,
              referenceId: ret.id,
              date: ret.createdAt,
              note: `Purchase Return ${ret.returnNumber}`
            }
          });
        }
      }

      return runningBalance;
    });
  }

  static async getSupplierBalance(supplierId: string) {
    const lastEntry = await prisma.supplierLedger.findFirst({
      where: { supplierId },
      orderBy: { date: 'desc' }
    });
    return lastEntry ? lastEntry.runningBalance : 0;
  }
}
