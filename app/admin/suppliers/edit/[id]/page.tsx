import { Metadata } from 'next';
import { SupplierForm } from '../../components/supplier-form';
import { getSupplierById } from '@/lib/actions/supplier-actions';
import { notFound } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Edit Supplier | ERP',
  description: 'Update supplier information',
};

export default async function EditSupplierPage({ params }: { params: { id: string } }) {
  const res = await getSupplierById(params.id);

  if (!res.success || !res.data) {
    notFound();
  }

  return (
    <div className="p-6">
      <SupplierForm isEditMode initialData={res.data} />
    </div>
  );
}
