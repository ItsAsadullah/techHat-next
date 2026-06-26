import { getReturnsDashboardSummary, getRecentSalesForReturn } from '@/lib/actions/return-actions';
import ReturnsDashboardClient from '@/components/admin/returns/returns-dashboard-client';

export const metadata = {
  title: 'Returns & Exchange Management | TechHat Admin',
  description: 'Manage product returns, exchanges, refunds and store credit.',
};

export default async function ReturnsPage() {
  const [summary, { orders }] = await Promise.all([
    getReturnsDashboardSummary(),
    getRecentSalesForReturn({ dateRange: 'TODAY' }),
  ]);

  return <ReturnsDashboardClient summary={summary} initialOrders={orders} />;
}
