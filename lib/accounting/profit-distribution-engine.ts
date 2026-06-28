import { prisma } from '@/lib/prisma';
import { PARTNER_CONFIG, ACCOUNT_CODES } from './constants';
import { createAutoJournalEntry } from './journal-engine';
import { TransactionSource } from '@prisma/client';
import { format } from 'date-fns';

/**
 * Calculates profit for a given period and distributes it among partners and investors.
 * 
 * Rules:
 * 1. Revenue = sum of credits in Revenue accounts - sum of debits in Revenue accounts (in that period)
 * 2. Expense = sum of debits in Expense accounts - sum of credits in Expense accounts
 * 3. Net Profit = Revenue - Expense
 * 4. Partner A: 50%, Partner B: 50%
 * 5. Update Capital Accounts & Partner balances
 */
export async function distributeProfit(periodStart: Date, periodEnd: Date) {
  try {
    const result = await prisma.$transaction(async (tx) => {
      // Prevent duplicate distribution
      const month = periodStart.getMonth() + 1;
      const year = periodStart.getFullYear();
      const existingDistribution = await tx.profitDistribution.findFirst({
        where: {
          month: month,
          year: year,
          status: 'COMPLETED'
        }
      });

      if (existingDistribution) {
        throw new Error(`Profit for this period (${format(periodStart, 'MMM dd')} - ${format(periodEnd, 'MMM dd')}) has already been distributed.`);
      }

      // 1. Calculate Net Profit
      const revenueAccounts = await tx.chartOfAccount.findMany({ where: { type: 'REVENUE' } });
      const expenseAccounts = await tx.chartOfAccount.findMany({ where: { type: 'EXPENSE' } });
      const cogsAccounts = await tx.chartOfAccount.findMany({ where: { type: 'COGS' } });

      const getAccountBalanceForPeriod = async (accountId: string, isCreditNormal: boolean) => {
        const result = await tx.journalEntryItem.aggregate({
          where: { 
            accountId, 
            journalEntry: { date: { gte: periodStart, lte: periodEnd } } 
          },
          _sum: { debit: true, credit: true }
        });
        
        const totalDebit = result._sum.debit || 0;
        const totalCredit = result._sum.credit || 0;
        
        return isCreditNormal ? totalCredit - totalDebit : totalDebit - totalCredit;
      };

      let totalRevenue = 0;
      for (const acc of revenueAccounts) {
        totalRevenue += await getAccountBalanceForPeriod(acc.id, true);
      }

      let totalExpense = 0;
      for (const acc of [...expenseAccounts, ...cogsAccounts]) {
        totalExpense += await getAccountBalanceForPeriod(acc.id, false);
      }

      const netProfit = totalRevenue - totalExpense;

      if (netProfit <= 0) {
        return { success: true, message: 'No profit to distribute (or net loss).', netProfit };
      }

      // 2. Calculate Partner Shares
      const partnerAShare = Math.round((netProfit * PARTNER_CONFIG.PARTNER_A.ratio) * 100) / 100;
      const partnerBShare = Math.round((netProfit - partnerAShare) * 100) / 100; // Remainder goes to B

      // 3. Get Partner IDs first to avoid duplicate DB calls
      const partnerAId = await getPartnerId(tx, PARTNER_CONFIG.PARTNER_A.name);
      const partnerBId = await getPartnerId(tx, PARTNER_CONFIG.PARTNER_B.name);

      // 4. Create ProfitDistribution Record
      const distribution = await tx.profitDistribution.create({
        data: {
          month,
          year,
          totalRevenue,
          totalExpense,
          grossProfit: totalRevenue - totalExpense,
          netProfit,
          distributableAmt: netProfit,
          status: 'COMPLETED',
          lines: {
            create: [
              { partnerId: partnerAId, sharePercentage: PARTNER_CONFIG.PARTNER_A.ratio * 100, shareAmount: partnerAShare, isPaid: false },
              { partnerId: partnerBId, sharePercentage: PARTNER_CONFIG.PARTNER_B.ratio * 100, shareAmount: partnerBShare, isPaid: false }
            ]
          }
        }
      });

      // 5. Update Partner Balances & Capital Accounts
      await tx.capitalAccount.createMany({
        data: [
          { partnerId: partnerAId, type: 'PROFIT_SHARE', amount: partnerAShare, description: `Profit Share for ${format(periodStart, 'yyyy-MM-dd')} to ${format(periodEnd, 'yyyy-MM-dd')}` },
          { partnerId: partnerBId, type: 'PROFIT_SHARE', amount: partnerBShare, description: `Profit Share for ${format(periodStart, 'yyyy-MM-dd')} to ${format(periodEnd, 'yyyy-MM-dd')}` }
        ]
      });

      await tx.partner.update({ where: { id: partnerAId }, data: { totalProfit: { increment: partnerAShare } } });
      await tx.partner.update({ where: { id: partnerBId }, data: { totalProfit: { increment: partnerBShare } } });

      // 6. Generate Journal Entry
      await createAutoJournalEntry(tx, 'PROFIT_DISTRIBUTION' as TransactionSource, {
        reference: `PROFIT-DIST-${format(periodStart, 'yyyy-MM')}`,
        note: `Profit distribution for ${format(periodStart, 'MMM yyyy')} - ${format(periodEnd, 'MMM yyyy')}`,
        entries: [
          { accountCode: ACCOUNT_CODES.RETAINED_EARNINGS, debit: netProfit, credit: 0, description: 'Profit distributed to partners' },
          { accountCode: ACCOUNT_CODES.PARTNER_A_CAPITAL, debit: 0, credit: partnerAShare, description: `Profit share - ${PARTNER_CONFIG.PARTNER_A.name}` },
          { accountCode: ACCOUNT_CODES.PARTNER_B_CAPITAL, debit: 0, credit: partnerBShare, description: `Profit share - ${PARTNER_CONFIG.PARTNER_B.name}` }
        ]
      });

      return { 
        success: true, 
        message: `Profit of ৳${netProfit.toLocaleString()} distributed successfully.`, 
        netProfit,
        distributionId: distribution.id
      };
    });

    return result;
  } catch (error: any) {
    console.error('distributeProfit Error:', error);
    return { success: false, error: error.message };
  }
}

// --- Helper Function ---
async function getPartnerId(tx: any, name: string): Promise<string> {
  const partner = await tx.partner.findFirst({ where: { name } });
  if (!partner) throw new Error(`Partner not found: ${name}`);
  return partner.id;
}
