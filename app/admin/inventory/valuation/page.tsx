import { Metadata } from 'next';
import { InventoryValuationService } from '@/lib/services/inventory-valuation-service';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getWarehouses } from '@/lib/actions/warehouse-actions';
import { Package, TrendingUp, Tag, Building2, ShieldCheck, Layers } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ValuationReportActions } from './valuation-report-actions';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Inventory Valuation | ERP',
  description: 'View the total financial value of all inventory assets',
};

export default async function ValuationPage() {
  const [report, warehousesRes] = await Promise.all([
    InventoryValuationService.getValuationReport(),
    getWarehouses({}),
  ]);

  const warehouses = warehousesRes.success && warehousesRes.data ? warehousesRes.data.warehouses : [];

  // Sort items by value
  const sortedItems = [...report.items].sort((a, b) => b.totalValue - a.totalValue);
  const totalPhysicalUnits = report.items.reduce((sum, item) => sum + item.stock, 0);

  return (
    <div className="space-y-5">
      {/* Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-5 rounded-xl border shadow-sm">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center shrink-0">
            <TrendingUp className="h-5 w-5 text-teal-600 dark:text-teal-400" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-lg font-bold tracking-tight">Inventory Valuation (MAC)</h1>
              <Badge variant="secondary" className="font-mono text-xs">
                {report.items.length} Valued SKUs
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-600 shrink-0" />
              Real-time asset valuation calculated from Moving Average Cost (MAC) and physical warehouse balances.
            </p>
          </div>
        </div>
        <ValuationReportActions items={sortedItems} />
      </div>

      {/* Top KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-t-4 border-t-indigo-500 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Asset Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-indigo-600 dark:text-indigo-400">
              ৳{report.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Total capital tied in active inventory
            </p>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-emerald-500 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Physical Units in Stock</CardTitle>
            <Layers className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
              {totalPhysicalUnits.toLocaleString()}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Across {report.items.length} active SKUs & variants
            </p>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-amber-500 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Active Storage Facilities</CardTitle>
            <Building2 className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">
              {Object.keys(report.warehouseValues).length}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Warehouses holding valued stock
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Breakdown by Warehouse & Category */}
      <div className="grid gap-5 md:grid-cols-2">
        <Card className="shadow-xs">
          <CardHeader className="pb-3 border-b bg-muted/20">
            <CardTitle className="flex items-center gap-2 text-sm font-bold">
              <Building2 className="h-4 w-4 text-emerald-600" />
              Asset Distribution by Warehouse
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-3.5">
              {Object.entries(report.warehouseValues).map(([wId, value]) => {
                const w = warehouses!.find((x: any) => x.id === wId);
                const pct = report.totalValue > 0 ? Math.min(100, (value / report.totalValue) * 100) : 0;
                return (
                  <div key={wId} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-foreground">{w ? w.name : 'Unknown Warehouse'}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground font-mono text-[11px]">{pct.toFixed(1)}%</span>
                        <span className="font-mono font-bold">
                          ৳{value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
              {Object.keys(report.warehouseValues).length === 0 && (
                <p className="text-xs text-muted-foreground py-4 text-center">No warehouse valuation data available.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardHeader className="pb-3 border-b bg-muted/20">
            <CardTitle className="flex items-center gap-2 text-sm font-bold">
              <Tag className="h-4 w-4 text-amber-600" />
              Top Categories by Asset Value
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-3.5">
              {Object.entries(report.categoryValues)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 6)
                .map(([category, value]) => {
                  const pct = report.totalValue > 0 ? Math.min(100, (value / report.totalValue) * 100) : 0;
                  return (
                    <div key={category} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-foreground">{category}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground font-mono text-[11px]">{pct.toFixed(1)}%</span>
                          <span className="font-mono font-bold">
                            ৳{value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-amber-500 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              {Object.keys(report.categoryValues).length === 0 && (
                <p className="text-xs text-muted-foreground py-4 text-center">No category valuation data available.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Asset Items Table */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b bg-muted/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-bold">Top Valued Inventory Assets (Top 50 SKUs)</h3>
          </div>
          <span className="text-xs text-muted-foreground">Sorted by highest total asset value</span>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="text-xs uppercase tracking-wider font-semibold">SKU</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-semibold">Product / Variant</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-semibold">Category</TableHead>
                <TableHead className="text-right text-xs uppercase tracking-wider font-semibold">Physical Stock</TableHead>
                <TableHead className="text-right text-xs uppercase tracking-wider font-semibold">MAC (Unit Cost)</TableHead>
                <TableHead className="text-right text-xs uppercase tracking-wider font-semibold">Total Asset Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedItems.slice(0, 50).map((item, idx) => (
                <TableRow key={`${item.productId}-${item.variantId}-${idx}`} className="hover:bg-muted/20 transition-colors">
                  <TableCell>
                    <code className="font-mono text-xs bg-muted px-2 py-0.5 rounded border">
                      {item.sku || 'N/A'}
                    </code>
                  </TableCell>
                  <TableCell className="font-medium text-sm">{item.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px] font-medium">{item.categoryName}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                    {item.stock}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs text-muted-foreground">
                    ৳{item.unitCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-right font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    ৳{item.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </TableCell>
                </TableRow>
              ))}
              {sortedItems.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground text-sm">
                    No valued inventory items found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
