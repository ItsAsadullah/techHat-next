import { Metadata } from 'next';
import { PurchaseOrderForm } from '../../components/po-form';
import { getSupplierOptions } from '@/lib/actions/supplier-actions';
import { getWarehouseOptions } from '@/lib/actions/warehouse-actions';
import { getPurchaseOrderById } from '@/lib/actions/po-actions';
import { notFound } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Edit Purchase Order | ERP',
  description: 'Edit a draft purchase order',
};

export default async function EditPurchaseOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [poRes, suppliersRes, warehousesRes] = await Promise.all([
    getPurchaseOrderById(id),
    getSupplierOptions(),
    getWarehouseOptions()
  ]);

  if (!poRes.success || !poRes.data) {
    notFound();
  }

  // Allow editing if status is DRAFT or SUBMITTED
  if (poRes.data.status !== 'DRAFT' && poRes.data.status !== 'SUBMITTED') {
    return (
      <div className="p-12 text-center">
        <h1 className="text-2xl font-bold mb-2">Editing Disabled</h1>
        <p className="text-muted-foreground">Only DRAFT or SUBMITTED Purchase Orders can be edited. This PO is marked as {poRes.data.status}.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <PurchaseOrderForm 
        isEditMode={true} 
        initialData={poRes.data}
        suppliers={suppliersRes.success ? (suppliersRes.data || []) : []} 
        warehouses={warehousesRes.success ? (warehousesRes.data || []) : []} 
      />
    </div>
  );
}
