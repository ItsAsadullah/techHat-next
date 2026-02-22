'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { use } from 'react';
import {
  ArrowLeft,
  Package,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
  PackageCheck,
  RefreshCw,
  Loader2,
  User,
  ShoppingBag,
  Printer,
  Trash2,
  AlertTriangle,
  FileText,
  Ban,
  Copy,
  Check,
  ExternalLink,
  Hash,
  Calendar,
  DollarSign,
  MessageSquare,
  BadgeCheck,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';

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
    slug: string;
    sku: string | null;
    productImages: { url: string }[];
  };
  variant: { id: string; name: string; sku: string | null; image: string | null } | null;
}

interface OrderPayment {
  id: string;
  method: string;
  amount: number;
  provider: string | null;
  transactionId: string | null;
  phoneNumber: string | null;
  note: string | null;
  createdAt: string;
}

interface OrderDetail {
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
  payments: OrderPayment[];
  returns: any[];
  events?: Array<{
    id: string;
    eventType: string;
    oldStatus?: string | null;
    newStatus?: string | null;
    oldPaymentStatus?: string | null;
    newPaymentStatus?: string | null;
    changedBy?: string | null;
    note?: string | null;
    createdAt: string;
  }>;
  trackingToken?: string | null;
  internalNote?: string | null;
  estimatedDelivery?: string | null;
  couponCode?: string | null;
  couponDiscount?: number;
  cancelReason?: string | null;
  user: { id: string; fullName: string | null; email: string | null; phone: string | null; avatarUrl: string | null } | null;
  createdAt: string;
  updatedAt: string;
}

// ═══════════════ Configs ═══════════════

const ORDER_STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; borderColor: string; icon: typeof Clock; step: number }> = {
  DRAFT:             { label: 'Draft',             color: 'text-gray-600',   bgColor: 'bg-gray-50',    borderColor: 'border-gray-200',   icon: FileText,     step: 0 },
  PENDING_PAYMENT:   { label: 'Pending Payment',   color: 'text-orange-700', bgColor: 'bg-orange-50',  borderColor: 'border-orange-200', icon: CreditCard,   step: 0 },
  PENDING:           { label: 'Pending',           color: 'text-amber-700',  bgColor: 'bg-amber-50',   borderColor: 'border-amber-200',  icon: ShoppingBag,  step: 1 },
  CONFIRMED:         { label: 'Confirmed',         color: 'text-blue-700',   bgColor: 'bg-blue-50',    borderColor: 'border-blue-200',   icon: BadgeCheck,   step: 2 },
  PROCESSING:        { label: 'Processing',        color: 'text-purple-700', bgColor: 'bg-purple-50',  borderColor: 'border-purple-200', icon: RefreshCw,    step: 3 },
  PACKED:            { label: 'Packed',            color: 'text-teal-700',   bgColor: 'bg-teal-50',    borderColor: 'border-teal-200',   icon: Package,      step: 4 },
  SHIPPED:           { label: 'Shipped',           color: 'text-indigo-700', bgColor: 'bg-indigo-50',  borderColor: 'border-indigo-200', icon: Truck,        step: 5 },
  OUT_FOR_DELIVERY:  { label: 'Out for Delivery',  color: 'text-sky-700',    bgColor: 'bg-sky-50',     borderColor: 'border-sky-200',    icon: MapPin,       step: 6 },
  DELIVERED:         { label: 'Delivered',         color: 'text-green-700',  bgColor: 'bg-green-50',   borderColor: 'border-green-200',  icon: PackageCheck, step: 7 },
  COMPLETED:         { label: 'Completed',         color: 'text-green-700',  bgColor: 'bg-green-50',   borderColor: 'border-green-200',  icon: CheckCircle2, step: 8 },
  CANCELLED:         { label: 'Cancelled',         color: 'text-red-700',    bgColor: 'bg-red-50',     borderColor: 'border-red-200',    icon: XCircle,      step: -1 },
  REFUND_REQUESTED:  { label: 'Refund Requested',  color: 'text-orange-700', bgColor: 'bg-orange-50',  borderColor: 'border-orange-200', icon: Ban,          step: -1 },
  REFUNDED:          { label: 'Refunded',          color: 'text-purple-700', bgColor: 'bg-purple-50',  borderColor: 'border-purple-200', icon: RefreshCw,    step: -1 },
  FAILED:            { label: 'Failed',            color: 'text-red-700',    bgColor: 'bg-red-50',     borderColor: 'border-red-200',    icon: XCircle,      step: -1 },
  RETURNED:          { label: 'Returned',          color: 'text-gray-700',   bgColor: 'bg-gray-50',    borderColor: 'border-gray-200',   icon: RefreshCw,    step: -1 },
};

const PAYMENT_STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; borderColor: string }> = {
  UNPAID:         { label: 'Unpaid',         color: 'text-orange-700', bgColor: 'bg-orange-50',  borderColor: 'border-orange-200' },
  PENDING:        { label: 'Pending',        color: 'text-amber-700',  bgColor: 'bg-amber-50',   borderColor: 'border-amber-200' },
  PAID:           { label: 'Paid',           color: 'text-green-700',  bgColor: 'bg-green-50',   borderColor: 'border-green-200' },
  FAILED:         { label: 'Failed',         color: 'text-red-700',    bgColor: 'bg-red-50',     borderColor: 'border-red-200' },
  PARTIALLY_PAID: { label: 'Partially Paid', color: 'text-yellow-700', bgColor: 'bg-yellow-50',  borderColor: 'border-yellow-200' },
  REFUNDED:       { label: 'Refunded',       color: 'text-gray-700',   bgColor: 'bg-gray-50',    borderColor: 'border-gray-200' },
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CASH: 'Cash on Delivery',
  CARD: 'Card Payment',
  MOBILE_BANKING: 'Mobile Banking',
  ONLINE: 'Online Payment',
  MIXED: 'Mixed Payment',
};

const STEPS = ['PENDING', 'CONFIRMED', 'PROCESSING', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'];

// Friendly labels shown in the progress bar (different from status badge labels)
const STEP_LABELS: Record<string, string> = {
  PENDING: 'Order Placed',
  CONFIRMED: 'Confirmed',
  PROCESSING: 'Processing',
  PACKED: 'Packed',
  SHIPPED: 'Shipped',
  OUT_FOR_DELIVERY: 'Out for Delivery',
  DELIVERED: 'Delivered',
};

function formatPrice(p: number) { return `৳${p.toLocaleString('en-BD')}`; }
function formatDate(d: string) { return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }); }

// ═══════════════ Status Badge ═══════════════

function StatusBadge({ status, type = 'order' }: { status: string; type?: 'order' | 'payment' }) {
  const config = type === 'order' ? ORDER_STATUS_CONFIG[status] : PAYMENT_STATUS_CONFIG[status];
  if (!config) return null;
  const Icon = type === 'order' ? (ORDER_STATUS_CONFIG[status]?.icon || Clock) : CreditCard;
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border", config.bgColor, config.color, config.borderColor)}>
      <Icon className="w-3.5 h-3.5" />
      {config.label}
    </span>
  );
}

// ═══════════════ Progress Steps ═══════════════

function OrderProgress({ currentStatus }: { currentStatus: string }) {
  const isCancelled = currentStatus === 'CANCELLED' || currentStatus === 'RETURNED';
  const currentStep = ORDER_STATUS_CONFIG[currentStatus]?.step ?? 0;
  // COMPLETED (step 8) means all 7 visual steps are done
  const effectiveStep = Math.min(currentStep, STEPS.length + 1);

  if (isCancelled) {
    return (
      <div className="flex items-center justify-center py-6">
        <div className="flex items-center gap-3 bg-red-50 px-6 py-3 rounded-xl border border-red-200">
          <XCircle className="w-6 h-6 text-red-500" />
          <span className="text-red-700 font-bold">Order {currentStatus === 'CANCELLED' ? 'Cancelled' : 'Returned'}</span>
        </div>
      </div>
    );
  }

  const fillPct = Math.min(100, Math.max(0, ((effectiveStep - 1) / (STEPS.length - 1)) * 100));

  return (
    <div className="py-4">
      <div className="flex items-center justify-between relative">
        {/* Progress line */}
        <div className="absolute top-5 left-[6%] right-[6%] h-1 bg-gray-200 rounded-full">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full transition-all duration-500"
            style={{ width: `${fillPct}%` }}
          />
        </div>

        {STEPS.map((step, idx) => {
          const config = ORDER_STATUS_CONFIG[step];
          const isLast = idx === STEPS.length - 1;
          // Last step is complete as soon as you reach it (no "next step" needed)
          const isComplete = effectiveStep > idx + 1 || (isLast && effectiveStep === idx + 1);
          const isCurrent = !isComplete && effectiveStep === idx + 1;
          const Icon = config.icon;

          return (
            <div key={step} className="flex flex-col items-center relative z-10 flex-1">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border-2",
                isComplete
                  ? 'bg-green-500 border-green-500 text-white shadow-lg shadow-green-200'
                  : isCurrent
                    ? 'bg-blue-500 border-blue-500 text-white shadow-lg shadow-blue-200 animate-pulse'
                    : 'bg-white border-gray-300 text-gray-400'
              )}>
                {isComplete ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
              </div>
              <span className={cn(
                "text-[10px] font-semibold mt-2 text-center leading-tight",
                isComplete ? 'text-green-600' : isCurrent ? 'text-blue-600' : 'text-gray-400'
              )}>
                {STEP_LABELS[step] ?? config.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════ Main Page ═══════════════

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [internalNote, setInternalNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [allowedTransitions, setAllowedTransitions] = useState<string[]>([]);

  const fetchOrder = useCallback(async () => {
    setLoading(true);
    try {
      const { getOrderById } = await import('@/lib/actions/order-actions');
      const result = await getOrderById(id);
      if (result.success && result.order) {
        const o = result.order as any;
        setOrder(o);
        setInternalNote(o.internalNote ?? '');
        // Fetch allowed transitions from API
        try {
          const tRes = await fetch(`/api/orders/${id}/status`, { cache: 'no-store' });
          if (tRes.ok) {
            const tData = await tRes.json();
            setAllowedTransitions(tData.allowed?.map((t: any) => t.value) ?? []);
          }
        } catch { /* ignore */ }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const handleStatusUpdate = async (newStatus: string) => {
    setActionLoading(true);
    try {
      const { updateOrderStatus } = await import('@/lib/actions/order-actions');
      await updateOrderStatus(id, newStatus as any);
      fetchOrder();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handlePaymentUpdate = async (newStatus: string) => {
    setActionLoading(true);
    try {
      const { updatePaymentStatus } = await import('@/lib/actions/order-actions');
      await updatePaymentStatus(id, newStatus as any);
      fetchOrder();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Cancel this order? Stock will be restored.')) return;
    setActionLoading(true);
    try {
      const { cancelOrder } = await import('@/lib/actions/order-actions');
      await cancelOrder(id);
      fetchOrder();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Permanently delete this order?')) return;
    setActionLoading(true);
    try {
      const { deleteOrder } = await import('@/lib/actions/order-actions');
      await deleteOrder(id);
      router.push('/admin/orders');
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const copyOrderNumber = () => {
    if (order) {
      navigator.clipboard.writeText(order.orderNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getNextStatuses = () => allowedTransitions;

  const handleSaveNote = async () => {
    setSavingNote(true);
    try {
      await fetch(`/api/orders/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add_note', note: internalNote, changedBy: 'admin' }),
      });
      fetchOrder();
    } catch (err) {
      console.error(err);
    } finally {
      setSavingNote(false);
    }
  };

  // Print invoice
  const printInvoice = () => {
    if (!order) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const itemsHtml = order.items.map(item => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;font-size:13px;">${item.productName}${item.variant ? ` (${item.variant.name})` : ''}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center;font-size:13px;">${item.quantity}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;font-size:13px;">৳${item.unitPrice.toLocaleString()}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;font-size:13px;font-weight:600;">৳${item.total.toLocaleString()}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice - ${order.orderNumber}</title>
        <style>body{font-family:system-ui,-apple-system,sans-serif;margin:0;padding:40px;color:#333}
        .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:40px;padding-bottom:20px;border-bottom:2px solid #333}
        .logo{font-size:28px;font-weight:800;color:#1a1a1a}.inv-title{text-align:right}
        .inv-title h2{font-size:24px;margin:0;color:#666}.inv-title p{margin:4px 0;font-size:13px;color:#999}
        .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:30px;margin-bottom:30px}
        .info-box h4{font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#999;margin:0 0 8px}
        .info-box p{margin:3px 0;font-size:13px}
        table{width:100%;border-collapse:collapse;margin:20px 0}
        th{background:#f8f9fa;padding:10px 12px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#666;border-bottom:2px solid #eee}
        .totals{margin-left:auto;width:300px}.totals .row{display:flex;justify-content:space-between;padding:6px 0;font-size:13px}
        .totals .grand{font-size:18px;font-weight:800;border-top:2px solid #333;padding-top:10px;margin-top:10px}
        @media print{body{padding:20px}}</style>
      </head>
      <body>
        <div class="header">
          <div class="logo">TechHat</div>
          <div class="inv-title">
            <h2>INVOICE</h2>
            <p><strong>${order.orderNumber}</strong></p>
            <p>Date: ${formatDate(order.createdAt)}</p>
          </div>
        </div>
        <div class="info-grid">
          <div class="info-box">
            <h4>Bill To</h4>
            <p><strong>${order.customerName || 'N/A'}</strong></p>
            <p>${order.customerPhone || ''}</p>
            ${order.customerEmail ? `<p>${order.customerEmail}</p>` : ''}
            ${order.shippingAddress ? `<p>${order.shippingAddress}</p>` : ''}
            ${order.division ? `<p>${[order.upazila, order.district, order.division].filter(Boolean).join(', ')}</p>` : ''}
          </div>
          <div class="info-box" style="text-align:right">
            <h4>Payment</h4>
            <p>Method: ${PAYMENT_METHOD_LABELS[order.paymentMethod] || order.paymentMethod}</p>
            <p>Status: ${PAYMENT_STATUS_CONFIG[order.paymentStatus]?.label || order.paymentStatus}</p>
            ${order.transactionId ? `<p>TrxID: ${order.transactionId}</p>` : ''}
          </div>
        </div>
        <table>
          <thead><tr>
            <th>Product</th><th style="text-align:center">Qty</th><th style="text-align:right">Price</th><th style="text-align:right">Total</th>
          </tr></thead>
          <tbody>${itemsHtml}</tbody>
        </table>
        <div class="totals">
          <div class="row"><span>Subtotal</span><span>৳${order.totalAmount.toLocaleString()}</span></div>
          ${order.discount > 0 ? `<div class="row" style="color:green"><span>Discount</span><span>-৳${order.discount.toLocaleString()}</span></div>` : ''}
          ${order.shippingCost > 0 ? `<div class="row"><span>Shipping</span><span>৳${order.shippingCost.toLocaleString()}</span></div>` : ''}
          <div class="row grand"><span>Grand Total</span><span>৳${order.grandTotal.toLocaleString()}</span></div>
        </div>
        ${order.orderNote ? `<div style="margin-top:30px;padding:15px;background:#fffbeb;border:1px solid #fde68a;border-radius:8px"><strong>Note:</strong> ${order.orderNote}</div>` : ''}
        <div style="margin-top:40px;text-align:center;font-size:12px;color:#999;border-top:1px solid #eee;padding-top:20px">
          <p>Thank you for your order! — TechHat</p>
        </div>
        <script>window.onload=function(){window.print()}</script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-gray-400">
        <AlertTriangle className="w-16 h-16 mb-4" />
        <p className="text-lg font-semibold text-gray-600">Order not found</p>
        <Link href="/admin/orders" className="mt-4 text-blue-600 hover:underline text-sm font-medium">
          ← Back to Orders
        </Link>
      </div>
    );
  }

  const nextStatuses = getNextStatuses();

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/admin/orders')}
            className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors shadow-sm"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-extrabold text-gray-900">{order.orderNumber}</h1>
              <button onClick={copyOrderNumber} className="text-gray-400 hover:text-gray-600 transition-colors">
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </button>
              <StatusBadge status={order.status} type="order" />
              <StatusBadge status={order.paymentStatus} type="payment" />
            </div>
            <p className="text-sm text-gray-500 mt-1">
              <Calendar className="w-3.5 h-3.5 inline mr-1" />
              {formatDate(order.createdAt)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Print */}
          <button
            onClick={printInvoice}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
          >
            <Printer className="w-4 h-4" />
            Print Invoice
          </button>

          {/* Status actions */}
          {nextStatuses.map(ns => {
            const config = ORDER_STATUS_CONFIG[ns];
            const isCancel = ns === 'CANCELLED';
            const isFailed = ns === 'FAILED';
            const isNegative = isCancel || isFailed;
            return (
              <button
                key={ns}
                onClick={() => isCancel ? handleCancel() : handleStatusUpdate(ns)}
                disabled={actionLoading}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm border",
                  isNegative
                    ? "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                    : "bg-blue-600 text-white border-blue-600 hover:bg-blue-700 shadow-blue-200"
                )}
              >
                {actionLoading
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : isNegative
                    ? <config.icon className="w-4 h-4" />
                    : <ChevronRight className="w-4 h-4" />
                }
                {isCancel ? 'Cancel Order' : isFailed ? 'Mark Failed' : `Mark ${config.label}`}
              </button>
            );
          })}

          {/* Delete */}
          {order.status === 'CANCELLED' && (
            <button
              onClick={handleDelete}
              disabled={actionLoading}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-red-200 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          )}
        </div>
      </div>

      {/* Order Progress */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <OrderProgress currentStatus={order.status} />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Items + Summary */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-blue-500" />
                Order Items ({order.items.length})
              </h2>
            </div>

            <div className="divide-y divide-gray-50">
              {order.items.map(item => {
                const imgUrl = item.variant?.image || item.product?.productImages?.[0]?.url;
                return (
                  <div key={item.id} className="px-6 py-4 flex items-center gap-4 hover:bg-gray-50/50 transition-colors">
                    {/* Image */}
                    <div className="w-16 h-16 rounded-xl bg-gray-50 border border-gray-200 overflow-hidden relative shrink-0">
                      {imgUrl ? (
                        <Image src={imgUrl} alt="" fill className="object-cover" sizes="64px" />
                      ) : (
                        <Package className="w-6 h-6 text-gray-300 m-auto mt-4" />
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/products/${item.product.slug}`}
                        target="_blank"
                        className="text-sm font-semibold text-gray-900 hover:text-blue-600 transition-colors flex items-center gap-1"
                      >
                        {item.productName}
                        <ExternalLink className="w-3 h-3 text-gray-400" />
                      </Link>
                      {item.variant && (
                        <p className="text-xs text-gray-500 mt-0.5">Variant: {item.variant.name}</p>
                      )}
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                        {(item.variant?.sku || item.product.sku) && (
                          <span className="flex items-center gap-1">
                            <Hash className="w-3 h-3" />
                            SKU: {item.variant?.sku || item.product.sku}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Qty + Price */}
                    <div className="text-right shrink-0">
                      <p className="text-sm text-gray-500">{item.quantity} × {formatPrice(item.unitPrice)}</p>
                      <p className="text-base font-bold text-gray-900">{formatPrice(item.total)}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Order Total */}
            <div className="px-6 py-5 bg-gray-50/50 border-t border-gray-100">
              <div className="max-w-xs ml-auto space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-medium">{formatPrice(order.totalAmount)}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount</span>
                    <span className="font-medium">-{formatPrice(order.discount)}</span>
                  </div>
                )}
                {order.shippingCost > 0 && (
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Shipping</span>
                    <span className="font-medium">{formatPrice(order.shippingCost)}</span>
                  </div>
                )}
                {order.tax > 0 && (
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Tax</span>
                    <span className="font-medium">{formatPrice(order.tax)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-black text-gray-900 pt-3 border-t-2 border-gray-200">
                  <span>Grand Total</span>
                  <span>{formatPrice(order.grandTotal)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Order Note */}
          {order.orderNote && (
            <div className="bg-amber-50 rounded-2xl border border-amber-200 p-5">
              <div className="flex items-start gap-3">
                <MessageSquare className="w-5 h-5 text-amber-600 mt-0.5" />
                <div>
                  <h3 className="text-sm font-bold text-amber-800">Customer Note</h3>
                  <p className="text-sm text-amber-700 mt-1">{order.orderNote}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Customer Info */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <User className="w-4 h-4 text-blue-500" />
                Customer Information
              </h3>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                  {order.user?.avatarUrl ? (
                    <Image src={order.user.avatarUrl} alt="" width={40} height={40} className="rounded-full" />
                  ) : (
                    <User className="w-5 h-5 text-blue-600" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">{order.customerName || order.user?.fullName || 'Guest'}</p>
                  {order.user && <p className="text-xs text-blue-500 font-medium">Registered User</p>}
                </div>
              </div>

              <div className="space-y-3 pt-2">
                {(order.customerPhone || order.user?.phone) && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <a href={`tel:${order.customerPhone || order.user?.phone}`} className="text-sm text-gray-700 hover:text-blue-600">
                      {order.customerPhone || order.user?.phone}
                    </a>
                  </div>
                )}
                {(order.customerEmail || order.user?.email) && (
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <a href={`mailto:${order.customerEmail || order.user?.email}`} className="text-sm text-gray-700 hover:text-blue-600">
                      {order.customerEmail || order.user?.email}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Shipping Info */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Truck className="w-4 h-4 text-blue-500" />
                Shipping Address
              </h3>
            </div>
            <div className="p-5 space-y-3">
              {order.shippingAddress && (
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                  <p className="text-sm text-gray-700">{order.shippingAddress}</p>
                </div>
              )}
              {order.division && (
                <div className="text-sm text-gray-600 pl-7">
                  <span className="inline-flex items-center gap-1.5 bg-gray-100 px-2.5 py-1 rounded-lg text-xs font-medium">
                    {[order.upazila, order.district, order.division].filter(Boolean).join(' → ')}
                  </span>
                </div>
              )}
              {!order.shippingAddress && !order.division && (
                <p className="text-sm text-gray-400 italic">No shipping address provided</p>
              )}
            </div>
          </div>

          {/* Payment Info */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-blue-500" />
                Payment Details
              </h3>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Method</span>
                <span className="text-sm font-semibold text-gray-900">{PAYMENT_METHOD_LABELS[order.paymentMethod] || order.paymentMethod}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Status</span>
                <StatusBadge status={order.paymentStatus} type="payment" />
              </div>
              {order.transactionId && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Transaction ID</span>
                  <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">{order.transactionId}</span>
                </div>
              )}

              {/* Payment actions */}
              {order.paymentStatus !== 'PAID' && order.status !== 'CANCELLED' && (
                <button
                  onClick={() => handlePaymentUpdate('PAID')}
                  disabled={actionLoading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-green-50 text-green-700 border border-green-200 rounded-xl text-sm font-bold hover:bg-green-100 transition-colors mt-2"
                >
                  <DollarSign className="w-4 h-4" />
                  Mark as Paid
                </button>
              )}
            </div>
          </div>

          {/* Tracking Token */}
          {order.trackingToken && (
            <div className="bg-blue-50 rounded-2xl border border-blue-100 p-4">
              <p className="text-xs font-semibold text-blue-700 mb-1 uppercase tracking-wider">Customer Tracking Link</p>
              <a
                href={`/track/${order.trackingToken}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-blue-600 hover:underline break-all flex items-center gap-1"
              >
                <ExternalLink className="w-3 h-3 flex-shrink-0" />
                /track/{order.trackingToken.slice(0, 16)}…
              </a>
            </div>
          )}

          {/* Internal Note */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-blue-500" />
                Internal Note
              </h3>
            </div>
            <div className="p-4">
              <textarea
                value={internalNote}
                onChange={e => setInternalNote(e.target.value)}
                placeholder="Add an internal note (not visible to customer)..."
                rows={3}
                className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
              />
              <button
                onClick={handleSaveNote}
                disabled={savingNote}
                className="mt-2 w-full flex items-center justify-center gap-2 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs rounded-xl transition-colors"
              >
                {savingNote ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                Save Note
              </button>
            </div>
          </div>

          {/* Event Timeline */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-500" />
                Activity Timeline
              </h3>
            </div>
            <div className="p-5">
              <div className="space-y-4">
                {/* Static order created entry */}
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Order created</p>
                    <p className="text-xs text-gray-500">{formatDate(order.createdAt)}</p>
                  </div>
                </div>
                {/* Events from order_events table */}
                {order.events && [...order.events].reverse().map(ev => (
                  <div key={ev.id} className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5 shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium text-gray-900">
                          {ev.newStatus
                            ? `${ORDER_STATUS_CONFIG[ev.oldStatus ?? '']?.label || ev.oldStatus || 'Start'} → ${ORDER_STATUS_CONFIG[ev.newStatus]?.label || ev.newStatus}`
                            : ev.eventType.replace(/_/g, ' ')}
                        </p>
                        <span className="text-xs text-gray-400 flex-shrink-0">
                          {formatDate(ev.createdAt)}
                        </span>
                      </div>
                      {ev.changedBy && <p className="text-xs text-gray-400">By: {ev.changedBy}</p>}
                      {ev.note && <p className="text-xs text-amber-700 bg-amber-50 rounded px-2 py-0.5 mt-1">{ev.note}</p>}
                    </div>
                  </div>
                ))}
                {order.updatedAt !== order.createdAt && (!order.events || order.events.length === 0) && (
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Last updated</p>
                      <p className="text-xs text-gray-500">{formatDate(order.updatedAt)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
