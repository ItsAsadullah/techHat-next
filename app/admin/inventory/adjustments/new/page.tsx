import { Metadata } from 'next';
import { AdjustmentForm } from '../components/adjustment-form';
import { getWarehouseOptions } from '@/lib/actions/warehouse-actions';

export const metadata: Metadata = {
  title: 'New Stock Adjustment | ERP',
  description: 'Create a new stock correction record',
};

export default async function NewAdjustmentPage() {
  const [warehouseRes] = await Promise.all([
    getWarehouseOptions()
  ]);

  return (
    <div className="p-6">
      <AdjustmentForm 
        warehouses={warehouseRes.success ? (warehouseRes.data || []) : []} 
      />
    </div>
  );
}
