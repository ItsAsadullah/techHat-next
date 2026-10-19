import { getInventoryReconciliationData } from '@/lib/actions/inventory-reconciliation-actions';
import { ReconciliationClient } from './reconciliation-client';

export const dynamic = 'force-dynamic';

export default async function InventoryReconciliationPage({
  searchParams,
}: {
  searchParams: Promise<{ warehouseId?: string; search?: string; categoryId?: string }>;
}) {
  const sp = await searchParams;
  const initialData = await getInventoryReconciliationData({
    warehouseId: sp.warehouseId,
    search: sp.search,
    categoryId: sp.categoryId,
  });

  const activeWarehouseId =
    sp.warehouseId || initialData.defaultWarehouseId || 'ALL';

  // If no explicit warehouseId was passed in URL, load scoped to default warehouse if one exists
  const finalData =
    !sp.warehouseId && initialData.defaultWarehouseId
      ? await getInventoryReconciliationData({
          warehouseId: initialData.defaultWarehouseId,
          search: sp.search,
          categoryId: sp.categoryId,
        })
      : initialData;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <ReconciliationClient
        initialRows={finalData.rows}
        summary={finalData.summary}
        warehouses={finalData.warehouses}
        categories={finalData.categories}
        selectedWarehouseId={activeWarehouseId}
      />
    </div>
  );
}
