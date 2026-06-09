import { getDashboardStats } from '@/lib/actions/dashboard-actions';
import { DashboardClient } from './dashboard-client';

// PERF: Removed `export const dynamic = 'force-dynamic'` that was defeating
// the unstable_cache (300s TTL) in getDashboardStats. The cache handles
// freshness — forcing dynamic regeneration negated all caching benefit.

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

