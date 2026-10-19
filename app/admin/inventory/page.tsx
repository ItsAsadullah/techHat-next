import { getInventoryDashboardStats } from '@/lib/actions/warehouse-actions';
import {
  Package,
  DollarSign,
  ArrowRight,
  AlertTriangle,
  Warehouse,
  ArrowLeftRight,
  ClipboardCheck,
  PackageCheck,
  Truck,
  ShieldCheck,
  Layers,
  Clock,
  TrendingDown,
  Plus,
  CheckCircle2,
  Eye,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export const dynamic = 'force-dynamic';

export default async function InventoryDashboard() {
  const res = await getInventoryDashboardStats();
  const stats = res.success ? res.data : null;
  if (!stats) {
    throw new Error(res.error || 'Unable to load inventory dashboard. Please try again.');
  }

  const kpiCards = [
    {
      title: 'Available to Sell',
      value: (stats.totalAvailableStock ?? 0).toLocaleString(),
      unit: 'units',
      subtitle: 'Ready for immediate order fulfillment',
      icon: ShieldCheck,
      iconBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      valueColor: 'text-emerald-600 dark:text-emerald-400',
      accentBar: 'from-emerald-500 to-teal-500',
    },
    {
      title: 'Owned Physical Stock',
      value: (stats.totalStockQty ?? 0).toLocaleString(),
      unit: 'units',
      subtitle: 'On-hand across warehouses + in transit',
      icon: Package,
      iconBg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
      valueColor: 'text-foreground',
      accentBar: 'from-blue-500 to-indigo-500',
    },
    {
      title: 'Reserved Stock',
      value: (stats.totalReservedStock ?? 0).toLocaleString(),
      unit: 'units',
      subtitle: 'Committed to open orders & transfers',
      icon: Clock,
      iconBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
      valueColor: 'text-amber-600 dark:text-amber-400',
      accentBar: 'from-amber-500 to-orange-500',
    },
    {
      title: 'Incoming PO Stock',
      value: (stats.totalIncomingStock ?? 0).toLocaleString(),
      unit: 'units',
      subtitle: 'Expected from active purchase orders',
      icon: Truck,
      iconBg: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
      valueColor: 'text-indigo-600 dark:text-indigo-400',
      accentBar: 'from-indigo-500 to-purple-500',
    },
    {
      title: 'Total Asset Value',
      value: `৳${(stats.totalStockValue ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
      unit: 'MAC',
      subtitle: 'Valued at Moving Average Cost',
      icon: DollarSign,
      iconBg: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20',
      valueColor: 'text-foreground font-mono',
      accentBar: 'from-violet-500 to-fuchsia-500',
    },
    {
      title: 'Damaged / Written Off',
      value: (stats.totalDamagedStock ?? 0).toLocaleString(),
      unit: 'units',
      subtitle: 'Cumulative approved damage losses',
      icon: TrendingDown,
      iconBg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
      valueColor: 'text-rose-600 dark:text-rose-400',
      accentBar: 'from-rose-500 to-red-500',
    },
  ];

  const workflowCards = [
    {
      title: 'Receive Goods (GRN)',
      description: 'Inspect supplier deliveries against purchase orders & post inward stock',
      href: '/admin/inventory/grn/new',
      listHref: '/admin/inventory/grn',
      icon: PackageCheck,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/20',
      badge: `${stats.totalIncomingStock || 0} incoming units`,
      badgeVariant: 'outline' as const,
      cta: 'New Receipt',
    },
    {
      title: 'Stock Transfers',
      description: 'Reserve, dispatch, and receive stock across warehouse locations',
      href: '/admin/inventory/transfers/new',
      listHref: '/admin/inventory/transfers',
      icon: ArrowLeftRight,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-500/10 border-blue-500/20',
      badge: stats.pendingTransfers > 0 ? `${stats.pendingTransfers} pending action` : 'All clear',
      badgeVariant: stats.pendingTransfers > 0 ? ('default' as const) : ('secondary' as const),
      cta: 'New Transfer',
    },
    {
      title: 'Count & Adjustments',
      description: 'Reconcile physical stock counts or write off damaged & expired units',
      href: '/admin/inventory/adjustments/new',
      listHref: '/admin/inventory/adjustments',
      icon: ClipboardCheck,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-500/10 border-amber-500/20',
      badge: stats.pendingAdjustments > 0 ? `${stats.pendingAdjustments} draft to review` : 'Reconciled',
      badgeVariant: stats.pendingAdjustments > 0 ? ('default' as const) : ('secondary' as const),
      cta: 'Start Count',
    },
    {
      title: 'Warehouse Network',
      description: 'Inspect location-level stock balances, capacity, and movement analytics',
      href: '/admin/inventory/warehouses',
      listHref: '/admin/inventory/warehouses',
      icon: Warehouse,
      color: 'text-violet-600 dark:text-violet-400',
      bg: 'bg-violet-500/10 border-violet-500/20',
      badge: `${stats.activeWarehouses || 0} active locations`,
      badgeVariant: 'outline' as const,
      cta: 'View Locations',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Executive Header Strip */}
      <div className="rounded-2xl border bg-card p-5 shadow-xs flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Inventory Operations Overview
            </h1>
            <Badge variant="outline" className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20 text-xs font-medium">
              <Layers className="h-3 w-3 mr-1" />
              {stats.totalProducts?.toLocaleString() || 0} Active Catalog Products
            </Badge>
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-xs font-medium">
              <Warehouse className="h-3 w-3 mr-1" />
              {stats.activeWarehouses || 0} Active Warehouses
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Real-time stock positions, reservation commitments, in-transit tracking, and Moving Average Cost (MAC) asset valuation.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Button asChild size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs">
            <Link href="/admin/inventory/grn/new">
              <Plus className="mr-1.5 h-4 w-4" />
              Receive Stock (GRN)
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/inventory/transfers/new">
              <ArrowLeftRight className="mr-1.5 h-4 w-4 text-blue-600" />
              New Transfer
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/inventory/adjustments/new">
              <ClipboardCheck className="mr-1.5 h-4 w-4 text-amber-600" />
              New Adjustment
            </Link>
          </Button>
        </div>
      </div>

      {/* 6 Executive KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpiCards.map((card) => (
          <div
            key={card.title}
            className="relative overflow-hidden rounded-xl border bg-card p-4 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${card.accentBar}`} />
            <div className="flex items-start justify-between gap-2 pt-1">
              <span className="text-xs font-semibold text-muted-foreground leading-tight">
                {card.title}
              </span>
              <div className={`h-8 w-8 rounded-lg border flex items-center justify-center shrink-0 ${card.iconBg}`}>
                <card.icon className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-baseline gap-1.5">
                <span className={`text-2xl font-bold tracking-tight tabular-nums ${card.valueColor}`}>
                  {card.value}
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {card.unit}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1 line-clamp-1">
                {card.subtitle}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Core Operational Workflows & Attention Queue */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {workflowCards.map((wf) => (
          <div
            key={wf.title}
            className="group rounded-xl border bg-card p-4 shadow-xs hover:border-indigo-500/40 hover:shadow-md transition-all flex flex-col justify-between gap-4"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className={`h-9 w-9 rounded-lg border flex items-center justify-center ${wf.bg} ${wf.color}`}>
                  <wf.icon className="h-4.5 w-4.5" />
                </div>
                <Badge variant={wf.badgeVariant} className="text-[11px] font-medium">
                  {wf.badge}
                </Badge>
              </div>
              <div>
                <h2 className="font-semibold text-sm text-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {wf.title}
                </h2>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  {wf.description}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-border/60 text-xs">
              <Link
                href={wf.listHref}
                className="font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                View History
              </Link>
              <Link
                href={wf.href}
                className="inline-flex items-center gap-1 font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                {wf.cta}
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Active In-Transit Shipments Banner (Shown when transfers are on the road) */}
      {(stats.inTransit.length > 0 || stats.totalInTransitStock > 0) && (
        <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                <Truck className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                  Shipments Currently In Transit
                  <Badge className="bg-blue-600 text-white text-[10px]">
                    {stats.totalInTransitStock} units moving
                  </Badge>
                </h2>
                <p className="text-xs text-muted-foreground">
                  Verify physical quantities at the destination warehouse before confirming full receipt.
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" asChild className="h-8 text-xs">
              <Link href="/admin/inventory/transfers?status=IN_TRANSIT">
                View All In-Transit <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {stats.inTransit.map((transfer) => {
              const unitCount = transfer.items.reduce((sum, item) => sum + item.quantity, 0);
              return (
                <Link
                  href={`/admin/inventory/transfers/${transfer.id}`}
                  key={transfer.id}
                  className="flex items-center justify-between gap-3 rounded-lg border bg-card p-3.5 hover:border-blue-500/50 hover:shadow-xs transition-all"
                >
                  <div className="min-w-0">
                    <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                      {transfer.transferNumber}
                    </span>
                    <p className="text-xs font-medium text-foreground truncate mt-0.5">
                      {transfer.sourceWarehouse.name} → {transfer.destWarehouse.name}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <Badge variant="secondary" className="font-mono text-xs">
                      {unitCount} units
                    </Badge>
                    <span className="block text-[11px] font-medium text-blue-600 dark:text-blue-400 mt-1">
                      Check & Receive →
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Two-Column Operational Tables: Recent Receipts & Low Stock Watchlist */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent GRNs */}
        <div className="rounded-xl border bg-card shadow-xs flex flex-col overflow-hidden">
          <div className="p-4 sm:px-5 border-b bg-muted/20 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center border border-emerald-500/20">
                <PackageCheck className="h-4 w-4" />
              </div>
              <div>
                <h2 className="font-semibold text-sm text-foreground">Recent Goods Receipts (GRN)</h2>
                <p className="text-xs text-muted-foreground">Latest inward supplier deliveries posted to stock</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" asChild className="h-8 text-xs">
              <Link href="/admin/inventory/grn">
                View All <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>

          <div className="flex-1 divide-y divide-border/60">
            {stats.recentGRNs?.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center mb-3 text-muted-foreground">
                  <PackageCheck className="h-5 w-5" />
                </div>
                <p className="text-sm font-medium text-foreground">No goods received yet</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                  When supplier purchase orders arrive, record a GRN to add stock to your warehouse.
                </p>
                <Button variant="outline" size="sm" asChild className="mt-4 h-8 text-xs">
                  <Link href="/admin/inventory/grn/new">
                    <Plus className="mr-1.5 h-3.5 w-3.5" /> Create First GRN
                  </Link>
                </Button>
              </div>
            ) : (
              stats.recentGRNs?.map((grn: any) => (
                <div
                  key={grn.id}
                  className="p-4 sm:px-5 flex items-center justify-between gap-4 hover:bg-muted/30 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/inventory/grn/${grn.id}`}
                        className="font-mono font-semibold text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        {grn.grnNumber}
                      </Link>
                      <Badge
                        variant="outline"
                        className="text-[10px] uppercase bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                      >
                        {grn.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-1">
                      <span className="font-medium text-foreground">{grn.supplier?.name || 'Supplier'}</span>
                      {' • '}
                      <span>{grn.warehouse?.name || 'Warehouse'}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <p className="text-xs font-medium text-foreground">
                        {new Date(grn.receivedDate).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                      <p className="text-[10px] text-muted-foreground">Received date</p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                      <Link href={`/admin/inventory/grn/${grn.id}`} aria-label={`View ${grn.grnNumber}`}>
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Low Stock & Reorder Watchlist */}
        <div className="rounded-xl border bg-card shadow-xs flex flex-col overflow-hidden">
          <div className="p-4 sm:px-5 border-b bg-muted/20 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center border border-amber-500/20">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <div>
                <h2 className="font-semibold text-sm text-foreground">Low Stock & Reorder Watchlist</h2>
                <p className="text-xs text-muted-foreground">Active items at or below minimum stock threshold</p>
              </div>
            </div>
            {stats.lowStockItems?.length > 0 && (
              <Badge variant="outline" className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20 text-xs">
                {stats.lowStockItems.length} Alerts
              </Badge>
            )}
          </div>

          <div className="flex-1 divide-y divide-border/60">
            {stats.lowStockItems?.length ? (
              <>
                {stats.lowStockItems.map((item) => {
                  const isOut = item.stock <= 0;
                  return (
                    <div
                      key={item.id}
                      className="p-3.5 sm:px-5 flex items-center justify-between gap-4 hover:bg-muted/30 transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-sm text-foreground truncate">{item.name}</p>
                        <p className="text-xs font-mono text-muted-foreground truncate mt-0.5">
                          {item.detail}
                        </p>
                      </div>
                      <div className="flex items-center gap-2.5 shrink-0">
                        <Badge
                          variant="outline"
                          className={
                            isOut
                              ? 'bg-rose-500/10 text-rose-600 border-rose-500/20 font-mono text-xs'
                              : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20 font-mono text-xs'
                          }
                        >
                          {isOut ? 'OUT OF STOCK' : `${item.stock} / ${item.minStock} min`}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
                <div className="p-3 bg-muted/10 flex items-center justify-between gap-2">
                  <Button variant="outline" size="sm" className="w-full h-8 text-xs" asChild>
                    <Link href="/admin/products?stock=low">
                      Review All Low-Stock Products <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <div className="h-10 w-10 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-3">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-sm text-foreground">All Stock Levels Healthy</h3>
                <p className="text-xs text-muted-foreground max-w-xs mt-1">
                  Every active product and variant is currently above its minimum reorder threshold.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
