'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import {
  Package,
  Clock,
  CheckCircle2,
  Truck,
  XCircle,
  Search,
  Filter,
  ChevronRight,
  ChevronLeft,
  X,
  MapPin,
  Phone,
  CreditCard,
  Calendar,
  Hash,
  ShoppingBag,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';

interface OrderItem {
  id: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
  product?: { name: string; slug: string; images: string[] };
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  grandTotal: number;
  totalAmount: number;
  shippingCost: number;
  discount: number;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  shippingAddress: string;
  division?: string;
  district?: string;
  orderNote?: string;
  createdAt: string;
  items: OrderItem[];
}

const STATUS_TABS = [
  { value: '', label: 'All' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'PROCESSING', label: 'Processing' },
  { value: 'SHIPPED', label: 'Shipped' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

const ORDER_STEPS = [
  { status: 'PENDING',    label: 'Order Placed',   icon: ShoppingBag },
  { status: 'CONFIRMED',  label: 'Confirmed',      icon: CheckCircle2 },
  { status: 'PROCESSING', label: 'Processing',     icon: Package },
  { status: 'SHIPPED',    label: 'Shipped',        icon: Truck },
  { status: 'DELIVERED',  label: 'Delivered',      icon: CheckCircle2 },
];

const statusConfig: Record<string, { label: string; color: string; dot: string }> = {
  PENDING:    { label: 'Pending',    color: 'text-yellow-700 bg-yellow-50 border-yellow-200', dot: 'bg-yellow-400' },
  CONFIRMED:  { label: 'Confirmed',  color: 'text-blue-700   bg-blue-50   border-blue-200',   dot: 'bg-blue-500' },
  PROCESSING: { label: 'Processing', color: 'text-indigo-700 bg-indigo-50 border-indigo-200', dot: 'bg-indigo-500' },
  SHIPPED:    { label: 'Shipped',    color: 'text-purple-700 bg-purple-50 border-purple-200', dot: 'bg-purple-500' },
  DELIVERED:  { label: 'Delivered',  color: 'text-green-700  bg-green-50  border-green-200',  dot: 'bg-green-500' },
  CANCELLED:  { label: 'Cancelled',  color: 'text-red-700    bg-red-50    border-red-200',    dot: 'bg-red-500' },
  RETURNED:   { label: 'Returned',   color: 'text-gray-600   bg-gray-50   border-gray-200',   dot: 'bg-gray-400' },
};

const payStatusConfig: Record<string, { label: string; color: string }> = {
  PENDING:  { label: 'Unpaid',    color: 'text-yellow-700' },
  PAID:     { label: 'Paid',      color: 'text-green-700' },
  FAILED:   { label: 'Failed',    color: 'text-red-700' },
  REFUNDED: { label: 'Refunded',  color: 'text-blue-700' },
};

const pmLabel: Record<string, string> = {
  CASH: 'Cash on Delivery', CARD: 'Card', MOBILE_BANKING: 'Mobile Banking', ONLINE: 'Online', MIXED: 'Mixed',
};

function TrackingTimeline({ status }: { status: string }) {
  const isCancelled = status === 'CANCELLED' || status === 'RETURNED';
  const currentIdx = ORDER_STEPS.findIndex(s => s.status === status);
  return (
    <div className="py-4">
      {isCancelled ? (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
          <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <div>
            <p className="font-semibold text-red-700">Order {statusConfig[status]?.label}</p>
            <p className="text-sm text-red-500 mt-0.5">This order has been {status.toLowerCase()}.</p>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-0">
          {ORDER_STEPS.map((step, idx) => {
            const Icon = step.icon;
            const isComplete = idx <= currentIdx;
            const isActive = idx === currentIdx;
            return (
              <div key={step.status} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center gap-1.5">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all ${
                    isComplete
                      ? 'bg-blue-600 border-blue-600 shadow-md shadow-blue-200'
                      : 'bg-white border-gray-200'
                  }`}>
                    <Icon className={`w-4 h-4 ${isComplete ? 'text-white' : 'text-gray-300'}`} />
                  </div>
                  <span className={`text-xs font-medium text-center leading-tight ${
                    isActive ? 'text-blue-600' : isComplete ? 'text-gray-600' : 'text-gray-300'
                  }`}>
                    {step.label}
                  </span>
                </div>
                {idx < ORDER_STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mb-5 mx-1 ${idx < currentIdx ? 'bg-blue-600' : 'bg-gray-200'}`} />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function OrderDetailModal({ order, onClose }: { order: Order; onClose: () => void }) {
  const cfg = statusConfig[order.status] || statusConfig.PENDING;
  const payCfg = payStatusConfig[order.paymentStatus] || payStatusConfig.PENDING;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        onClick={e => e.stopPropagation()}
        className="bg-white w-full sm:max-w-2xl max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl shadow-2xl"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between z-10 rounded-t-3xl sm:rounded-t-2xl">
          <div>
            <p className="text-xs text-gray-400 font-medium">Order Details</p>
            <p className="font-bold text-gray-800">{order.orderNumber}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Tracking */}
          <div className="bg-gray-50 rounded-2xl p-4 overflow-x-auto">
            <h3 className="text-sm font-semibold text-gray-600 mb-3">Order Tracking</h3>
            <TrackingTimeline status={order.status} />
          </div>

          {/* Status badges */}
          <div className="flex flex-wrap gap-2">
            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border ${cfg.color}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
              {cfg.label}
            </span>
            <span className={`text-xs font-semibold px-3 py-1.5 rounded-full bg-gray-100 ${payCfg.color}`}>
              {payCfg.label}
            </span>
            <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-gray-100 text-gray-600">
              {pmLabel[order.paymentMethod] || order.paymentMethod}
            </span>
          </div>

          {/* Order Items */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Items ({order.items.length})</h3>
            <div className="space-y-2">
              {order.items.map(item => (
                <div key={item.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                    {item.product?.images?.[0] ? (
                      <img src={item.product.images[0]} alt={item.productName} className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      <Package className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{item.productName}</p>
                    <p className="text-xs text-gray-400">Qty: {item.quantity} × ৳{item.unitPrice.toLocaleString()}</p>
                  </div>
                  <p className="text-sm font-semibold text-gray-700">৳{item.total.toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Price Summary */}
          <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal</span>
              <span>৳{order.totalAmount.toLocaleString()}</span>
            </div>
            {order.shippingCost > 0 && (
              <div className="flex justify-between text-sm text-gray-600">
                <span>Shipping</span>
                <span>৳{order.shippingCost.toLocaleString()}</span>
              </div>
            )}
            {order.discount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Discount</span>
                <span>-৳{order.discount.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-gray-800 pt-2 border-t border-gray-200">
              <span>Total</span>
              <span>৳{order.grandTotal.toLocaleString()}</span>
            </div>
          </div>

          {/* Delivery Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-2xl p-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Delivery Address</h3>
              <div className="space-y-1">
                <div className="flex items-start gap-2">
                  <MapPin className="w-3.5 h-3.5 text-gray-400 mt-0.5" />
                  <p className="text-sm text-gray-700">{order.shippingAddress}</p>
                </div>
                {order.district && (
                  <p className="text-xs text-gray-400 pl-5">{[order.district, order.division].filter(Boolean).join(', ')}</p>
                )}
              </div>
            </div>
            <div className="bg-gray-50 rounded-2xl p-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Contact</h3>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-gray-400" />
                  <p className="text-sm text-gray-700">{order.customerPhone}</p>
                </div>
                {order.customerEmail && (
                  <p className="text-xs text-gray-400 pl-5">{order.customerEmail}</p>
                )}
              </div>
            </div>
          </div>

          {/* Meta */}
          <div className="flex flex-wrap gap-4 text-xs text-gray-400">
            <div className="flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5" />
              {order.orderNumber}
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              {new Date(order.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </div>
            <div className="flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5" />
              {pmLabel[order.paymentMethod]}
            </div>
          </div>

          {order.orderNote && (
            <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-3">
              <p className="text-xs font-semibold text-yellow-700 mb-1">Order Note</p>
              <p className="text-sm text-yellow-800">{order.orderNote}</p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function AccountOrdersPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [activeStatus, setActiveStatus] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const fetchOrders = useCallback(async (accessToken: string, status: string, pg: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(pg), limit: '8' });
      if (status) params.set('status', status);
      const res = await fetch(`/api/account/orders?${params}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      setOrders(data.orders || []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
    } catch (_) {
      setOrders([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setToken(session.access_token);
        fetchOrders(session.access_token, '', 1);
      }
    });
  }, [fetchOrders]);

  useEffect(() => {
    if (token) fetchOrders(token, activeStatus, page);
  }, [activeStatus, page, token, fetchOrders]);

  // Open order from URL param
  useEffect(() => {
    const id = searchParams.get('id');
    if (id && orders.length > 0) {
      const found = orders.find(o => o.id === id);
      if (found) setSelectedOrder(found);
    }
  }, [searchParams, orders]);

  const filteredOrders = search
    ? orders.filter(o =>
        o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
        o.items.some(i => i.productName.toLowerCase().includes(search.toLowerCase()))
      )
    : orders;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h1 className="text-lg font-bold text-gray-800">My Orders</h1>
        <p className="text-sm text-gray-500 mt-0.5">{total} order{total !== 1 ? 's' : ''} total</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Status Tabs */}
        <div className="flex overflow-x-auto border-b border-gray-100 scrollbar-hide">
          {STATUS_TABS.map(tab => (
            <button
              key={tab.value}
              onClick={() => { setActiveStatus(tab.value); setPage(1); }}
              className={`flex-shrink-0 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeStatus === tab.value
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="p-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by order number or product…"
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all bg-gray-50"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-5 space-y-3">
            {[1,2,3,4].map(i => (
              <div key={i} className="flex gap-4 animate-pulse p-2">
                <div className="w-14 h-14 bg-gray-100 rounded-xl" />
                <div className="flex-1 space-y-2 pt-2">
                  <div className="h-3 bg-gray-100 rounded w-1/4" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                  <div className="h-3 bg-gray-100 rounded w-1/3" />
                </div>
                <div className="w-16 space-y-2 pt-2">
                  <div className="h-4 bg-gray-100 rounded" />
                  <div className="h-3 bg-gray-100 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-16 text-center">
            <Package className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="font-semibold text-gray-500">No orders found</p>
            {activeStatus && <p className="text-sm text-gray-400 mt-1">No {activeStatus.toLowerCase()} orders.</p>}
            <Link href="/" className="inline-flex items-center gap-1.5 mt-4 text-blue-600 text-sm font-medium hover:underline">
              Start Shopping <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {filteredOrders.map((order) => {
              const cfg = statusConfig[order.status] || statusConfig.PENDING;
              return (
                <motion.div
                  key={order.id}
                  layout
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="border-b border-gray-50 last:border-0"
                >
                  <button
                    onClick={() => setSelectedOrder(order)}
                    className="w-full flex items-start gap-4 p-5 hover:bg-gray-50/50 transition-colors text-left group"
                  >
                    <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Package className="w-5 h-5 text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className="text-sm font-bold text-gray-800">{order.orderNumber}</p>
                        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${cfg.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                          {cfg.label}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 truncate">
                        {order.items.map(i => i.productName).join(', ')}
                      </p>
                      <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(order.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        <span className="mx-1">·</span>
                        {order.items.length} item{order.items.length > 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-gray-800">৳{order.grandTotal.toLocaleString()}</p>
                      <p className={`text-xs mt-0.5 font-medium ${payStatusConfig[order.paymentStatus]?.color || 'text-gray-400'}`}>
                        {payStatusConfig[order.paymentStatus]?.label}
                      </p>
                      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-400 mt-1 ml-auto transition-colors" />
                    </div>
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-2 rounded-xl border border-gray-200 disabled:opacity-40 hover:border-blue-300 transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          </button>
          <span className="text-sm text-gray-600 px-3">Page {page} of {pages}</span>
          <button
            onClick={() => setPage(p => Math.min(pages, p + 1))}
            disabled={page === pages}
            className="p-2 rounded-xl border border-gray-200 disabled:opacity-40 hover:border-blue-300 transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      )}

      {/* Order Detail Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <OrderDetailModal order={selectedOrder} onClose={() => {
            setSelectedOrder(null);
            router.replace('/account/orders', { scroll: false });
          }} />
        )}
      </AnimatePresence>
    </div>
  );
}
