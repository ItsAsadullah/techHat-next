import { prisma } from '@/lib/prisma';
import { AccountType } from '@prisma/client';
import { ACCOUNT_CODES } from './constants';

export interface ReportItem {
  id: string;
  code: string;
  name: string;
  balance: number;
}

export interface IncomeStatement {
  revenue: ReportItem[];
  totalRevenue: number;
  cogs: ReportItem[];
  totalCogs: number;
  grossProfit: number;
  expenses: ReportItem[];
  totalExpenses: number;
  netIncome: number;
}

export interface BalanceSheet {
  assets: ReportItem[];
  totalAssets: number;
  liabilities: ReportItem[];
  totalLiabilities: number;
  equity: ReportItem[];
  totalEquity: number;
}

export async function getIncomeStatement(startDate?: Date, endDate?: Date): Promise<{ success: boolean; data?: IncomeStatement; error?: string }> {
  try {
    const whereClause: any = {};
    if (startDate || endDate) {
      whereClause.date = {};
      if (startDate) whereClause.date.gte = startDate;
      if (endDate) whereClause.date.lte = endDate;
    }

    // Get all accounts that are Revenue, COGS, Expense
    const accounts = await prisma.chartOfAccount.findMany({
      where: { type: { in: ['REVENUE', 'COGS', 'EXPENSE'] } },
      include: {
        journalEntryItems: {
          where: { journalEntry: whereClause },
          select: { debit: true, credit: true }
        }
      }
    });

    let totalRevenue = 0;
    let totalCogs = 0;
    let totalExpenses = 0;

    const revenue: ReportItem[] = [];
    const cogs: ReportItem[] = [];
    const expenses: ReportItem[] = [];

    accounts.forEach(acc => {
      let balance = 0;
      acc.journalEntryItems.forEach(item => {
        if (acc.type === 'REVENUE') {
          balance += (item.credit - item.debit);
        } else {
          // COGS or EXPENSE
          balance += (item.debit - item.credit);
        }
      });

      if (balance !== 0) {
        const reportItem = { id: acc.id, code: acc.code, name: acc.name, balance };
        if (acc.type === 'REVENUE') {
          revenue.push(reportItem);
          totalRevenue += balance;
        } else if (acc.type === 'COGS') {
          cogs.push(reportItem);
          totalCogs += balance;
        } else if (acc.type === 'EXPENSE') {
          expenses.push(reportItem);
          totalExpenses += balance;
        }
      }
    });

    revenue.sort((a, b) => b.balance - a.balance);
    cogs.sort((a, b) => b.balance - a.balance);
    expenses.sort((a, b) => b.balance - a.balance);

    const grossProfit = totalRevenue - totalCogs;
    const netIncome = grossProfit - totalExpenses;

    return {
      success: true,
      data: {
        revenue, totalRevenue,
        cogs, totalCogs,
        grossProfit,
        expenses, totalExpenses,
        netIncome
      }
    };
  } catch (error: any) {
    console.error('getIncomeStatement Error:', error);
    return { success: false, error: error.message };
  }
}

export async function getBalanceSheet(asOfDate?: Date): Promise<{ success: boolean; data?: BalanceSheet; error?: string }> {
  try {
    const whereClause: any = {};
    if (asOfDate) {
      whereClause.date = { lte: asOfDate };
    }

    const accounts = await prisma.chartOfAccount.findMany({
      where: { type: { in: ['ASSET', 'LIABILITY', 'EQUITY'] } },
      include: {
        journalEntryItems: {
          where: { journalEntry: whereClause },
          select: { debit: true, credit: true }
        }
      }
    });

    let totalAssets = 0;
    let totalLiabilities = 0;
    let totalEquity = 0;

    const assets: ReportItem[] = [];
    const liabilities: ReportItem[] = [];
    const equity: ReportItem[] = [];

    accounts.forEach(acc => {
      let balance = 0;
      acc.journalEntryItems.forEach(item => {
        if (acc.type === 'ASSET') {
          balance += (item.debit - item.credit);
        } else {
          // LIABILITY or EQUITY
          balance += (item.credit - item.debit);
        }
      });

      // Show zero balance accounts only if they are bank accounts or main cash
      if (balance !== 0 || acc.code === ACCOUNT_CODES.CASH_IN_HAND || acc.code === ACCOUNT_CODES.BANK_ACCOUNTS) {
        const reportItem = { id: acc.id, code: acc.code, name: acc.name, balance };
        if (acc.type === 'ASSET') {
          assets.push(reportItem);
          totalAssets += balance;
        } else if (acc.type === 'LIABILITY') {
          liabilities.push(reportItem);
          totalLiabilities += balance;
        } else if (acc.type === 'EQUITY') {
          equity.push(reportItem);
          totalEquity += balance;
        }
      }
    });

    // Add Net Income to Equity (Current Year Earnings)
    let netIncomeWhere: any = {};
    if (asOfDate) {
      netIncomeWhere.date = { lte: asOfDate };
    }
    
    // Simplification for the current retained earnings / net income calculation
    const isResponse = await getIncomeStatement(undefined, asOfDate);
    if (isResponse.success && isResponse.data) {
      const netIncome = isResponse.data.netIncome;
      if (netIncome !== 0) {
        equity.push({ id: 'current-earnings', code: '3999', name: 'Current Period Earnings', balance: netIncome });
        totalEquity += netIncome;
      }
    }

    assets.sort((a, b) => b.balance - a.balance);
    liabilities.sort((a, b) => b.balance - a.balance);
    equity.sort((a, b) => b.balance - a.balance);

    return {
      success: true,
      data: {
        assets, totalAssets,
        liabilities, totalLiabilities,
        equity, totalEquity
      }
    };
  } catch (error: any) {
    console.error('getBalanceSheet Error:', error);
    return { success: false, error: error.message };
  }
}
