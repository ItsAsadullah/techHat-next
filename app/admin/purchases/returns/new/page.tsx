import { getSuppliers } from '@/lib/actions/vendor-actions';
import { getWarehouses } from '@/lib/actions/warehouse-actions';
import { getProducts } from '@/lib/actions/product-actions';
import { prisma } from '@/lib/prisma';
import { PurchaseReturnForm } from './components/purchase-return-form';

export default async function NewPurchaseReturnPage() {
  const [suppliersRes, warehousesRes, productsRes, pos] = await Promise.all([
    getSuppliers({ limit: 100 }),
    getWarehouses({ limit: 1000 }),
    getProducts({ limit: 1000 }),
    prisma.purchaseOrder.findMany({ select: { id: true, poNumber: true } })
  ]);

  const suppliers = suppliersRes.success ? suppliersRes.data?.suppliers || [] : [];
  const warehouses = ((warehousesRes as any).data?.warehouses || []);
  const products = ((productsRes as any).products || []);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">New Purchase Return</h1>
        <p className="text-muted-foreground">Create a debit note to return products to a supplier</p>
      </div>

      <PurchaseReturnForm 
        suppliers={suppliers} 
        warehouses={warehouses} 
        products={products}
        purchaseOrders={pos}
      />
    </div>
  );
}
