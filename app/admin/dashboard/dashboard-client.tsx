'use client';

import { useState, useEffect } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend,
} from 'recharts';
import {
  TrendingUp, TrendingDown, DollarSign, ShoppingCart, Package, AlertTriangle,
  ArrowUpRight, ArrowDownRight, Star, Clock, Zap, Users, CreditCard, Smartphone,
} from 'lucide-react';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444'];

function fmt(n: number) {
  if (n >= 100000) return `৳${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `৳${(n / 1000).toFixed(1)}K`;
  return `৳${n.toLocaleString()}`;
}

function StatCard({
  title, value, sub, Icon, gradient, growth, growthLabel,
}: {
  title: string; value: string; sub?: string; Icon: any;
  gradient: string; growth?: number; growthLabel?: string;
}) {
  const up = growth === undefined || growth >= 0;
  return (
    <div className={`relative bg-gradient-to-br ${gradient} p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all overflow-hidden group`}>
      <div className="absolute top-0 right-0 w-28 h-28 bg-white/10 rounded-full -mr-14 -mt-14 group-hover:scale-150 transition-transform duration-500" />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-xl">
            <Icon className="w-6 h-6 text-white" />
          </div>
          {growth !== undefined && (
            <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold text-white ${up ? 'bg-green-400/30' : 'bg-red-400/30'}`}>
              {up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {Math.abs(growth)}%
            </div>
          )}
        </div>
        <h3 className="text-white/75 text-xs font-semibold uppercase tracking-wide mb-1">{title}</h3>
        <p className="text-3xl font-black text-white mb-1">{value}</p>
        {sub && <p className="text-xs text-white/70 font-medium">{sub}</p>}
        {growthLabel && <p className="text-xs text-white/70 font-medium mt-0.5">{growthLabel}</p>}
      </div>
    </div>
  );
}

export function DashboardClient({ stats, salesChartData, categorySales, topProducts, recentOrders }: {
  stats: any;
  salesChartData: any[];
  categorySales: any[];
  topProducts: any[];
  recentOrders: any[];
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const pmIcon = (method: string) => {
    if (method === 'CASH') return <DollarSign className="w-3 h-3" />;
    if (method === 'CARD') return <CreditCard className="w-3 h-3" />;
    if (method === 'MOBILE_BANKING') return <Smartphone className="w-3 h-3" />;
    return <Zap className="w-3 h-3" />;
  };

  const statusBadge = (order: any) => {
    if (order.isPos) {
      const s = order.posPaymentStatus || 'PAID';
      const map: any = {
        PAID: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400',
        PARTIAL: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400',
        DUE: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400',
      };
      return <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${map[s] || map.PAID}`}>{s}</span>;
    }
    const s = order.paymentStatus || 'PENDING';
    const map: any = {
      PAID: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400',
      PENDING: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400',
      FAILED: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400',
      REFUNDED: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400',
    };
    return <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${map[s] || 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}`}>{s}</span>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Real-time business overview</p>
        </div>
        <div className="text-right text-xs text-gray-400 dark:text-gray-500">
          <div className="font-semibold text-gray-600 dark:text-gray-300">Today's Sales</div>
          <div className="text-2xl font-black text-indigo-600">{fmt(stats.todayRevenue)}</div>
          <div className="text-gray-400">{stats.todayOrders} orders</div>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="This Month Revenue"
          value={fmt(stats.thisMonthRevenue)}
          sub={`All time: ${fmt(stats.totalRevenue)}`}
          growthLabel={`vs last month: ${fmt(stats.lastMonthRevenue)}`}
          Icon={DollarSign}
          gradient="from-blue-500 to-blue-600"
          growth={stats.revenueGrowth}
        />
        <StatCard
          title="Total Orders"
          value={stats.totalOrders.toLocaleString()}
          sub={`This month: ${stats.thisMonthOrders}`}
          growthLabel={`${stats.pendingOrders} pending`}
          Icon={ShoppingCart}
          gradient="from-purple-500 to-purple-600"
        />
        <StatCard
          title="Active Products"
          value={stats.totalProducts.toLocaleString()}
          sub={`Low stock: ${stats.lowStockProducts}`}
          growthLabel={`Out of stock: ${stats.outOfStockProducts}`}
          Icon={Package}
          gradient="from-pink-500 to-rose-600"
        />
        <StatCard
          title="POS Due (Bakki)"
          value={fmt(stats.totalPOSDue)}
          sub={`POS collected: ${fmt(stats.totalPOSRevenue)}`}
          growthLabel={`Reviews pending: ${stats.pendingReviews}`}
          Icon={AlertTriangle}
          gradient="from-orange-500 to-amber-600"
        />
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-3 gap-5">
        {/* Weekly Sales Chart */}
        <div className="lg:col-span-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-6 rounded-2xl border border-white dark:border-gray-700 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">Last 7 Days — Sales</h3>
            <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
              <div className="w-2.5 h-2.5 rounded-full bg-purple-500" />Sales
            </div>
          </div>
          <div className="h-64" style={{ minHeight: 0 }}>
            {mounted && <ResponsiveContainer width="100%" height={256}>
              <AreaChart data={salesChartData}>
                <defs>
                  <linearGradient id="gSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e7ff" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 11 }} dy={8} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 11 }} tickFormatter={(v) => fmt(v)} />
                <Tooltip
                  formatter={(v: any) => [`৳${Number(v).toLocaleString()}`, 'Sales']}
                  contentStyle={{ borderRadius: 12, border: '1px solid #e0e7ff', fontSize: 12 }}
                />
                <Area type="monotone" dataKey="sales" stroke="#8b5cf6" strokeWidth={3} fill="url(#gSales)" />
              </AreaChart>
            </ResponsiveContainer>}
          </div>
        </div>

        {/* Category Sales Pie */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-6 rounded-2xl border border-white dark:border-gray-700 shadow-xl">
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">Sales by Category</h3>
          {categorySales.length > 0 ? (
            <>
              <div className="h-44 flex items-center justify-center" style={{ minHeight: 0 }}>
                {mounted && <ResponsiveContainer width="100%" height={176}>
                  <PieChart>
                    <Pie data={categorySales} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={4} dataKey="value">
                      {categorySales.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v: any) => [`৳${Number(v).toLocaleString()}`, '']} contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>}
              </div>
              <div className="grid grid-cols-2 gap-2 mt-3">
                {categorySales.map((c, i) => (
                  <div key={i} className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700/60 rounded-lg px-2 py-1.5">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-gray-700 dark:text-gray-200 truncate">{c.name}</div>
                      <div className="text-xs text-gray-400 dark:text-gray-400">{fmt(c.value)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-44 flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm">No sales data yet</div>
          )}
        </div>
      </div>

      {/* Bottom row: top products + recent orders */}
      <div className="grid lg:grid-cols-3 gap-5">
        {/* Top Products */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-6 rounded-2xl border border-white dark:border-gray-700 shadow-xl">
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">Top Selling Products</h3>
          {topProducts.length > 0 ? (
            <div className="space-y-3">
              {topProducts.map((p, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-xs font-black text-indigo-600 dark:text-indigo-400">{i + 1}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">{p.name}</div>
                    <div className="text-xs text-gray-400 dark:text-gray-500">{p.qty} sold</div>
                  </div>
                  <div className="text-sm font-bold text-purple-600">{fmt(p.revenue)}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 text-gray-400 dark:text-gray-500 text-sm">No sales data yet</div>
          )}

          {/* Quick stats */}
          <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-700 grid grid-cols-2 gap-3">
            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3 text-center">
              <div className="text-xs text-amber-600 dark:text-amber-400 font-semibold">Low Stock</div>
              <div className="text-2xl font-black text-amber-600 dark:text-amber-400">{stats.lowStockProducts}</div>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-3 text-center">
              <div className="text-xs text-red-600 dark:text-red-400 font-semibold">Out of Stock</div>
              <div className="text-2xl font-black text-red-600 dark:text-red-400">{stats.outOfStockProducts}</div>
            </div>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-white dark:border-gray-700 shadow-xl overflow-hidden">
          <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">Recent Transactions</h3>
            <span className="text-xs bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 font-semibold px-2.5 py-1 rounded-full">Latest 10</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700/50 text-xs text-gray-500 dark:text-gray-400 uppercase">
                  <th className="px-4 py-3 text-left font-semibold">Order</th>
                  <th className="px-4 py-3 text-left font-semibold">Customer</th>
                  <th className="px-4 py-3 text-left font-semibold">Item</th>
                  <th className="px-4 py-3 text-right font-semibold">Amount</th>
                  <th className="px-4 py-3 text-center font-semibold">Pay</th>
                  <th className="px-4 py-3 text-center font-semibold">Status</th>
                  {/* Note: th inherits tr dark bg */}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                {recentOrders.length > 0 ? recentOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-indigo-50/40 dark:hover:bg-indigo-900/20 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                      {o.orderNumber}
                      {o.isPos && <span className="ml-1 text-[9px] bg-indigo-100 dark:bg-indigo-900/50 text-indigo-500 dark:text-indigo-400 px-1 rounded">POS</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                          {(o.customerName || 'G')[0].toUpperCase()}
                        </div>
                        <span className="font-medium text-gray-800 dark:text-gray-200 text-xs truncate max-w-[80px]">{o.customerName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400 truncate max-w-[120px]">{o.firstItem}</td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900 dark:text-gray-100">
                      ৳{o.grandTotal.toLocaleString()}
                      {o.dueAmount > 0 && (
                        <div className="text-xs text-red-500 dark:text-red-400 font-normal">বাকি: ৳{o.dueAmount.toLocaleString()}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center justify-center gap-1 text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded-lg px-2 py-1 text-xs">
                        {pmIcon(o.paymentMethod)}
                        {o.paymentMethod === 'MOBILE_BANKING' ? 'MFS' : o.paymentMethod === 'CASH' ? 'Cash' : o.paymentMethod === 'CARD' ? 'Card' : 'Mix'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">{statusBadge(o)}</td>
                  </tr>
                )) : (
                  <tr><td colSpan={6} className="py-10 text-center text-gray-400 dark:text-gray-500 text-sm">No transactions yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
