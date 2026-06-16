'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// ─── Chart of Accounts ───

export async function getChartOfAccounts() {
  try {
    const accounts = await prisma.chartOfAccount.findMany({
      orderBy: [{ type: 'asc' }, { name: 'asc' }]
    });
    return { success: true, data: accounts };
  } catch (error: any) {
    console.error('Failed to get chart of accounts:', error);
    return { success: false, error: error.message };
  }
}

export async function createChartOfAccount(data: {
  code: string;
  name: string;
  type: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
}) {
  try {
    const existing = await prisma.chartOfAccount.findUnique({ where: { code: data.code } });
    if (existing) throw new Error(`Account code ${data.code} already exists`);

    const account = await prisma.chartOfAccount.create({ data });
    revalidatePath('/admin/accounting/chart-of-accounts');
    return { success: true, data: account };
  } catch (error: any) {
    console.error('Failed to create account:', error);
    return { success: false, error: error.message };
  }
}

// ─── Journal Entries ───

export async function getJournalEntries() {
  try {
    const entries = await prisma.journalEntry.findMany({
      include: {
        journalEntryItems: {
          include: { chartOfAccount: true }
        }
      },
      orderBy: { date: 'desc' }
    });
    return { success: true, data: entries };
  } catch (error: any) {
    console.error('Failed to get journal entries:', error);
    return { success: false, error: error.message };
  }
}

export async function createJournalEntry(data: {
  reference: string;
  date: Date;
  notes?: string;
  journalEntryItems: { accountId: string; debit: number; credit: number; description?: string }[];
}) {
  try {
    // 1. Validate Double-Entry logic
    const totalDebit = data.journalEntryItems.reduce((sum, item) => sum + item.debit, 0);
    const totalCredit = data.journalEntryItems.reduce((sum, item) => sum + item.credit, 0);

    // Using a small epsilon to handle floating point issues
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new Error(`Debits (৳${totalDebit}) must equal Credits (৳${totalCredit})`);
    }

    if (totalDebit <= 0) {
      throw new Error('Journal entry must have a value greater than 0');
    }

    // 2. Create the entry atomically
    const entry = await prisma.$transaction(async (tx) => {
      // Auto-generate entry number if none provided
      const count = await tx.journalEntry.count();
      const entryNumber = `JE-${new Date().getFullYear()}${(new Date().getMonth() + 1).toString().padStart(2, '0')}-${(count + 1).toString().padStart(4, '0')}`;

      const journal = await tx.journalEntry.create({
        data: {
          entryNumber,
          reference: data.reference,
          date: data.date,
          note: data.notes,
          journalEntryItems: {
            create: data.journalEntryItems.map(item => ({
              accountId: item.accountId,
              debit: item.debit,
              credit: item.credit,
              description: item.description
            }))
          }
        }
      });

      // Update ChartOfAccount balances
      for (const item of data.journalEntryItems) {
        if (item.debit > 0 || item.credit > 0) {
          const account = await tx.chartOfAccount.findUnique({ where: { id: item.accountId } });
          if (!account) throw new Error(`Account ${item.accountId} not found`);

          let balanceChange = 0;
          // Normal balance rules:
          // Assets & Expenses: Debit increases balance, Credit decreases.
          // Liabilities, Equity, Revenue: Credit increases balance, Debit decreases.
          if (account.type === 'ASSET' || account.type === 'EXPENSE') {
            balanceChange = item.debit - item.credit;
          } else {
            balanceChange = item.credit - item.debit;
          }

          await tx.chartOfAccount.update({
            where: { id: item.accountId },
            data: { balance: { increment: balanceChange } }
          });
        }
      }

      return journal;
    });

    revalidatePath('/admin/accounting/journals');
    revalidatePath('/admin/accounting/chart-of-accounts');
    return { success: true, data: entry };
  } catch (error: any) {
    console.error('Failed to create journal entry:', error);
    return { success: false, error: error.message };
  }
}
