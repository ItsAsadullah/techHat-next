import { Metadata } from 'next';
import { InventoryValuationService } from '@/lib/services/inventory-valuation-service';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getWarehouses } from '@/lib/actions/warehouse-actions';
import { Package, TrendingUp, Tag, Building2, ShieldAlert } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export const metadata: Metadata = {
  title: 'Inventory Valuation | ERP',
  description: 'View the total financial value of all inventory assets',
};

export default async function ValuationPage() {
  const [report, warehousesRes] = await Promise.all([
    InventoryValuationService.getValuationReport(),
    getWarehouses({})
  ]);

  const warehouses = warehousesRes.success && warehousesRes.data ? warehousesRes.data.warehouses : [];

  // Sort items by value
  const sortedItems = [...report.items].sort((a, b) => b.totalValue - a.totalValue);

  return (
    <div className="flex flex-col gap-6 p-6 max-w-[1400px] mx-auto">
      <div className="flex flex-col gap-2 border-b pb-4">
        <h1 className="text-2xl font-bold tracking-tight">Inventory Valuation (MAC)</h1>
        <p className="text-muted-foreground text-sm flex items-center gap-1.5">
          <ShieldAlert className="w-4 h-4 text-indigo-500" />
          Financial valuation derived from Moving Average Cost (MAC) and physical stock ledger.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-t-4 border-t-indigo-500 bg-indigo-50/10 dark:bg-indigo-900/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Asset Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono">
              ৳{report.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Across {report.items.length} unique SKUs
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Building2 className="h-4 w-4 text-emerald-500" />
              Value by Warehouse
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(report.warehouseValues).map(([wId, value]) => {
                const w = warehouses!.find(x => x.id === wId);
                return (
                  <div key={wId} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                    <span className="font-medium text-sm">{w ? w.name : 'Unknown'}</span>
                    <span className="font-mono font-bold">৳{value.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                );
              })}
              {Object.keys(report.warehouseValues).length === 0 && (
                <p className="text-xs text-muted-foreground">No warehouse data available.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Tag className="h-4 w-4 text-amber-500" />
              Value by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(report.categoryValues)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5) // Top 5
                .map(([category, value]) => (
                  <div key={category} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                    <span className="font-medium text-sm">{category}</span>
                    <span className="font-mono font-bold">৳{value.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Package className="h-4 w-4 text-primary" />
            Top Asset Items
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Physical Stock</TableHead>
                <TableHead className="text-right">MAC (Unit Cost)</TableHead>
                <TableHead className="text-right">Total Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedItems.slice(0, 50).map((item, idx) => (
                <TableRow key={`${item.productId}-${item.variantId}-${idx}`}>
                  <TableCell className="font-mono text-xs">{item.sku || 'N/A'}</TableCell>
                  <TableCell className="font-medium text-sm">{item.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px]">{item.categoryName}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono text-emerald-600 font-bold">{item.stock}</TableCell>
                  <TableCell className="text-right font-mono text-muted-foreground">৳{item.unitCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell className="text-right font-mono font-bold text-indigo-600">৳{item.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                </TableRow>
              ))}
              {sortedItems.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                    No inventory value found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

    </div>
  );
}
