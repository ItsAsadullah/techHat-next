import { Metadata } from 'next';
import { SupplierForm } from '../components/supplier-form';

export const metadata: Metadata = {
  title: 'New Supplier | ERP',
  description: 'Add a new vendor or supplier',
};

export default function NewSupplierPage() {
  return (
    <div className="p-6">
      <SupplierForm isEditMode={false} />
    </div>
  );
}
