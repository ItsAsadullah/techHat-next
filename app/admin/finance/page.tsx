import { getFinanceDashboardData, getRevenueVsExpenseTrend, getExpenseBreakdown, getRecentFinancialTransactions } from '@/lib/actions/finance-actions';
import { FinanceDashboardClient } from './finance-dashboard-client';
import { redirect } from 'next/navigation';
import { getServerRole } from '@/lib/supabase-server';

export const metadata = {
  title: 'Finance Dashboard | TechHat ERP',
};

export default async function FinancePage() {
  const role = (await getServerRole())?.toUpperCase();
  if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
    redirect('/admin/dashboard');
  }

  const [
    dashboardRes,
    trendRes,
    expenseRes,
    txRes
  ] = await Promise.all([
    getFinanceDashboardData(),
    getRevenueVsExpenseTrend(6),
    getExpenseBreakdown(),
    getRecentFinancialTransactions(15)
  ]);

  const dashboardData = dashboardRes.success ? dashboardRes.data : null;
  const trendData = (trendRes.success && trendRes.data) ? trendRes.data : [];
  const expenseData = (expenseRes.success && expenseRes.data) ? expenseRes.data : [];
  const recentTransactions = (txRes.success && txRes.data) ? txRes.data : [];

  return (
    <FinanceDashboardClient 
      dashboardData={dashboardData}
      trendData={trendData}
      expenseData={expenseData}
      recentTransactions={recentTransactions}
    />
  );
}