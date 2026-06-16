import { Metadata } from 'next';
import { GRNForm } from '../components/grn-form';
import { getApprovedPOs } from '@/lib/actions/po-actions';
import { getWarehouseOptions } from '@/lib/actions/warehouse-actions';

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
    <div className="p-6">
      <GRNForm 
        approvedPOs={poRes.success ? (poRes.data || []) : []} 
        warehouses={warehouseRes.success ? (warehouseRes.data || []) : []} 
      />
    </div>
  );
}
