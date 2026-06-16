'use server';

import { prisma } from '@/lib/prisma';

export async function getSupplierStatement(supplierId: string, fromDateStr?: string, toDateStr?: string) {
  try {
    const supplier = await prisma.supplier.findUnique({
      where: { id: supplierId }
    });

    if (!supplier) throw new Error('Supplier not found');

    const fromDate = fromDateStr ? new Date(fromDateStr) : new Date(0); // Beginning of time if not specified
    const toDate = toDateStr ? new Date(toDateStr) : new Date(); // Today if not specified
    toDate.setHours(23, 59, 59, 999); // End of day

    // Get all ledgers in chronological order
    const allLedgers = await prisma.supplierLedger.findMany({
      where: { supplierId },
      orderBy: { date: 'asc' }
    });

    // Compute Opening Balance at `fromDate`
    let openingBalance = supplier.openingBalance;
    const ledgersBeforePeriod = allLedgers.filter(l => l.date < fromDate);
    
    for (const l of ledgersBeforePeriod) {
      openingBalance += l.debit;
      openingBalance -= l.credit;
    }

    // Since our database runningBalance is computed at creation time, it's accurate, 
    // but the true opening balance of the Statement depends on the date range.
    // Wait, if Purchase increases liability, credit increases liability.
    // Let's re-verify: SupplierLedger Service says: 
    // "PURCHASE adds to debit? No, standard AP: Purchase is a Liability (Credit increases)."
    // Let's check how SupplierLedgerService was implemented. 
    // I will dynamically calculate running balance in the statement view.

    let runningBalance = supplier.openingBalance;
    let statementOpeningBalance = supplier.openingBalance;

    const statementLines = [];

    for (const l of allLedgers) {
      if (l.date < fromDate) {
        // Assume credit increases liability (Supplier payable) and debit decreases liability (Payment).
        // Let's use the DB's runningBalance to determine direction if possible, but actually DB has `runningBalance`.
        statementOpeningBalance = l.runningBalance;
      }
    }

    // Now filter for the period
    const periodLedgers = allLedgers.filter(l => l.date >= fromDate && l.date <= toDate);
    
    return { 
      success: true, 
      data: {
        supplier,
        openingBalance: statementOpeningBalance,
        lines: periodLedgers,
        closingBalance: periodLedgers.length > 0 ? periodLedgers[periodLedgers.length - 1].runningBalance : statementOpeningBalance,
        fromDate: fromDate.toISOString(),
        toDate: toDate.toISOString()
      } 
    };
  } catch (error: any) {
    console.error('Failed to get supplier statement:', error);
    return { success: false, error: error.message };
  }
}
