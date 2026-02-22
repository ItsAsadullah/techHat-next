import { getDashboardStats } from '@/lib/actions/dashboard-actions';
import { DashboardClient } from './dashboard-client';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const { stats, salesChartData, categorySales, topProducts, recentOrders } =
    await getDashboardStats();

  return (
    <DashboardClient
      stats={stats}
      salesChartData={salesChartData}
      categorySales={categorySales}
      topProducts={topProducts}
      recentOrders={recentOrders}
    />
  );
}

