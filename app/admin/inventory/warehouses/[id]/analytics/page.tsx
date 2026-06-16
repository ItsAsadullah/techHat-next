import { notFound } from 'next/navigation';
import { getWarehouseById } from '@/lib/actions/warehouse-actions';
import { getWarehouseAnalytics } from '@/lib/actions/warehouse-analytics-actions';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { PackageX, TrendingUp, Activity, AlertTriangle, PackageOpen } from 'lucide-react';

export default async function WarehouseAnalyticsPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = await params;
  const [warehouseRes, analyticsRes] = await Promise.all([
    getWarehouseById(resolvedParams.id),
    getWarehouseAnalytics(resolvedParams.id)
  ]);

  if (!warehouseRes.success || !warehouseRes.data || !analyticsRes.success || !analyticsRes.data) {
    notFound();
  }

  const warehouse = warehouseRes.data;
  const analytics = analyticsRes.data;

  // Render health color
  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-emerald-500';
    if (score >= 50) return 'text-amber-500';
    return 'text-red-500';
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Analytics Dashboard
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Health and performance metrics for <span className="font-semibold text-gray-800 dark:text-gray-200">{warehouse.name}</span>
          </p>
        </div>
        <div className="flex items-center gap-4 bg-white dark:bg-gray-800 p-3 rounded-lg border shadow-sm">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-500" />
            <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Health Score</span>
          </div>
          <div className={`text-4xl font-bold ${getHealthColor(analytics.healthScore)}`}>
            {analytics.healthScore}%
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card className="border-t-4 border-t-emerald-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Stock Value</CardTitle>
            <PackageOpen className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">
              ৳{analytics.totalStockValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-purple-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Incoming Stock</CardTitle>
            <Activity className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-purple-600 dark:text-purple-400">
              {analytics.incomingStockItemsCount} <span className="text-sm font-normal text-muted-foreground">items</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Valued at ৳{analytics.incomingStockValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-indigo-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Fast Movers (30d)</CardTitle>
            <TrendingUp className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">
              {analytics.fastMovingItemsCount} <span className="text-sm font-normal text-muted-foreground">items</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Valued at ৳{analytics.fastMovingValue.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-red-500 bg-red-50/50 dark:bg-red-900/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-red-800 dark:text-red-300">Dead Stock (60d)</CardTitle>
            <PackageX className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-red-600 dark:text-red-400">
              {analytics.deadStockItemsCount} <span className="text-sm font-normal opacity-70">items</span>
            </div>
            <p className="text-xs text-red-600/80 mt-1">
              Locked Value: ৳{analytics.deadStockValue.toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Top Movers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
              Top Moving Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.topMovers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No moving items in the last 30 days.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Out (30d)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analytics.topMovers.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="font-medium text-sm">{item.name}</div>
                        {item.variantName && <div className="text-xs text-muted-foreground">{item.variantName}</div>}
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold text-emerald-600">
                        {item.out30Days}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Dead Stock */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Dead Stock Alert
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.deadStockItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">No dead stock detected!</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Stock</TableHead>
                    <TableHead className="text-right">Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analytics.deadStockItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="font-medium text-sm">{item.name}</div>
                        {item.variantName && <div className="text-xs text-muted-foreground">{item.variantName}</div>}
                        <div className="text-[10px] text-red-500 mt-1 uppercase tracking-wider font-semibold">0 movement in 60d</div>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {item.stock}
                      </TableCell>
                      <TableCell className="text-right font-mono text-red-600 font-medium">
                        ৳{item.totalValue.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
