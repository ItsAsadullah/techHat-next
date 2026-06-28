import { getCashFlowData } from '@/lib/actions/finance-actions';
import { CashFlowClient } from './cash-flow-client';
import { getServerRole } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Cash Flow | TechHat ERP',
};

export default async function CashFlowPage({
  searchParams
}: {
  searchParams: Promise<{ period?: 'daily' | 'weekly' | 'monthly' }>;
}) {
  const role = (await getServerRole())?.toUpperCase();
  if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') redirect('/admin/dashboard');

  const { period } = await searchParams;
  const p = period || 'daily';

  const res = await getCashFlowData(p);
  const data = (res.success && res.data) ? res.data : { trend: [], summary: { totalInflow: 0, totalOutflow: 0, netChange: 0 } };

  return <CashFlowClient data={data} currentPeriod={p} />;
}
