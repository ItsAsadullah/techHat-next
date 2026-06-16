'use server';

import { prisma } from '@/lib/prisma';

export async function getTrialBalance(fiscalYearId?: string) {
  try {
    // Determine active fiscal year if not provided
    let fyId = fiscalYearId;
    if (!fyId) {
      const now = new Date();
      const activeFy = await prisma.fiscalYear.findFirst({ 
        where: { 
          isClosed: false,
          startDate: { lte: now },
          endDate: { gte: now }
        } 
      });
      if (activeFy) fyId = activeFy.id;
    }

    // Get all accounts
    const accounts = await prisma.chartOfAccount.findMany({
      orderBy: [
        { type: 'asc' },
        { code: 'asc' }
      ]
    });

    // We will aggregate all journal entry items per account.
    // In a real huge ERP, this would be a raw SQL SUM() grouped by accountId.
    const items = await prisma.journalEntryItem.findMany({
      where: fyId ? {
        journalEntry: {
          accountingPeriod: {
            fiscalYearId: fyId
          }
        }
      } : undefined,
      select: {
        accountId: true,
        debit: true,
        credit: true
      }
    });

    // Calculate balances
    let totalDebit = 0;
    let totalCredit = 0;
    
    const accountBalances = accounts.map(acc => {
      const accItems = items.filter(i => i.accountId === acc.id);
      const sumDebit = accItems.reduce((sum, i) => sum + i.debit, 0);
      const sumCredit = accItems.reduce((sum, i) => sum + i.credit, 0);

      // Normal balance depends on account type:
      // ASSET, EXPENSE, COGS: Debit is normal (Balance = Debit - Credit)
      // LIABILITY, EQUITY, INCOME: Credit is normal (Balance = Credit - Debit)
      let balance = 0;
      let balanceType = 'Debit';

      if (['ASSET', 'EXPENSE', 'COGS'].includes(acc.type)) {
        balance = sumDebit - sumCredit;
        if (balance < 0) {
          balanceType = 'Credit';
          balance = Math.abs(balance);
        } else {
          balanceType = 'Debit';
        }
      } else {
        balance = sumCredit - sumDebit;
        if (balance < 0) {
          balanceType = 'Debit';
          balance = Math.abs(balance);
        } else {
          balanceType = 'Credit';
        }
      }

      totalDebit += sumDebit;
      totalCredit += sumCredit;

      return {
        ...acc,
        sumDebit,
        sumCredit,
        netBalance: balance,
        balanceType
      };
    }).filter(acc => acc.sumDebit > 0 || acc.sumCredit > 0); // Only show active accounts in trial balance

    return { 
      success: true, 
      data: {
        accounts: accountBalances,
        totalDebit,
        totalCredit,
        isBalanced: Math.abs(totalDebit - totalCredit) < 0.01 // Floating point safe comparison
      }
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getGeneralLedger(accountId: string, fromDateStr?: string, toDateStr?: string) {
  try {
    const account = await prisma.chartOfAccount.findUnique({
      where: { id: accountId }
    });

    if (!account) throw new Error('Account not found');

    const fromDate = fromDateStr ? new Date(fromDateStr) : new Date(0);
    const toDate = toDateStr ? new Date(toDateStr) : new Date();
    toDate.setHours(23, 59, 59, 999);

    const items = await prisma.journalEntryItem.findMany({
      where: {
        accountId,
        journalEntry: {
          date: {
            gte: fromDate,
            lte: toDate
          }
        }
      },
      include: {
        journalEntry: true
      },
      orderBy: {
        journalEntry: {
          date: 'asc'
        }
      }
    });

    let runningBalance = 0;
    const isDebitNormal = ['ASSET', 'EXPENSE', 'COGS'].includes(account.type);

    const ledgerLines = items.map(item => {
      if (isDebitNormal) {
        runningBalance += (item.debit - item.credit);
      } else {
        runningBalance += (item.credit - item.debit);
      }

      return {
        id: item.id,
        date: item.journalEntry.date,
        journalNumber: item.journalEntry.entryNumber,
        referenceId: item.journalEntry.reference,
        description: item.description || item.journalEntry.note,
        debit: item.debit,
        credit: item.credit,
        runningBalance
      };
    });

    return { success: true, data: { account, lines: ledgerLines } };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
