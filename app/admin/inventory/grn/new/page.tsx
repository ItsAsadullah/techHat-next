import { Metadata } from 'next';
import { GRNForm } from '../components/grn-form';
import { getApprovedPOs } from '@/lib/actions/po-actions';
import { getWarehouseOptions } from '@/lib/actions/warehouse-actions';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Receive Goods | ERP',
  description: 'Receive items against a Purchase Order',
};

export default async function NewGRNPage() {
  const [poRes, warehouseRes] = await Promise.all([
    getApprovedPOs(),
    getWarehouseOptions()
  ]);

  return (
    <GRNForm 
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      approvedPOs={poRes.success ? ((poRes.data || []) as any[]) : []} 
      warehouses={warehouseRes.success ? (warehouseRes.data || []) : []} 
    />
  );
}
