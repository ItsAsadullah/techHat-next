'use server';

import { prisma } from '@/lib/prisma';
import { SupplierLedgerService } from '../services/supplier-ledger-service';

export interface SupplierLedgerEntry {
  id: string;
  date: Date;
  type: string;
  referenceNo: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
}

export async function getSupplierLedger(supplierId: string) {
  try {
    const supplier = await prisma.supplier.findUnique({
      where: { id: supplierId },
      select: { openingBalance: true, createdAt: true }
    });

    if (!supplier) throw new Error('Supplier not found');

    // Fetch the canonical ledger entries from DB
    const dbLedgers = await prisma.supplierLedger.findMany({
      where: { supplierId },
      orderBy: { date: 'desc' }, // Latest first for UI
    });

    const currentPayable = await SupplierLedgerService.getSupplierBalance(supplierId);

    const ledger: SupplierLedgerEntry[] = dbLedgers.map(l => ({
      id: l.id,
      date: l.date,
      type: l.type,
      referenceNo: l.referenceId || '-',
      description: l.note || l.type,
      debit: l.debit,
      credit: l.credit,
      balance: l.runningBalance,
    }));

    return { success: true, data: { ledger, currentPayable } };
  } catch (error: any) {
    console.error('Failed to get supplier ledger:', error);
    return { success: false, error: error.message };
  }
}
