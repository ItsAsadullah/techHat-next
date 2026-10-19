import { getInventoryDashboardStats } from '@/lib/actions/warehouse-actions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Package, DollarSign, Activity, ArrowRight, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { InventoryInstructions } from './inventory-instructions';

export const dynamic = 'force-dynamic';

export default async function InventoryDashboard() {
  const res = await getInventoryDashboardStats();
  const stats = res.success ? res.data : null;
  if (!stats) throw new Error(res.error || 'Unable to load inventory. Please try again.');

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory overview</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Overview of your physical stock, reserves, and warehouse movements.
          </p>
        </div>
        <InventoryInstructions />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { title: 'Receive goods', description: 'Check a delivery against its purchase order', href: 'grn/new', marker: '01' },
          { title: 'Transfer stock', description: 'Move goods between your warehouses', href: 'transfers/new', marker: '02' },
          { title: 'Count & adjust', description: 'Reconcile physical stock with your records', href: 'adjustments/new', marker: '03' },
          { title: 'Browse warehouses', description: 'See stock held at each location', href: 'warehouses', marker: '04' },
        ].map(action => <Link key={action.href} href={`/admin/inventory/${action.href}`} className="group rounded-xl border bg-card p-5 hover:border-primary/50 hover:shadow-sm transition-all"><div className="flex justify-between items-center mb-3"><span className="text-xs font-mono text-muted-foreground">{action.marker}</span><ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary" /></div><h2 className="font-semibold">{action.title}</h2><p className="text-xs text-muted-foreground mt-1">{action.description}</p></Link>)}
      </div>

      <div className="rounded-xl border bg-card p-5 flex flex-wrap items-center gap-4 sm:gap-8">
        <div><h2 className="font-semibold">Needs attention</h2><p className="text-xs text-muted-foreground mt-1">Keep stock moving through each step</p></div>
        <Link href="/admin/inventory/transfers" className="text-sm hover:underline"><strong className="text-xl mr-2">{stats.pendingTransfers}</strong>Draft / ready transfers</Link>
        <Link href="/admin/inventory/adjustments" className="text-sm hover:underline"><strong className="text-xl mr-2">{stats.pendingAdjustments}</strong>Counts to review</Link>
        <Link href="/admin/inventory/transfers?status=IN_TRANSIT" className="text-sm hover:underline"><strong className="text-xl mr-2">{stats.totalInTransitStock}</strong>Units in transit</Link>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        <Card className="shadow-sm border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Owned Stock</CardTitle>
            <Package className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalStockQty?.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Warehouses + in transit</p>
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
            <p className="text-xs text-muted-foreground mt-1">Owned − reserved</p>
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
            <CardTitle className="text-sm font-medium text-muted-foreground">Damage Written Off</CardTitle>
            <Activity className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalDamagedStock?.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Cumulative approved losses</p>
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

      {stats.inTransit.length > 0 && <Card><CardHeader><CardTitle>Expected at destination</CardTitle><CardDescription>Transfers waiting for a physical receipt check.</CardDescription></CardHeader><CardContent className="space-y-3">{stats.inTransit.map(transfer => <Link href={`/admin/inventory/transfers/${transfer.id}`} key={transfer.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4 hover:bg-muted/30"><div><p className="font-mono text-sm font-medium">{transfer.transferNumber}</p><p className="text-xs text-muted-foreground mt-1">{transfer.sourceWarehouse.name} → {transfer.destWarehouse.name}</p></div><span className="text-sm">{transfer.items.reduce((sum, item) => sum + item.quantity, 0)} units · Check receipt →</span></Link>)}</CardContent></Card>}

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

        {/* Stock Alerts */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Low Stock Alerts</CardTitle>
            <CardDescription>Products running below reorder threshold.</CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.lowStockItems?.length ? (
              <div className="space-y-3">
                {stats.lowStockItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-4 border-b pb-3 last:border-0 last:pb-0">
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{item.detail}</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-amber-700">
                      <AlertTriangle className="h-4 w-4" />
                      {item.stock} / {item.minStock}
                    </div>
                  </div>
                ))}
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link href="/admin/products?stock=low">Review low-stock products</Link>
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center border border-dashed rounded-lg bg-muted/20">
                <Package className="h-10 w-10 text-emerald-500 mb-3 opacity-70" />
                <h3 className="font-semibold text-sm">All Stock Levels Healthy</h3>
                <p className="text-xs text-muted-foreground max-w-[220px] mt-1">
                  No active product or variant is at or below its reorder threshold.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
