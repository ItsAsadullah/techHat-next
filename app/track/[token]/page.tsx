import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  Package, CheckCircle2, Truck, MapPin, Clock, ArrowLeft,
  ShoppingBag, RefreshCw, XCircle, PhoneCall, BadgeCheck,
} from 'lucide-react';
import { trackOrderByToken } from '@/lib/actions/order-actions';

export const dynamic = 'force-dynamic';

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft', PENDING_PAYMENT: 'Pending Payment', PENDING: 'Pending',
  CONFIRMED: 'Confirmed', PROCESSING: 'Processing', PACKED: 'Packed',
  SHIPPED: 'Shipped', OUT_FOR_DELIVERY: 'Out for Delivery', DELIVERED: 'Delivered',
  COMPLETED: 'Completed', CANCELLED: 'Cancelled', REFUND_REQUESTED: 'Refund Requested',
  REFUNDED: 'Refunded', FAILED: 'Failed', RETURNED: 'Returned',
};

const PAYMENT_LABELS: Record<string, string> = {
  UNPAID: 'Unpaid', PENDING: 'Pending', PAID: 'Paid',
  FAILED: 'Failed', PARTIALLY_PAID: 'Partially Paid', REFUNDED: 'Refunded',
};

const STATUS_STEPS = [
  { key: 'PENDING',          label: 'Order Placed',       Icon: ShoppingBag,   desc: 'Your order has been received' },
  { key: 'CONFIRMED',        label: 'Order Confirmed',    Icon: BadgeCheck,    desc: 'Order confirmed by our team' },
  { key: 'PROCESSING',       label: 'Processing',         Icon: RefreshCw,     desc: 'Preparing your order' },
  { key: 'PACKED',           label: 'Packed',             Icon: Package,       desc: 'Order securely packed' },
  { key: 'SHIPPED',          label: 'Shipped',            Icon: Truck,         desc: 'Handed over to courier' },
  { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery',   Icon: MapPin,        desc: 'Delivery agent on the way' },
  { key: 'DELIVERED',        label: 'Delivered',          Icon: CheckCircle2,  desc: 'Successfully delivered' },
];

const STEP_KEYS = STATUS_STEPS.map(s => s.key);

function fmtDate(d: string | Date) {
  return new Date(d).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function fmtShort(d: string | Date) {
  return new Date(d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function statusBadgeClass(status: string) {
  const map: Record<string, string> = {
    DELIVERED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    SHIPPED: 'bg-blue-50 text-blue-700 border-blue-200',
    OUT_FOR_DELIVERY: 'bg-blue-50 text-blue-700 border-blue-200',
    CANCELLED: 'bg-red-50 text-red-700 border-red-200',
    FAILED: 'bg-red-50 text-red-700 border-red-200',
    REFUNDED: 'bg-purple-50 text-purple-700 border-purple-200',
    PROCESSING: 'bg-amber-50 text-amber-700 border-amber-200',
    PACKED: 'bg-amber-50 text-amber-700 border-amber-200',
    PENDING: 'bg-slate-50 text-slate-600 border-slate-200',
    CONFIRMED: 'bg-sky-50 text-sky-700 border-sky-200',
  };
  return map[status] ?? 'bg-gray-50 text-gray-600 border-gray-200';
}

function paymentBadgeClass(status: string) {
  const map: Record<string, string> = {
    PAID: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    UNPAID: 'bg-orange-50 text-orange-600 border-orange-200',
    FAILED: 'bg-red-50 text-red-700 border-red-200',
    REFUNDED: 'bg-purple-50 text-purple-700 border-purple-200',
    PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
  };
  return map[status] ?? 'bg-gray-50 text-gray-500 border-gray-200';
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function TokenTrackingPage({ params }: { params: any }) {
  const { token } = await params;
  const result = await trackOrderByToken(token as string);
  if (!result.success || !result.order) notFound();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const order = result.order as any;
  // COMPLETED is not a visual step — treat it as DELIVERED (all steps done)
  const effectiveStatus = order.status === 'COMPLETED' ? 'DELIVERED' : order.status;
  const currentStepIndex = STEP_KEYS.indexOf(effectiveStatus);
  const isCancelled = ['CANCELLED', 'FAILED', 'RETURNED', 'REFUNDED'].includes(order.status);
  const grandTotal = Number(order.grandTotal ?? order.totalAmount ?? 0);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const items: any[] = order.items ?? [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const events: any[] = order.events ?? [];

  // Build a map: stepKey â†’ events that belong to this step
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const eventsByStep: Record<string, any[]> = {};
  for (const ev of events) {
    const key = ev.newStatus ?? ev.eventType;
    if (!eventsByStep[key]) eventsByStep[key] = [];
    eventsByStep[key].push(ev);
  }
  // COMPLETED events belong to the DELIVERED visual step
  if (eventsByStep['COMPLETED'] && !eventsByStep['DELIVERED']) {
    eventsByStep['DELIVERED'] = eventsByStep['COMPLETED'];
  }

  // Get first event timestamp for a step; PENDING falls back to order creation time
  function stepTime(key: string): string | null {
    const evs = eventsByStep[key];
    if (evs && evs.length > 0) return fmtDate(evs[0].createdAt);
    if (key === 'PENDING') return fmtDate(order.createdAt);
    return null;
  }

  return (
    <div className="min-h-screen bg-[#f4f6f9]">
      {/* â”€â”€ Sticky top bar â”€â”€ */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <Link href="/track-order" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 transition-colors font-medium shrink-0">
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back</span>
          </Link>
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center shadow shadow-blue-200 shrink-0">
              <Package className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-400 leading-none">Order Tracking</p>
              <p className="text-sm font-bold text-gray-900 font-mono truncate">{order.orderNumber}</p>
            </div>
          </div>
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border shrink-0 ${statusBadgeClass(order.status)}`}>
            {STATUS_LABELS[order.status] ?? order.status}
          </span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-5 space-y-4">

        {/* â”€â”€ Order Details Card â”€â”€ */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* top meta row */}
          <div className="px-5 py-3 bg-gradient-to-r from-blue-600 to-blue-500 flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-[10px] font-medium uppercase tracking-wider">Order Number</p>
              <p className="text-white font-bold font-mono text-base leading-tight">{order.orderNumber}</p>
            </div>
            <div className="text-right">
              <p className="text-blue-100 text-[10px] font-medium uppercase tracking-wider">Grand Total</p>
              <p className="text-white font-extrabold text-lg leading-tight">৳{grandTotal.toLocaleString()}</p>
            </div>
          </div>

          {/* info grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-5 pb-4">
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Customer</p>
              <p className="text-sm font-semibold text-gray-900">{order.customerName}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Payment</p>
              <div className="flex items-center gap-1.5">
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${paymentBadgeClass(order.paymentStatus)}`}>
                  {PAYMENT_LABELS[order.paymentStatus] ?? order.paymentStatus}
                </span>
              </div>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Method</p>
              <p className="text-sm font-semibold text-gray-700 capitalize">{(order.paymentMethod ?? 'â€”').replace(/_/g, ' ')}</p>
            </div>
            {order.estimatedDelivery && (
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Est. Delivery</p>
                <p className="text-sm font-semibold text-gray-700">{fmtShort(order.estimatedDelivery)}</p>
              </div>
            )}
            {order.district && (
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Destination</p>
                <p className="text-sm font-semibold text-gray-700">{order.district}, {order.division}</p>
              </div>
            )}
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Placed On</p>
              <p className="text-sm font-semibold text-gray-700">
                {new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          </div>

          {/* items */}
          {items.length > 0 && (
            <div className="border-t border-gray-100 px-5 py-3.5">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2.5">Items Ordered</p>
              <div className="space-y-2">
                {items.map((item: any) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
                  <div key={item.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-gray-800 truncate">{item.productName}</p>
                        <p className="text-[10px] text-gray-400">Qty {item.quantity} &times; &#2547;{Number(item.unitPrice).toLocaleString()}</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-gray-900 shrink-0 ml-3">
                      ৳{(Number(item.unitPrice) * item.quantity).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-2.5 border-t border-dashed border-gray-200 space-y-1">
                <div className="flex justify-between text-[11px] text-gray-400">
                  <span>Shipping</span><span>৳{Number(order.shippingCost ?? 0).toLocaleString()}</span>
                </div>
                {order.couponDiscount > 0 && (
                  <div className="flex justify-between text-[11px] text-emerald-600">
                    <span>Discount</span><span>-৳{Number(order.couponDiscount).toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-xs font-extrabold text-gray-900 pt-1">
                  <span>Total</span>
                  <span className="text-blue-600">৳{grandTotal.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* â”€â”€ Cancelled notice â”€â”€ */}
        {isCancelled && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-red-800">{STATUS_LABELS[order.status]}</p>
              {order.cancelReason && <p className="text-xs text-red-600 mt-0.5">{order.cancelReason}</p>}
            </div>
          </div>
        )}

        {/* Two-column: Delivery Progress | Activity Timeline */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Column headers */}
          <div className="grid grid-cols-2 border-b border-gray-100 bg-gray-50/70">
            <div className="px-5 py-3 flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Delivery Progress</span>
            </div>
            <div className="px-4 py-3 flex items-center gap-1.5 border-l border-gray-100">
              <Clock className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Activity Timeline</span>
            </div>
          </div>

          {/* One row per step */}
          <div className="px-4 py-4">
            {STATUS_STEPS.map(({ key, label, Icon, desc }, i) => {
              const isLast = i === STATUS_STEPS.length - 1;
              const done = !isCancelled && currentStepIndex >= i;
              // Last step: once reached it's done, never "in progress"
              const active = !isCancelled && !isLast && currentStepIndex === i;
              const time = stepTime(key);
              const stepEvents = eventsByStep[key] ?? []; // eslint-disable-line @typescript-eslint/no-explicit-any
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const eventNote = stepEvents.find((ev: any) => ev.note)?.note ?? null;

              return (
                <div key={key} className="grid grid-cols-2">
                  {/* LEFT: icon + connector + step label */}
                  <div className="flex gap-3 pr-4">
                    <div className="flex flex-col items-center">
                      <div className={`
                        relative z-10 w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all duration-500
                        ${active
                          ? 'bg-blue-600 shadow-lg shadow-blue-200 ring-4 ring-blue-50'
                          : done
                            ? 'bg-emerald-500 shadow-sm shadow-emerald-100'
                            : 'bg-white border-2 border-gray-200'}
                      `}>
                        <Icon className={`w-3.5 h-3.5 ${done ? 'text-white' : 'text-gray-300'}`} />
                        {active && (
                          <span className="absolute inset-0 rounded-full border-2 border-blue-400 animate-ping opacity-40" />
                        )}
                      </div>
                      {!isLast && (
                        <div className={`w-px mt-1 flex-1 min-h-[32px] transition-colors duration-500 ${done && !active ? 'bg-emerald-300' : 'bg-gray-200'}`} />
                      )}
                    </div>
                    <div className="pt-1.5 pb-5 min-w-0">
                      <p className={`text-sm font-semibold leading-tight ${done ? 'text-gray-900' : 'text-gray-400'}`}>
                        {label}
                      </p>
                      {active && (
                        <span className="inline-block mt-1 text-[10px] font-semibold text-blue-600 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded-full">
                          In Progress
                        </span>
                      )}
                    </div>
                  </div>

                  {/* RIGHT: activity note + timestamp */}
                  <div className="border-l border-gray-100 pl-4 pt-1.5 pb-5 min-w-0">
                    {done ? (
                      <>
                        <p className="text-xs font-medium text-gray-700 leading-snug">
                          {eventNote ?? desc}
                        </p>
                        {time && (
                          <p className="text-[10px] text-gray-400 mt-0.5 font-medium">{time}</p>
                        )}
                      </>
                    ) : (
                      <p className="text-xs text-gray-300">{desc}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="flex items-center justify-between bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <PhoneCall className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            Need help?
            <Link href="/contact" className="text-blue-600 font-semibold hover:underline">Contact Support</Link>
          </div>
          <p className="text-[10px] text-gray-300 font-mono hidden sm:block">
            {order.trackingToken?.slice(0, 16)}â€¦
          </p>
        </div>

      </div>
    </div>
  );
}
