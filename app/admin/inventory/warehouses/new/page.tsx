import { WarehouseForm } from '../components/warehouse-form';

export default function NewWarehousePage() {
  return (
    <div className="max-w-[1400px] mx-auto">
      <WarehouseForm isEditMode={false} />
    </div>
  );
}
