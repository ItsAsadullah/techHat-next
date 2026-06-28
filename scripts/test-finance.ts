import { getFinanceDashboardData, getRevenueVsExpenseTrend, getExpenseBreakdown } from '../lib/actions/finance-actions';

async function main() {
  console.log('Testing getFinanceDashboardData...');
  const res1 = await getFinanceDashboardData();
  console.log('Result 1:', res1);
  
  console.log('Testing getRevenueVsExpenseTrend...');
  const res2 = await getRevenueVsExpenseTrend(6);
  console.log('Result 2:', res2);
}

main().catch(console.error);
