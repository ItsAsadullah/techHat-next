import { getWarehouses } from '@/lib/actions/warehouse-actions';
import { getProducts } from '@/lib/actions/product-actions';
import { TransferForm } from './components/transfer-form';

export default async function NewTransferPage() {
  const [warehousesRes, productsRes] = await Promise.all([
    getWarehouses({ limit: 1000 }),
    getProducts({ limit: 1000 }) // Load products for selection (in a real enterprise app, use a server-side search API)
  ]);

  const warehouses = ((warehousesRes as any).data?.warehouses || []);
  const products = ((productsRes as any).products || []);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">New Warehouse Transfer</h1>
        <p className="text-muted-foreground">Transfer stock between your locations</p>
      </div>

      <TransferForm warehouses={warehouses} products={products} />
    </div>
  );
}
