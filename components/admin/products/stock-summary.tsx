import { Package, AlertTriangle, XCircle, DollarSign, TrendingUp } from "lucide-react";

interface StockSummaryProps {
  stats: {
    totalProducts: number;
    lowStock: number;
    outOfStock: number;
    totalValue: number;
  };
}

export function StockSummary({ stats }: StockSummaryProps) {
  const lowStockPct  = Math.min((stats.lowStock  / (stats.totalProducts || 1)) * 100, 100);
  const outStockPct  = Math.min((stats.outOfStock / (stats.totalProducts || 1)) * 100, 100);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-2 md:mb-4">

      {/* ── Total Products ── */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-md p-3 md:p-4 flex flex-col justify-between">
        <div className="flex items-center gap-2 mb-2">
          <Package className="h-4 w-4 text-slate-500 dark:text-zinc-400" />
          <span className="text-xs font-semibold text-slate-600 dark:text-zinc-400 uppercase tracking-wide">
            Catalog
          </span>
        </div>
        <div>
          <p className="text-xl md:text-2xl font-bold text-slate-900 dark:text-zinc-100">
            {stats.totalProducts.toLocaleString()}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-zinc-500 mt-0.5">Total Products</p>
        </div>
      </div>

      {/* ── Low Stock ── */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-md p-3 md:p-4 flex flex-col justify-between">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className={`h-4 w-4 ${stats.lowStock > 0 ? "text-amber-500" : "text-emerald-500"}`} />
          <span className="text-xs font-semibold text-slate-600 dark:text-zinc-400 uppercase tracking-wide">
            Low Stock
          </span>
        </div>
        <div>
          <p className="text-xl md:text-2xl font-bold text-slate-900 dark:text-zinc-100">
            {stats.lowStock.toLocaleString()}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <div className="h-1 w-10 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden shrink-0">
              <div
                className="h-full bg-amber-400 rounded-full"
                style={{ width: `${lowStockPct}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-500 dark:text-zinc-500">
              {lowStockPct.toFixed(0)}% affected
            </p>
          </div>
        </div>
      </div>

      {/* ── Out of Stock ── */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-md p-3 md:p-4 flex flex-col justify-between">
        <div className="flex items-center gap-2 mb-2">
          <XCircle className="h-4 w-4 text-red-500" />
          <span className="text-xs font-semibold text-slate-600 dark:text-zinc-400 uppercase tracking-wide">
            Depleted
          </span>
        </div>
        <div>
          <p className="text-xl md:text-2xl font-bold text-slate-900 dark:text-zinc-100">
            {stats.outOfStock.toLocaleString()}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <div className="h-1 w-10 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden shrink-0">
              <div
                className="h-full bg-red-500 rounded-full"
                style={{ width: `${outStockPct}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-500 dark:text-zinc-500">
              Needs action
            </p>
          </div>
        </div>
      </div>

      {/* ── Total Inventory Value ── */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-md p-3 md:p-4 flex flex-col justify-between">
        <div className="flex items-center gap-2 mb-2">
          <DollarSign className="h-4 w-4 text-emerald-500" />
          <span className="text-xs font-semibold text-slate-600 dark:text-zinc-400 uppercase tracking-wide">
            Est. Value
          </span>
        </div>
        <div>
          <p
            className="text-xl md:text-2xl font-bold text-slate-900 dark:text-zinc-100 truncate"
            title={`৳ ${stats.totalValue.toLocaleString()}`}
          >
            {new Intl.NumberFormat("en-BD", {
              style: "currency",
              currency: "BDT",
              maximumFractionDigits: 0,
              notation: "compact",
            }).format(stats.totalValue)}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-zinc-500 mt-0.5 flex items-center gap-1">
             Based on cost
          </p>
        </div>
      </div>

    </div>
  );
}
