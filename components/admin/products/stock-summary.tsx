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
  const healthyPct   = Math.max(100 - outStockPct, 0);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">

      {/* Total Products */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-blue-600 to-blue-500 p-6 text-white">
        {/* Subtle pattern circles */}
        <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-white/10" />
        <div className="absolute -right-2 -bottom-8 w-20 h-20 rounded-full bg-white/5" />
        <div className="relative z-10 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Package className="h-5 w-5 text-white" />
            </div>
            <span className="text-[11px] font-semibold tracking-wide bg-white/20 text-white px-2.5 py-1 rounded-full">
              Catalog
            </span>
          </div>
          <div>
            <p className="text-4xl font-extrabold leading-none tracking-tight">
              {stats.totalProducts}
            </p>
            <p className="text-sm text-blue-100 font-medium mt-1">Total Products</p>
          </div>
        </div>
      </div>

      {/* Low Stock */}
      <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
          </div>
          <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${
            stats.lowStock > 0
              ? "bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
              : "bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400"
          }`}>
            {stats.lowStock > 0 ? "Action Needed" : "Healthy"}
          </span>
        </div>
        <div>
          <p className="text-4xl font-extrabold leading-none tracking-tight text-gray-900 dark:text-gray-100">
            {stats.lowStock}
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500 font-medium mt-1">Low Stock Items</p>
        </div>
        <div className="mt-auto space-y-1.5">
          <div className="flex justify-between text-[11px] text-gray-400 dark:text-gray-500">
            <span>Stock level</span>
            <span>{lowStockPct.toFixed(0)}% affected</span>
          </div>
          <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-400 rounded-full transition-all duration-500"
              style={{ width: `${lowStockPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Out of Stock */}
      <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/30 flex items-center justify-center">
            <XCircle className="h-5 w-5 text-red-500" />
          </div>
          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-red-50 dark:bg-red-900/30 text-red-500 dark:text-red-400">
            Unavailable
          </span>
        </div>
        <div>
          <p className="text-4xl font-extrabold leading-none tracking-tight text-gray-900 dark:text-gray-100">
            {stats.outOfStock}
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500 font-medium mt-1">Out of Stock</p>
        </div>
        <div className="mt-auto space-y-1.5">
          <div className="flex justify-between text-[11px] text-gray-400 dark:text-gray-500">
            <span>Availability</span>
            <span>{healthyPct.toFixed(0)}% in stock</span>
          </div>
          <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-red-400 rounded-full transition-all duration-500"
              style={{ width: `${outStockPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Total Inventory Value */}
      <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
            <DollarSign className="h-5 w-5 text-emerald-500" />
          </div>
          <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2.5 py-1 rounded-full">
            <TrendingUp className="h-3 w-3" />
            Cost Based
          </div>
        </div>
        <div>
          <p
            className="text-3xl font-extrabold leading-none tracking-tight text-gray-900 dark:text-gray-100 truncate"
            title={`৳ ${stats.totalValue.toLocaleString()}`}
          >
            {new Intl.NumberFormat("en-BD", {
              style: "currency",
              currency: "BDT",
              maximumFractionDigits: 0,
            }).format(stats.totalValue)}
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500 font-medium mt-1">Total Inventory Value</p>
        </div>
        <div className="mt-auto pt-3 border-t border-gray-100 dark:border-gray-800">
          <p className="text-[11px] text-gray-400 dark:text-gray-500">
            Across <span className="font-semibold text-gray-600 dark:text-gray-300">{stats.totalProducts}</span> products in catalog
          </p>
        </div>
      </div>

    </div>
  );
}
