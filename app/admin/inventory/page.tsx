import { getInventoryDashboardStats } from '@/lib/actions/warehouse-actions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Package, Warehouse, DollarSign, Activity, Settings2, Plus, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default async function InventoryDashboard() {
  const res = await getInventoryDashboardStats();
  const stats = res.success ? res.data : null;

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        <Card className="shadow-sm border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Physical Stock</CardTitle>
            <Package className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalStockQty?.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Total in warehouses</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Reserved Stock</CardTitle>
            <Activity className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalReservedStock?.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Pending orders & transfers</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-l-4 border-l-emerald-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Available to Sell</CardTitle>
            <Package className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{stats?.totalAvailableStock?.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Physical - Reserved</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Incoming Stock</CardTitle>
            <Activity className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalIncomingStock?.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Pending POs</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Damaged Stock</CardTitle>
            <Activity className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalDamagedStock?.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">From adjustments</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-l-4 border-l-violet-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Stock Value</CardTitle>
            <DollarSign className="h-4 w-4 text-violet-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">৳{stats?.totalStockValue?.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Calculated at unit cost</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent GRNs */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Receipts (GRN)</CardTitle>
              <CardDescription>Latest goods received into warehouses.</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/inventory/grn">View All <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.recentGRNs?.length === 0 && (
                <div className="text-center py-6 text-muted-foreground border border-dashed rounded-lg">
                  No recent goods received.
                </div>
              )}
              {stats?.recentGRNs?.map((grn: any) => (
                <div key={grn.id} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                  <div>
                    <p className="font-medium text-sm">{grn.grnNumber}</p>
                    <p className="text-xs text-muted-foreground">{grn.supplier?.name} • {grn.warehouse?.name}</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-green-500/10 text-green-600">
                      {grn.status}
                    </span>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {new Date(grn.receivedDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Stock Alerts (Placeholder for now) */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Low Stock Alerts</CardTitle>
            <CardDescription>Products running below reorder threshold.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-10 text-center border border-dashed rounded-lg bg-muted/20">
              <Package className="h-10 w-10 text-muted-foreground mb-3 opacity-50" />
              <h3 className="font-semibold text-sm">All Stock Levels Healthy</h3>
              <p className="text-xs text-muted-foreground max-w-[200px] mt-1">
                We'll notify you when items fall below their minimum stock threshold.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
