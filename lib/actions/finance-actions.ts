'use server';

import { prisma } from '@/lib/prisma';
import { startOfMonth, endOfMonth, subMonths, format, startOfWeek, endOfWeek, subDays, startOfYear, endOfYear, subWeeks } from 'date-fns';
import { ACCOUNT_CODES } from '@/lib/accounting/constants';

// -------------------------------------------------------------
// DASHBOARD OVERVIEW METRICS
// -------------------------------------------------------------
export async function getFinanceDashboardData() {
  try {
    const today = new Date();
    const startOfThisMonth = startOfMonth(today);
    const endOfThisMonth = endOfMonth(today);

    // Get Account IDs
    const [salesAcc, cogsAcc, arAcc, apAcc, investorAcc] = await Promise.all([
      prisma.chartOfAccount.findUnique({ where: { code: ACCOUNT_CODES.SALES_REVENUE } }),
      prisma.chartOfAccount.findUnique({ where: { code: ACCOUNT_CODES.COGS } }),
      prisma.chartOfAccount.findUnique({ where: { code: ACCOUNT_CODES.ACCOUNTS_RECEIVABLE } }),
      prisma.chartOfAccount.findUnique({ where: { code: ACCOUNT_CODES.ACCOUNTS_PAYABLE } }),
      prisma.chartOfAccount.findUnique({ where: { code: ACCOUNT_CODES.INVESTOR_LOAN } })
    ]);

    // Calculate Total Revenue (This Month)
    const revenueEntries = salesAcc ? await prisma.journalEntryItem.aggregate({
      where: {
        accountId: salesAcc.id,
        journalEntry: { date: { gte: startOfThisMonth, lte: endOfThisMonth } }
      },
      _sum: { credit: true, debit: true }
    }) : { _sum: { credit: 0, debit: 0 } };
    const totalRevenue = (revenueEntries._sum.credit || 0) - (revenueEntries._sum.debit || 0);

    // Calculate Total Expenses (This Month)
    const expenseAccounts = await prisma.chartOfAccount.findMany({
      where: {
        OR: [
          { code: { startsWith: '5' } }, // COGS
          { code: { startsWith: '6' } }, // Operating Expenses
        ]
      }
    });
    
    const expenseEntries = expenseAccounts.length > 0 ? await prisma.journalEntryItem.aggregate({
      where: {
        accountId: { in: expenseAccounts.map(a => a.id) },
        journalEntry: { date: { gte: startOfThisMonth, lte: endOfThisMonth } }
      },
      _sum: { debit: true, credit: true }
    }) : { _sum: { debit: 0, credit: 0 } };
    const totalExpenses = (expenseEntries._sum.debit || 0) - (expenseEntries._sum.credit || 0);

    // Net Profit
    const netProfit = totalRevenue - totalExpenses;

    // Cash In Hand
    const cashAccounts = await prisma.chartOfAccount.findMany({
      where: { code: { in: [ACCOUNT_CODES.CASH_IN_HAND, ACCOUNT_CODES.BANK_ACCOUNTS] } }
    });
    
    const cashEntries = cashAccounts.length > 0 ? await prisma.journalEntryItem.aggregate({
      where: { accountId: { in: cashAccounts.map(a => a.id) } },
      _sum: { debit: true, credit: true }
    }) : { _sum: { debit: 0, credit: 0 } };
    const cashInHand = (cashEntries._sum.debit || 0) - (cashEntries._sum.credit || 0);

    // Accounts Receivable (total due)
    const receivableEntries = arAcc ? await prisma.journalEntryItem.aggregate({
      where: { accountId: arAcc.id },
      _sum: { debit: true, credit: true }
    }) : { _sum: { debit: 0, credit: 0 } };

    // AR is an Asset, so Debit - Credit
    const accountsReceivable = (receivableEntries._sum.debit || 0) - (receivableEntries._sum.credit || 0);

    // Accounts Payable
    const payableEntries = apAcc ? await prisma.journalEntryItem.aggregate({
      where: { accountId: apAcc.id },
      _sum: { credit: true, debit: true }
    }) : { _sum: { credit: 0, debit: 0 } };
    const accountsPayable = (payableEntries._sum.credit || 0) - (payableEntries._sum.debit || 0);

    // Investor Liability
    const investorLiability = await prisma.investorLoan.aggregate({
      where: { status: { not: 'FULLY_REPAID' } },
      _sum: { loanAmount: true, totalRepaid: true }
    });
    const totalInvestorRemaining = (investorLiability._sum.loanAmount || 0) - (investorLiability._sum.totalRepaid || 0);

    return {
      success: true,
      data: {
        totalRevenue,
        totalExpenses,
        netProfit,
        cashInHand,
        accountsReceivable,
        accountsPayable,
        investorLiability: totalInvestorRemaining
      }
    };
  } catch (error: any) {
    console.error('getFinanceDashboardData Error:', error);
    return { success: false, error: error.message };
  }
}

// -------------------------------------------------------------
// REVENUE VS EXPENSE TREND (Last N months)
// -------------------------------------------------------------
export async function getRevenueVsExpenseTrend(months = 6) {
  try {
    const today = new Date();
    const trend = [];
    
    const salesAcc = await prisma.chartOfAccount.findUnique({ where: { code: ACCOUNT_CODES.SALES_REVENUE } });
    const expenseAccounts = await prisma.chartOfAccount.findMany({
      where: {
        OR: [
          { code: { startsWith: '5' } },
          { code: { startsWith: '6' } },
        ]
      }
    });
    const expenseAccountIds = expenseAccounts.map(a => a.id);

    for (let i = months - 1; i >= 0; i--) {
      const monthDate = subMonths(today, i);
      const start = startOfMonth(monthDate);
      const end = endOfMonth(monthDate);
      
      const revenueData = salesAcc ? await prisma.journalEntryItem.aggregate({
        where: { accountId: salesAcc.id, journalEntry: { date: { gte: start, lte: end } } },
        _sum: { credit: true, debit: true }
      }) : { _sum: { credit: 0, debit: 0 } };
      
      const rev = (revenueData._sum.credit || 0) - (revenueData._sum.debit || 0);

      const expenseData = expenseAccountIds.length > 0 ? await prisma.journalEntryItem.aggregate({
        where: { accountId: { in: expenseAccountIds }, journalEntry: { date: { gte: start, lte: end } } },
        _sum: { debit: true, credit: true }
      }) : { _sum: { debit: 0, credit: 0 } };
      
      const exp = (expenseData._sum.debit || 0) - (expenseData._sum.credit || 0);

      trend.push({
        name: format(monthDate, 'MMM yy'),
        revenue: rev,
        expense: exp,
        profit: rev - exp
      });
    }

    return { success: true, data: trend };
  } catch (error: any) {
    console.error('getRevenueVsExpenseTrend Error:', error);
    return { success: false, error: error.message };
  }
}

// -------------------------------------------------------------
// EXPENSE BREAKDOWN
// -------------------------------------------------------------
export async function getExpenseBreakdown(month?: number, year?: number) {
  try {
    const today = new Date();
    const targetMonth = month !== undefined ? month : today.getMonth();
    const targetYear = year !== undefined ? year : today.getFullYear();
    const start = startOfMonth(new Date(targetYear, targetMonth));
    const end = endOfMonth(new Date(targetYear, targetMonth));

    const expenseAccounts = await prisma.chartOfAccount.findMany({
      where: {
        OR: [
          { code: { startsWith: '5' } },
          { code: { startsWith: '6' } },
        ]
      }
    });

    const breakdownData = await prisma.journalEntryItem.groupBy({
      by: ['accountId'],
      where: {
        accountId: { in: expenseAccounts.map(a => a.id) },
        journalEntry: { date: { gte: start, lte: end } }
      },
      _sum: { debit: true, credit: true }
    });

    const accMap = new Map(expenseAccounts.map(a => [a.id, a.name]));
    
    const breakdown = breakdownData
      .map(item => ({
        name: accMap.get(item.accountId) || 'Unknown',
        value: (item._sum.debit || 0) - (item._sum.credit || 0)
      }))
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value);

    // Sort by largest expense first
    breakdown.sort((a, b) => b.value - a.value);

    return { success: true, data: breakdown };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// -------------------------------------------------------------
// RECENT TRANSACTIONS
// -------------------------------------------------------------
export async function getRecentFinancialTransactions(limit = 20) {
  try {
    const journalEntries = await prisma.journalEntry.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        journalEntryItems: {
          include: { chartOfAccount: { select: { name: true, code: true } } }
        }
      }
    });

    const transactions = journalEntries.map(je => ({
      id: je.id,
      createdAt: je.createdAt,
      source: je.source || 'MANUAL',
      journalEntry: {
        entryNumber: je.entryNumber,
        items: je.journalEntryItems
      }
    }));

    return { success: true, data: transactions };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// -------------------------------------------------------------
// CASH FLOW DATA
// -------------------------------------------------------------
export async function getCashFlowData(period: 'daily' | 'weekly' | 'monthly' = 'daily') {
  try {
    const today = new Date();
    let startDate: Date;
    let endDate: Date = endOfDay(today);
    const intervals = [];

    if (period === 'daily') {
      startDate = subDays(today, 6); // Last 7 days
      for (let i = 6; i >= 0; i--) {
        const d = subDays(today, i);
        intervals.push({ start: startOfDay(d), end: endOfDay(d), label: format(d, 'EEE') });
      }
    } else if (period === 'weekly') {
      startDate = startOfWeek(subWeeks(today, 3)); // Last 4 weeks start
      for (let i = 3; i >= 0; i--) {
        const weekStart = startOfWeek(subWeeks(today, i));
        const weekEnd = endOfWeek(subWeeks(today, i));
        intervals.push({ 
          start: weekStart, 
          end: weekEnd, 
          label: `Week of ${format(weekStart, 'MMM d')}` 
        });
      }
    } else {
      startDate = startOfYear(today); // This year
      for (let i = today.getMonth(); i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        intervals.push({ start: startOfMonth(d), end: endOfMonth(d), label: format(d, 'MMM') });
      }
    }

    const cashAccounts = await prisma.chartOfAccount.findMany({
      where: { code: { in: [ACCOUNT_CODES.CASH_IN_HAND, ACCOUNT_CODES.BANK_ACCOUNTS] } }
    });
    const cashAccountIds = cashAccounts.map(a => a.id);

    const cashFlowTrend = [];
    let totalInflow = 0;
    let totalOutflow = 0;

    for (const interval of intervals) {
      const result = cashAccountIds.length > 0 
        ? await prisma.journalEntryItem.aggregate({
            where: {
              accountId: { in: cashAccountIds },
              journalEntry: { date: { gte: interval.start, lte: interval.end } }
            },
            _sum: { debit: true, credit: true }
          })
        : { _sum: { debit: 0, credit: 0 } };
      
      const cashIn = Number(result._sum.debit || 0);
      const cashOut = Number(result._sum.credit || 0);
      
      totalInflow += cashIn;
      totalOutflow += cashOut;

      cashFlowTrend.push({
        name: interval.label,
        cashIn,
        cashOut,
        netCash: cashIn - cashOut
      });
    }

    return { 
      success: true, 
      data: {
        trend: cashFlowTrend,
        summary: {
          totalInflow,
          totalOutflow,
          netChange: totalInflow - totalOutflow
        }
      }
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Helpers
function startOfDay(d: Date) { const nd = new Date(d); nd.setHours(0,0,0,0); return nd; }
function endOfDay(d: Date) { const nd = new Date(d); nd.setHours(23,59,59,999); return nd; }

// -------------------------------------------------------------
// INCOME STATEMENT (P&L)
// -------------------------------------------------------------
export async function getIncomeStatement(dateFrom?: string, dateTo?: string) {
  try {
    const whereClause: any = {};
    if (dateFrom || dateTo) {
      whereClause.date = {};
      if (dateFrom) whereClause.date.gte = new Date(dateFrom);
      if (dateTo) whereClause.date.lte = endOfDay(new Date(dateTo));
    }

    const accounts = await prisma.chartOfAccount.findMany({
      where: {
        OR: [
          { code: { startsWith: '4' } }, // Revenue
          { code: { startsWith: '5' } }, // COGS
          { code: { startsWith: '6' } }, // Expenses
        ]
      }
    });

    const accountIds = accounts.map(a => a.id);

    const entries = accountIds.length > 0 ? await prisma.journalEntryItem.groupBy({
      by: ['accountId'],
      where: {
        accountId: { in: accountIds },
        journalEntry: Object.keys(whereClause).length > 0 ? whereClause : undefined
      },
      _sum: { debit: true, credit: true }
    }) : [];

    const accMap = new Map(accounts.map(a => [a.id, a]));

    const revenue: { name: string; amount: number }[] = [];
    const cogs: { name: string; amount: number }[] = [];
    const expenses: { name: string; amount: number }[] = [];

    let totalRevenue = 0;
    let totalCogs = 0;
    let totalExpenses = 0;

    for (const entry of entries) {
      const acc = accMap.get(entry.accountId);
      if (!acc) continue;
      
      const dr = entry._sum.debit || 0;
      const cr = entry._sum.credit || 0;

      if (acc.code.startsWith('4')) {
        // Revenue (Credit normal)
        const amt = cr - dr;
        if (amt !== 0) {
          revenue.push({ name: acc.name, amount: amt });
          totalRevenue += amt;
        }
      } else if (acc.code.startsWith('5')) {
        // COGS (Debit normal)
        const amt = dr - cr;
        if (amt !== 0) {
          cogs.push({ name: acc.name, amount: amt });
          totalCogs += amt;
        }
      } else if (acc.code.startsWith('6')) {
        // Expenses (Debit normal)
        const amt = dr - cr;
        if (amt !== 0) {
          expenses.push({ name: acc.name, amount: amt });
          totalExpenses += amt;
        }
      }
    }

    const grossProfit = totalRevenue - totalCogs;
    const netIncome = grossProfit - totalExpenses;

    return {
      success: true,
      data: {
        revenue: revenue.sort((a,b) => b.amount - a.amount),
        cogs: cogs.sort((a,b) => b.amount - a.amount),
        expenses: expenses.sort((a,b) => b.amount - a.amount),
        totalRevenue,
        totalCogs,
        grossProfit,
        totalExpenses,
        netIncome
      }
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// -------------------------------------------------------------
// BALANCE SHEET
// -------------------------------------------------------------
export async function getBalanceSheet(asOfDate?: string) {
  try {
    const whereClause: any = {};
    if (asOfDate) {
      whereClause.date = { lte: endOfDay(new Date(asOfDate)) };
    }

    // Get all accounts
    const accounts = await prisma.chartOfAccount.findMany();
    const accMap = new Map(accounts.map(a => [a.id, a]));

    const entries = await prisma.journalEntryItem.groupBy({
      by: ['accountId'],
      where: {
        journalEntry: Object.keys(whereClause).length > 0 ? whereClause : undefined
      },
      _sum: { debit: true, credit: true }
    });

    const assets: { name: string; amount: number; code: string }[] = [];
    const liabilities: { name: string; amount: number; code: string }[] = [];
    const equity: { name: string; amount: number; code: string }[] = [];

    let totalAssets = 0;
    let totalLiabilities = 0;
    let totalEquity = 0;

    let netIncomeAllTime = 0;

    for (const entry of entries) {
      const acc = accMap.get(entry.accountId);
      if (!acc) continue;

      const dr = entry._sum.debit || 0;
      const cr = entry._sum.credit || 0;

      if (acc.code.startsWith('1')) {
        // Asset (Debit normal)
        const amt = dr - cr;
        if (amt !== 0) {
          assets.push({ name: acc.name, amount: amt, code: acc.code });
          totalAssets += amt;
        }
      } else if (acc.code.startsWith('2')) {
        // Liability (Credit normal)
        const amt = cr - dr;
        if (amt !== 0) {
          liabilities.push({ name: acc.name, amount: amt, code: acc.code });
          totalLiabilities += amt;
        }
      } else if (acc.code.startsWith('3')) {
        // Equity (Credit normal)
        const amt = cr - dr;
        if (amt !== 0) {
          equity.push({ name: acc.name, amount: amt, code: acc.code });
          totalEquity += amt;
        }
      } else if (acc.code.startsWith('4')) {
        // Revenue
        netIncomeAllTime += (cr - dr);
      } else if (acc.code.startsWith('5') || acc.code.startsWith('6')) {
        // COGS & Expenses
        netIncomeAllTime -= (dr - cr);
      }
    }

    // Add Retained Earnings (Net Income from P&L that is not yet closed into Equity)
    if (netIncomeAllTime !== 0) {
      equity.push({ name: 'Current Year Earnings (Net Income)', amount: netIncomeAllTime, code: '3100-CY' });
      totalEquity += netIncomeAllTime;
    }

    return {
      success: true,
      data: {
        assets: assets.sort((a, b) => a.code.localeCompare(b.code)),
        liabilities: liabilities.sort((a, b) => a.code.localeCompare(b.code)),
        equity: equity.sort((a, b) => a.code.localeCompare(b.code)),
        totalAssets,
        totalLiabilities,
        totalEquity,
        isBalanced: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01
      }
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
