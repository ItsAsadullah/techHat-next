'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package, Phone, Search, Loader2, ArrowLeft, CheckCircle2,
  Truck, MapPin, AlertCircle, ChevronRight, Clock, RotateCcw,
  ExternalLink, ShoppingBag, XCircle, RefreshCw,
} from 'lucide-react';

interface TrackedOrder {
  id: string;
  orderNumber: string;
  trackingToken: string;
  status: string;
  paymentStatus: string;
  totalAmount: number;
  shippingCost: number;
  customerName: string;
  division?: string;
  district?: string;
  createdAt: string;
  estimatedDelivery?: string;
  shippedAt?: string;
  deliveredAt?: string;
  events?: Array<{
    id: string;
    eventType: string;
    oldStatus?: string;
    newStatus?: string;
    note?: string;
    createdAt: string;
  }>;
  orderItems?: Array<{
    id: string;
    productName: string;
    quantity: number;
    unitPrice: number;
  }>;
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT:               'Draft',
  PENDING_PAYMENT:     'Pending Payment',
  PENDING:             'Pending',
  CONFIRMED:           'Confirmed',
  PROCESSING:          'Processing',
  PACKED:              'Packed',
  SHIPPED:             'Shipped',
  OUT_FOR_DELIVERY:    'Out for Delivery',
  DELIVERED:           'Delivered',
  COMPLETED:           'Completed',
  CANCELLED:           'Cancelled',
  REFUND_REQUESTED:    'Refund Requested',
  REFUNDED:            'Refunded',
  FAILED:              'Failed',
  RETURNED:            'Returned',
};

const PAYMENT_LABELS: Record<string, string> = {
  UNPAID:          'Unpaid',
  PENDING:         'Pending',
  PAID:            'Paid',
  FAILED:          'Failed',
  PARTIALLY_PAID:  'Partially Paid',
  REFUNDED:        'Refunded',
};

const STATUS_STEPS = [
  { key: 'PENDING',          label: 'Order Placed',    icon: ShoppingBag },
  { key: 'CONFIRMED',        label: 'Confirmed',       icon: CheckCircle2 },
  { key: 'PROCESSING',       label: 'Processing',      icon: RefreshCw },
  { key: 'PACKED',           label: 'Packed',          icon: Package },
  { key: 'SHIPPED',          label: 'Shipped',         icon: Truck },
  { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', icon: MapPin },
  { key: 'DELIVERED',        label: 'Delivered',       icon: CheckCircle2 },
];

const STEP_ORDER = STATUS_STEPS.map(s => s.key);

function getStepIndex(status: string): number {
  return STEP_ORDER.indexOf(status);
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    DELIVERED: 'bg-green-100 text-green-700 border-green-200',
    COMPLETED: 'bg-green-100 text-green-700 border-green-200',
    SHIPPED: 'bg-blue-100 text-blue-700 border-blue-200',
    OUT_FOR_DELIVERY: 'bg-blue-100 text-blue-700 border-blue-200',
    CANCELLED: 'bg-red-100 text-red-700 border-red-200',
    FAILED: 'bg-red-100 text-red-700 border-red-200',
    REFUNDED: 'bg-purple-100 text-purple-700 border-purple-200',
    PROCESSING: 'bg-amber-100 text-amber-700 border-amber-200',
    PACKED: 'bg-amber-100 text-amber-700 border-amber-200',
  };
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${colors[status] ?? 'bg-gray-100 text-gray-700 border-gray-200'}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

function PaymentBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    PAID: 'bg-green-100 text-green-700 border-green-200',
    UNPAID: 'bg-orange-100 text-orange-700 border-orange-200',
    FAILED: 'bg-red-100 text-red-700 border-red-200',
    REFUNDED: 'bg-purple-100 text-purple-700 border-purple-200',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${colors[status] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}>
      {PAYMENT_LABELS[status] ?? status}
    </span>
  );
}

export default function TrackOrderPage() {
  const [orderNumber, setOrderNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [order, setOrder] = useState<TrackedOrder | null>(null);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!orderNumber.trim() || !phone.trim()) {
      setError('Please enter both order number and phone number.');
      return;
    }
    setLoading(true);
    setError('');
    setOrder(null);

    try {
      const res = await fetch('/api/orders/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderNumber: orderNumber.trim(), phone: phone.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.order) {
        setOrder(data.order);
      } else {
        setError(data.error || 'Order not found. Please check your order number and phone number.');
      }
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const currentStepIndex = order ? getStepIndex(order.status) : -1;
  const isCancelled = order && ['CANCELLED', 'FAILED', 'RETURNED'].includes(order.status);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-gray-50 px-4 py-12">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
          <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-200">
            <Package className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Track Your Order</h1>
          <p className="text-gray-500 text-sm">Enter your order number and phone number to see the latest status</p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch}>
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 mb-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">Order Number</label>
                <div className="relative">
                  <ShoppingBag className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={orderNumber}
                    onChange={e => setOrderNumber(e.target.value)}
                    placeholder="TH-2026-000123"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-sm font-mono transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="01XXXXXXXXX"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-sm transition-all"
                  />
                </div>
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="mt-4 flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3"
                >
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <button type="submit" disabled={loading}
              className="mt-5 w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-100"
            >
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Searching...</> : <><Search className="w-4 h-4" /> Track Order</>}
            </button>
          </div>
        </form>

        {/* Results */}
        <AnimatePresence>
          {order && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-5">

              {/* Order Header */}
              <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Order Number</p>
                    <p className="font-black text-xl text-gray-900 tracking-wide">{order.orderNumber}</p>
                    <p className="text-xs text-gray-400 mt-1">Placed on {new Date(order.createdAt).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</p>
                  </div>
                  <StatusBadge status={order.status} />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 border-t border-gray-100 pt-4">
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Total</p>
                    <p className="font-bold text-gray-900">৳{(order.grandTotal ?? order.totalAmount ?? 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Payment</p>
                    <PaymentBadge status={order.paymentStatus} />
                  </div>
                  {order.estimatedDelivery && (
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Est. Delivery</p>
                      <p className="font-semibold text-gray-700 text-sm">
                        {new Date(order.estimatedDelivery).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  )}
                </div>

                {/* Token tracking link */}
                {order.trackingToken && (
                  <Link href={`/track/${order.trackingToken}`}
                    className="mt-4 w-full flex items-center justify-center gap-2 border-2 border-blue-100 hover:border-blue-300 text-blue-600 font-semibold text-sm py-2.5 rounded-xl transition-colors bg-blue-50 hover:bg-blue-100"
                  >
                    <ExternalLink className="w-4 h-4" /> Open Full Tracking Page
                  </Link>
                )}
              </div>

              {/* Progress Stepper */}
              {!isCancelled && (
                <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6">
                  <h3 className="font-bold text-gray-900 mb-6 text-sm uppercase tracking-wider">Delivery Progress</h3>
                  <div className="relative">
                    {/* Track line */}
                    <div className="absolute left-5 top-5 bottom-5 w-0.5 bg-gray-100" />
                    <div
                      className="absolute left-5 top-5 w-0.5 bg-green-400 transition-all duration-700"
                      style={{ height: currentStepIndex > 0 ? `${Math.min(100, (currentStepIndex / (STATUS_STEPS.length - 1)) * 100)}%` : '0' }}
                    />
                    <div className="space-y-6">
                      {STATUS_STEPS.map((step, i) => {
                        const done = currentStepIndex >= i;
                        const active = currentStepIndex === i;
                        const Icon = step.icon;
                        return (
                          <div key={step.key} className="relative flex items-start gap-4 pl-0">
                            <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${done ? 'bg-green-500 shadow-lg shadow-green-100' : 'bg-gray-100'}`}>
                              <Icon className={`w-4 h-4 ${done ? 'text-white' : 'text-gray-400'}`} />
                              {active && (
                                <span className="absolute inset-0 rounded-full border-2 border-green-400 animate-ping opacity-60" />
                              )}
                            </div>
                            <div className="pt-2">
                              <p className={`text-sm font-semibold ${done ? 'text-gray-900' : 'text-gray-400'}`}>{step.label}</p>
                              {active && order.estimatedDelivery && step.key === 'SHIPPED' && (
                                <p className="text-xs text-blue-600 mt-0.5">
                                  Expected by {new Date(order.estimatedDelivery).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Cancelled notice */}
              {isCancelled && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-5 flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-red-800 mb-1">Order {STATUS_LABELS[order.status]}</p>
                    <p className="text-sm text-red-600">This order has been {STATUS_LABELS[order.status]?.toLowerCase()}. If you have questions, please contact our support.</p>
                  </div>
                </div>
              )}

              {/* Event Timeline */}
              {order.events && order.events.length > 0 && (
                <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6">
                  <h3 className="font-bold text-gray-900 mb-5 text-sm uppercase tracking-wider flex items-center gap-2">
                    <Clock className="w-4 h-4" /> Activity Timeline
                  </h3>
                  <div className="space-y-4">
                    {[...order.events].reverse().map(ev => (
                      <div key={ev.id} className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-blue-400 mt-2 flex-shrink-0" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-medium text-gray-800">
                              {ev.newStatus ? `${STATUS_LABELS[ev.oldStatus ?? ''] || ev.oldStatus} → ${STATUS_LABELS[ev.newStatus] || ev.newStatus}` : ev.eventType.replace(/_/g, ' ')}
                            </p>
                            <span className="text-xs text-gray-400 flex-shrink-0">
                              {new Date(ev.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          {ev.note && <p className="text-xs text-gray-500 mt-0.5">{ev.note}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Order Items */}
              {order.items && order.items.length > 0 && (
                <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6">
                  <h3 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wider flex items-center gap-2">
                    <Package className="w-4 h-4" /> Items in This Order
                  </h3>
                  <div className="divide-y divide-gray-100">
                    {order.items.map(item => (
                      <div key={item.id} className="py-3 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{item.productName}</p>
                          <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
                        </div>
                        <span className="font-bold text-gray-900 text-sm">৳{(item.unitPrice * item.quantity).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                  <div className="pt-3 border-t border-gray-100 flex justify-between text-sm font-bold">
                    <span className="text-gray-600">Shipping</span>
                    <span className="text-gray-900">৳{(order.shippingCost ?? 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm font-extrabold mt-1">
                    <span>Total</span>
                    <span className="text-blue-600">৳{(order.grandTotal ?? order.totalAmount ?? 0).toLocaleString()}</span>
                  </div>
                </div>
              )}

              {/* Need Help */}
              <div className="bg-blue-50 rounded-2xl border border-blue-100 p-5 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-blue-900 text-sm">Need Help?</p>
                  <p className="text-xs text-blue-600 mt-0.5">Contact our support team for assistance</p>
                </div>
                <Link href="/contact" className="flex items-center gap-1 text-blue-700 font-semibold text-sm hover:underline">
                  Contact <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
