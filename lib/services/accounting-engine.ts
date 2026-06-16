import { Prisma } from '@prisma/client';

/**
 * AccountingEngine safely generates JournalEntries within an existing Prisma Transaction.
 * It resolves the standard Account IDs automatically based on their codes.
 */
export class AccountingEngine {
  
  // Cache the standard accounts so we don't look them up multiple times per transaction
  private static async getStandardAccounts(tx: Prisma.TransactionClient) {
    const accounts = await tx.chartOfAccount.findMany({
      where: {
        code: { in: ['1000', '1100', '1200', '2000', '4000', '5000', '6000'] }
      }
    });

    const map = new Map<string, string>();
    accounts.forEach(acc => map.set(acc.code, acc.id));

    // Throw if missing critical accounts (ensures system is initialized)
    const required = ['1000', '1100', '1200', '2000', '4000', '5000'];
    for (const req of required) {
      if (!map.has(req)) {
        throw new Error(`Critical System Account (Code: ${req}) is missing from Chart of Accounts. Please initialize accounts.`);
      }
    }

    return {
      CASH: map.get('1000')!,
      RECEIVABLES: map.get('1100')!,
      INVENTORY: map.get('1200')!,
      PAYABLES: map.get('2000')!,
      REVENUE: map.get('4000')!,
      COGS: map.get('5000')!,
      EXPENSE: map.get('6000') || map.get('1000')!, // Fallback expense if 6000 is missing
    };
  }

  private static async createEntry(tx: Prisma.TransactionClient, data: {
    reference: string;
    date?: Date;
    note?: string;
    journalEntryItems: { accountId: string; debit: number; credit: number; description?: string }[];
  }) {
    // Determine active period
    const now = data.date || new Date();
    const period = await tx.accountingPeriod.findFirst({
      where: {
        isClosed: false,
        startDate: { lte: now },
        endDate: { gte: now }
      }
    });

    // Auto-generate entry number
    const count = await tx.journalEntry.count();
    const entryNumber = `JE-${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}-${(count + 1).toString().padStart(4, '0')}`;

    // Filter out 0 value items
    const validItems = data.journalEntryItems.filter(i => i.debit > 0 || i.credit > 0);
    if (validItems.length === 0) return null;

    return tx.journalEntry.create({
      data: {
        entryNumber,
        reference: data.reference,
        date: now,
        note: data.note,
        accountingPeriodId: period?.id || null,
        journalEntryItems: {
          create: validItems
        }
      }
    });
  }

  /**
   * Posts a Journal Entry for a POS Sale or standard Sale.
   * - Debits Cash (for paid amount) and Receivables (for due amount)
   * - Credits Sales Revenue (total)
   * - Debits COGS (cost of inventory)
   * - Credits Inventory Asset (cost of inventory)
   */
  static async postSalesInvoice(tx: Prisma.TransactionClient, params: {
    orderNumber: string;
    revenue: number;
    cogs: number;
    paidAmount: number;
    dueAmount: number;
    date?: Date;
  }) {
    const acc = await this.getStandardAccounts(tx);

    const items = [];

    // 1. Revenue Side
    if (params.paidAmount > 0) items.push({ accountId: acc.CASH, debit: params.paidAmount, credit: 0, description: `Payment for Order ${params.orderNumber}` });
    if (params.dueAmount > 0) items.push({ accountId: acc.RECEIVABLES, debit: params.dueAmount, credit: 0, description: `Due for Order ${params.orderNumber}` });
    
    // Credit Revenue
    items.push({ accountId: acc.REVENUE, debit: 0, credit: params.revenue, description: `Revenue from Order ${params.orderNumber}` });

    // 2. Cost Side
    if (params.cogs > 0) {
      items.push({ accountId: acc.COGS, debit: params.cogs, credit: 0, description: `COGS for Order ${params.orderNumber}` });
      items.push({ accountId: acc.INVENTORY, debit: 0, credit: params.cogs, description: `Inventory deduction for Order ${params.orderNumber}` });
    }

    return this.createEntry(tx, {
      reference: params.orderNumber,
      date: params.date,
      note: 'POS / Sales Invoice',
      journalEntryItems: items
    });
  }

  /**
   * Posts a Journal Entry for a Goods Receive Note.
   * - Debits Inventory Asset
   * - Credits Accounts Payable
   */
  static async postGoodsReceipt(tx: Prisma.TransactionClient, params: {
    grnNumber: string;
    inventoryValue: number;
    date?: Date;
  }) {
    if (params.inventoryValue <= 0) return null;
    
    const acc = await this.getStandardAccounts(tx);

    return this.createEntry(tx, {
      reference: params.grnNumber,
      date: params.date,
      note: 'Goods Receipt Note',
      journalEntryItems: [
        { accountId: acc.INVENTORY, debit: params.inventoryValue, credit: 0, description: `Inventory received via ${params.grnNumber}` },
        { accountId: acc.PAYABLES, debit: 0, credit: params.inventoryValue, description: `Payable liability for ${params.grnNumber}` }
      ]
    });
  }

  /**
   * Posts a Journal Entry for an Expense.
   * - Debits Operating Expense
   * - Credits Cash
   */
  static async postExpense(tx: Prisma.TransactionClient, params: {
    expenseId: string;
    title: string;
    amount: number;
    date?: Date;
  }) {
    if (params.amount <= 0) return null;

    const acc = await this.getStandardAccounts(tx);

    return this.createEntry(tx, {
      reference: params.expenseId,
      date: params.date,
      note: `Expense: ${params.title}`,
      journalEntryItems: [
        { accountId: acc.EXPENSE, debit: params.amount, credit: 0, description: params.title },
        { accountId: acc.CASH, debit: 0, credit: params.amount, description: params.title }
      ]
    });
  }
}
