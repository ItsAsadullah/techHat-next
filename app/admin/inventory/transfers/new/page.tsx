import { getWarehouseOptions } from '@/lib/actions/warehouse-actions';
import { TransferForm } from './components/transfer-form';

export const dynamic = 'force-dynamic';

export default async function NewTransferPage() {
  const result = await getWarehouseOptions();
  if (!result.success) throw new Error('Unable to load warehouses. Please try again.');
  return <TransferForm warehouses={result.data || []} />;
}
