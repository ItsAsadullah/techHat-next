import { getWarehouseOptions } from '@/lib/actions/warehouse-actions';
import { TransferForm } from './components/transfer-form';

export default async function NewTransferPage() {
  const result = await getWarehouseOptions();
  if (!result.success) throw new Error('Unable to load warehouses. Please try again.');
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div><h1 className="text-3xl font-bold tracking-tight">New warehouse transfer</h1>
        <p className="text-muted-foreground mt-2">Choose a route, add products and review your draft before dispatch.</p></div>
      <TransferForm warehouses={result.data || []} />
    </div>
  );
}
