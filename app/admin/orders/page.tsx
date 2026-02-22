'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Package, 
  Search, 
  Filter, 
  Eye, 
  Trash2, 
  ChevronLeft, 
  ChevronRight,
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
  ShoppingBag,
  Loader2,
  Calendar,
  Phone,
  MapPin,
  CreditCard,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
  X,
  MoreHorizontal,
  Ban,
  ArrowUpDown,
  DollarSign,
  PackageCheck,
  User
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

// ═══════════════ Types ═══════════════

interface OrderItem {
  id: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
  product: {
    id: string;
    name: string;
    productImages: { url: string }[];
  };
  variant: { id: string; name: string; image: string | null } | null;
}

interface Order {
  id: string;
  orderNumber: string;
  customerName: string | null;
  customerPhone: string | null;
  customerEmail: string | null;
  shippingAddress: string | null;
  division: string | null;
  district: string | null;
  upazila: string | null;
  totalAmount: number;
  discount: number;
  tax: number;
  shippingCost: number;
  grandTotal: number;
  paymentMethod: string;
  paymentStatus: string;
  status: string;
  transactionId: string | null;
  orderNote: string | null;
  isPos: boolean;
  items: OrderItem[];
  user: { fullName: string | null; email: string | null; phone: string | null } | null;
  createdAt: string;
  updatedAt: string;
}

interface OrderStats {
  totalOrders: number;
  pendingOrders: number;
  confirmedOrders: number;
  processingOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
  todayOrders: number;
  todayRevenue: number;
}

type StatusTab = 'all' | 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

// ═══════════════ Status Config ═══════════════

const ORDER_STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; borderColor: string; icon: typeof Clock }> = {
  PENDING: { label: 'Pending', color: 'text-amber-700', bgColor: 'bg-amber-50', borderColor: 'border-amber-200', icon: Clock },
  CONFIRMED: { label: 'Confirmed', color: 'text-blue-700', bgColor: 'bg-blue-50', borderColor: 'border-blue-200', icon: CheckCircle2 },
  PROCESSING: { label: 'Processing', color: 'text-purple-700', bgColor: 'bg-purple-50', borderColor: 'border-purple-200', icon: Package },
  SHIPPED: { label: 'Shipped', color: 'text-indigo-700', bgColor: 'bg-indigo-50', borderColor: 'border-indigo-200', icon: Truck },
  DELIVERED: { label: 'Delivered', color: 'text-green-700', bgColor: 'bg-green-50', borderColor: 'border-green-200', icon: PackageCheck },
  CANCELLED: { label: 'Cancelled', color: 'text-red-700', bgColor: 'bg-red-50', borderColor: 'border-red-200', icon: XCircle },
  RETURNED: { label: 'Returned', color: 'text-gray-700', bgColor: 'bg-gray-50', borderColor: 'border-gray-200', icon: RefreshCw },
};

const PAYMENT_STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  PENDING: { label: 'Unpaid', color: 'text-amber-700', bgColor: 'bg-amber-50' },
  PAID: { label: 'Paid', color: 'text-green-700', bgColor: 'bg-green-50' },
  FAILED: { label: 'Failed', color: 'text-red-700', bgColor: 'bg-red-50' },
  REFUNDED: { label: 'Refunded', color: 'text-gray-700', bgColor: 'bg-gray-50' },
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CASH: 'Cash on Delivery',
  CARD: 'Card',
  MOBILE_BANKING: 'Mobile Banking',
  ONLINE: 'Online Payment',
  MIXED: 'Mixed',
};

// ═══════════════ Components ═══════════════

function StatusBadge({ status, type = 'order' }: { status: string; type?: 'order' | 'payment' }) {
  const config = type === 'order' 
    ? ORDER_STATUS_CONFIG[status] || ORDER_STATUS_CONFIG.PENDING
    : PAYMENT_STATUS_CONFIG[status] || PAYMENT_STATUS_CONFIG.PENDING;

  const Icon = type === 'order' ? (ORDER_STATUS_CONFIG[status]?.icon || Clock) : CreditCard;

  return (
    <span className={cn(
      "inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full border",
      config.bgColor, config.color, 
      type === 'order' ? ORDER_STATUS_CONFIG[status]?.borderColor : 'border-current/20'
    )}>
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
}

function StatCard({ label, value, icon: Icon, color, trend }: { 
  label: string; value: string | number; icon: typeof Clock; color: string; trend?: string; 
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-lg hover:border-gray-200 transition-all duration-300">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-black text-gray-900 mt-1">{value}</p>
          {trend && <p className="text-xs text-green-600 font-semibold mt-1">{trend}</p>}
        </div>
        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", color)}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
}

function formatPrice(price: number) {
  return `৳${price.toLocaleString('en-BD')}`;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function formatDateShort(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

// ═══════════════ Main Page ═══════════════

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<StatusTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [quickPreview, setQuickPreview] = useState<Order | null>(null);

  // Fetch orders
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const { getOrders } = await import('@/lib/actions/order-actions');
      const result = await getOrders({
        page: currentPage,
        limit: 20,
        search: searchQuery || undefined,
        status: activeTab !== 'all' ? activeTab as any : undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      });

      if (result.success) {
        setOrders(result.orders as any);
        setTotalPages(result.totalPages);
        setTotalOrders(result.total);
      }
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchQuery, activeTab, dateFrom, dateTo]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const { getOrderStats } = await import('@/lib/actions/order-actions');
      const result = await getOrderStats();
      if (result.success && result.stats) {
        setStats(result.stats);
      }
    } catch (err) {
      console.error('Failed to load stats:', err);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Reset page on tab/search change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery]);

  // Handlers
  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    setActionLoading(orderId);
    try {
      const { updateOrderStatus } = await import('@/lib/actions/order-actions');
      const result = await updateOrderStatus(orderId, newStatus as any);
      if (result.success) {
        fetchOrders();
        fetchStats();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm('আপনি কি এই অর্ডার ক্যান্সেল করতে চান?')) return;
    setActionLoading(orderId);
    try {
      const { cancelOrder } = await import('@/lib/actions/order-actions');
      const result = await cancelOrder(orderId);
      if (result.success) {
        fetchOrders();
        fetchStats();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm('এই অর্ডার ডিলিট করলে ফেরত আনা যাবে না। নিশ্চিত?')) return;
    setActionLoading(orderId);
    try {
      const { deleteOrder } = await import('@/lib/actions/order-actions');
      const result = await deleteOrder(orderId);
      if (result.success) {
        fetchOrders();
        fetchStats();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const toggleSelectOrder = (id: string) => {
    setSelectedOrders(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedOrders.size === orders.length) {
      setSelectedOrders(new Set());
    } else {
      setSelectedOrders(new Set(orders.map(o => o.id)));
    }
  };

  // Status flow - what next status is available
  const getNextStatuses = (currentStatus: string) => {
    const flow: Record<string, string[]> = {
      PENDING: ['CONFIRMED', 'CANCELLED'],
      CONFIRMED: ['PROCESSING', 'CANCELLED'],
      PROCESSING: ['SHIPPED', 'CANCELLED'],
      SHIPPED: ['DELIVERED'],
      DELIVERED: [],
      CANCELLED: [],
      RETURNED: [],
    };
    return flow[currentStatus] || [];
  };

  const tabs: { key: StatusTab; label: string; count: number }[] = [
    { key: 'all', label: 'All Orders', count: stats?.totalOrders || 0 },
    { key: 'PENDING', label: 'Pending', count: stats?.pendingOrders || 0 },
    { key: 'CONFIRMED', label: 'Confirmed', count: stats?.confirmedOrders || 0 },
    { key: 'PROCESSING', label: 'Processing', count: stats?.processingOrders || 0 },
    { key: 'SHIPPED', label: 'Shipped', count: stats?.shippedOrders || 0 },
    { key: 'DELIVERED', label: 'Delivered', count: stats?.deliveredOrders || 0 },
    { key: 'CANCELLED', label: 'Cancelled', count: stats?.cancelledOrders || 0 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Orders</h1>
          <p className="text-gray-500 mt-1 font-medium">Manage online orders from your website</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => { fetchOrders(); fetchStats(); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {statsLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
              <div className="h-3 w-20 bg-gray-200 rounded mb-3" />
              <div className="h-8 w-16 bg-gray-200 rounded" />
            </div>
          ))
        ) : stats ? (
          <>
            <StatCard label="Total Orders" value={stats.totalOrders} icon={ShoppingBag} color="bg-blue-500" />
            <StatCard label="Pending" value={stats.pendingOrders} icon={Clock} color="bg-amber-500" />
            <StatCard label="Delivered" value={stats.deliveredOrders} icon={PackageCheck} color="bg-green-500" />
            <StatCard label="Today's Orders" value={stats.todayOrders} icon={TrendingUp} color="bg-purple-500" />
            <StatCard label="Total Revenue" value={formatPrice(stats.totalRevenue)} icon={DollarSign} color="bg-emerald-500" />
          </>
        ) : null}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="border-b border-gray-100 px-4 overflow-x-auto">
          <div className="flex gap-0 min-w-max">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "px-5 py-3.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap",
                  activeTab === tab.key
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                )}
              >
                {tab.label}
                <span className={cn(
                  "ml-2 text-xs px-2 py-0.5 rounded-full font-bold",
                  activeTab === tab.key ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"
                )}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Search & Filters */}
        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex flex-col lg:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by order number, customer name, phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            
            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-colors",
                showFilters ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
              )}
            >
              <Filter className="w-4 h-4" />
              Filters
            </button>
          </div>

          {/* Expanded Filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }} 
                animate={{ height: 'auto', opacity: 1 }} 
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="flex flex-wrap gap-3 pt-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="From"
                    />
                    <span className="text-gray-400">to</span>
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="To"
                    />
                  </div>
                  {(dateFrom || dateTo) && (
                    <button
                      onClick={() => { setDateFrom(''); setDateTo(''); }}
                      className="text-xs text-red-600 hover:text-red-700 font-medium"
                    >
                      Clear dates
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Orders Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <ShoppingBag className="w-16 h-16 mb-4 stroke-1" />
              <p className="text-lg font-semibold text-gray-600">No orders found</p>
              <p className="text-sm mt-1">Orders placed from the website will appear here</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-gray-500 uppercase tracking-wider border-b border-gray-100 bg-gray-50/50">
                  <th className="px-4 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={selectedOrders.size === orders.length && orders.length > 0}
                      onChange={selectAll}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-4 py-3 font-semibold">Order</th>
                  <th className="px-4 py-3 font-semibold">Customer</th>
                  <th className="px-4 py-3 font-semibold">Items</th>
                  <th className="px-4 py-3 font-semibold">Total</th>
                  <th className="px-4 py-3 font-semibold">Payment</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {orders.map((order) => {
                  const nextStatuses = getNextStatuses(order.status);
                  const isSelected = selectedOrders.has(order.id);
                  const isLoading = actionLoading === order.id;

                  return (
                    <tr 
                      key={order.id} 
                      className={cn(
                        "hover:bg-blue-50/30 transition-colors group",
                        isSelected && "bg-blue-50/50"
                      )}
                    >
                      {/* Checkbox */}
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectOrder(order.id)}
                          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>

                      {/* Order Number */}
                      <td className="px-4 py-3">
                        <Link 
                          href={`/admin/orders/${order.id}`}
                          className="text-sm font-bold text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {order.orderNumber}
                        </Link>
                      </td>

                      {/* Customer */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center shrink-0">
                            <User className="w-4 h-4 text-blue-600" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate max-w-[160px]">
                              {order.customerName || order.user?.fullName || 'Unknown'}
                            </p>
                            <p className="text-xs text-gray-500 truncate max-w-[160px]">
                              {order.customerPhone || order.user?.phone || ''}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Items */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex -space-x-2">
                            {order.items.slice(0, 3).map((item, idx) => {
                              const imgUrl = item.variant?.image || item.product?.productImages?.[0]?.url;
                              return (
                                <div key={item.id} className="w-8 h-8 rounded-lg border-2 border-white bg-gray-100 overflow-hidden relative" style={{ zIndex: 3 - idx }}>
                                  {imgUrl ? (
                                    <Image src={imgUrl} alt="" fill className="object-cover" sizes="32px" />
                                  ) : (
                                    <Package className="w-4 h-4 text-gray-400 m-auto mt-1.5" />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                          <span className="text-xs text-gray-500 font-medium">
                            {order.items.length} item{order.items.length > 1 ? 's' : ''}
                          </span>
                        </div>
                      </td>

                      {/* Total */}
                      <td className="px-4 py-3">
                        <span className="text-sm font-bold text-gray-900">{formatPrice(order.grandTotal)}</span>
                      </td>

                      {/* Payment */}
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          <StatusBadge status={order.paymentStatus} type="payment" />
                          <p className="text-[10px] text-gray-400 font-medium">
                            {PAYMENT_METHOD_LABELS[order.paymentMethod] || order.paymentMethod}
                          </p>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <StatusBadge status={order.status} type="order" />
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3">
                        <span className="text-xs text-gray-500 font-medium">{formatDateShort(order.createdAt)}</span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {isLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                          ) : (
                            <>
                              {/* Quick status actions */}
                              {nextStatuses.length > 0 && (
                                <div className="flex items-center gap-1">
                                  {nextStatuses.map(ns => {
                                    const nsConfig = ORDER_STATUS_CONFIG[ns];
                                    if (!nsConfig) return null;
                                    return (
                                      <button
                                        key={ns}
                                        onClick={() => handleStatusUpdate(order.id, ns)}
                                        title={`Mark as ${nsConfig.label}`}
                                        className={cn(
                                          "w-7 h-7 rounded-lg flex items-center justify-center transition-colors border",
                                          nsConfig.bgColor, nsConfig.color, nsConfig.borderColor,
                                          "hover:opacity-80"
                                        )}
                                      >
                                        <nsConfig.icon className="w-3.5 h-3.5" />
                                      </button>
                                    );
                                  })}
                                </div>
                              )}

                              {/* View */}
                              <Link
                                href={`/admin/orders/${order.id}`}
                                className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                title="View Details"
                              >
                                <Eye className="w-4 h-4" />
                              </Link>

                              {/* Quick Preview */}
                              <button
                                onClick={() => setQuickPreview(quickPreview?.id === order.id ? null : order)}
                                className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition-colors"
                                title="Quick Preview"
                              >
                                <MoreHorizontal className="w-4 h-4" />
                              </button>

                              {/* Delete - only for cancelled */}
                              {order.status === 'CANCELLED' && (
                                <button
                                  onClick={() => handleDeleteOrder(order.id)}
                                  className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                  title="Delete Order"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/30">
            <p className="text-sm text-gray-500">
              Showing <span className="font-semibold text-gray-700">{((currentPage - 1) * 20) + 1}-{Math.min(currentPage * 20, totalOrders)}</span> of{' '}
              <span className="font-semibold text-gray-700">{totalOrders}</span> orders
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={cn(
                      "w-9 h-9 rounded-lg text-sm font-semibold transition-colors",
                      currentPage === pageNum
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
                        : "text-gray-500 hover:bg-gray-100"
                    )}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Quick Preview Drawer */}
      <AnimatePresence>
        {quickPreview && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
              onClick={() => setQuickPreview(null)}
            />
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 overflow-y-auto"
            >
              <div className="sticky top-0 bg-white/95 backdrop-blur-lg border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{quickPreview.orderNumber}</h3>
                  <p className="text-xs text-gray-500">{formatDate(quickPreview.createdAt)}</p>
                </div>
                <button onClick={() => setQuickPreview(null)} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Status */}
                <div className="flex items-center gap-3">
                  <StatusBadge status={quickPreview.status} type="order" />
                  <StatusBadge status={quickPreview.paymentStatus} type="payment" />
                </div>

                {/* Customer Info */}
                <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Customer</h4>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-semibold text-gray-900">{quickPreview.customerName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{quickPreview.customerPhone}</span>
                    </div>
                    {quickPreview.shippingAddress && (
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                        <span className="text-sm text-gray-600">{quickPreview.shippingAddress}</span>
                      </div>
                    )}
                    {quickPreview.division && (
                      <div className="text-xs text-gray-500 pl-6">
                        {[quickPreview.upazila, quickPreview.district, quickPreview.division].filter(Boolean).join(', ')}
                      </div>
                    )}
                  </div>
                </div>

                {/* Items */}
                <div>
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Items ({quickPreview.items.length})</h4>
                  <div className="space-y-3">
                    {quickPreview.items.map(item => {
                      const imgUrl = item.variant?.image || item.product?.productImages?.[0]?.url;
                      return (
                        <div key={item.id} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                          <div className="w-12 h-12 rounded-lg bg-white border border-gray-200 overflow-hidden relative shrink-0">
                            {imgUrl ? (
                              <Image src={imgUrl} alt="" fill className="object-cover" sizes="48px" />
                            ) : (
                              <Package className="w-5 h-5 text-gray-300 m-auto mt-3" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">{item.productName}</p>
                            {item.variant && <p className="text-xs text-gray-500">{item.variant.name}</p>}
                            <p className="text-xs text-gray-500">{item.quantity} × {formatPrice(item.unitPrice)}</p>
                          </div>
                          <span className="text-sm font-bold text-gray-900">{formatPrice(item.total)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Total Summary */}
                <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Subtotal</span>
                    <span>{formatPrice(quickPreview.totalAmount)}</span>
                  </div>
                  {quickPreview.discount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Discount</span>
                      <span>-{formatPrice(quickPreview.discount)}</span>
                    </div>
                  )}
                  {quickPreview.shippingCost > 0 && (
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Shipping</span>
                      <span>{formatPrice(quickPreview.shippingCost)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-bold text-gray-900 pt-2 border-t border-gray-200">
                    <span>Total</span>
                    <span>{formatPrice(quickPreview.grandTotal)}</span>
                  </div>
                </div>

                {/* Order Note */}
                {quickPreview.orderNote && (
                  <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                    <h4 className="text-xs font-bold text-amber-700 uppercase mb-1">Customer Note</h4>
                    <p className="text-sm text-amber-800">{quickPreview.orderNote}</p>
                  </div>
                )}

                {/* Payment Info */}
                <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Payment</h4>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{PAYMENT_METHOD_LABELS[quickPreview.paymentMethod]}</span>
                    <StatusBadge status={quickPreview.paymentStatus} type="payment" />
                  </div>
                  {quickPreview.transactionId && (
                    <p className="text-xs text-gray-500">TrxID: {quickPreview.transactionId}</p>
                  )}
                </div>

                {/* Quick Actions */}
                <div className="space-y-2">
                  {getNextStatuses(quickPreview.status).map(ns => {
                    const nsConfig = ORDER_STATUS_CONFIG[ns];
                    return (
                      <button
                        key={ns}
                        onClick={() => {
                          handleStatusUpdate(quickPreview.id, ns);
                          setQuickPreview(null);
                        }}
                        className={cn(
                          "w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-all border",
                          ns === 'CANCELLED'
                            ? "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                            : "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                        )}
                      >
                        <nsConfig.icon className="w-4 h-4" />
                        Mark as {nsConfig.label}
                      </button>
                    );
                  })}
                  <Link
                    href={`/admin/orders/${quickPreview.id}`}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold bg-gray-900 text-white hover:bg-gray-800 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    View Full Details
                  </Link>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
