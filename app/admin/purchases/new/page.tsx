import { Metadata } from 'next';
import { PurchaseOrderForm } from '../components/po-form';
import { getSupplierOptions } from '@/lib/actions/supplier-actions';
import { getWarehouseOptions } from '@/lib/actions/warehouse-actions';

export const metadata: Metadata = {
  title: 'New Purchase Order | ERP',
  description: 'Create a new purchase order',
};

export default async function NewPurchaseOrderPage() {
  const [suppliersRes, warehousesRes] = await Promise.all([
    getSupplierOptions(),
    getWarehouseOptions()
  ]);

  return (
    <div className="p-6">
      <PurchaseOrderForm 
        isEditMode={false} 
        suppliers={suppliersRes.success ? (suppliersRes.data || []) : []} 
        warehouses={warehousesRes.success ? (warehousesRes.data || []) : []} 
      />
    </div>
  );
}
