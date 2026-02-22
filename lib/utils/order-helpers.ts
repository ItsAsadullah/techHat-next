/**
 * Pure order utility constants and helper functions.
 * NO 'use server' — safe to import in client components, server components, route handlers, and server actions.
 */

// ─── STATE MACHINE ─────────────────────────────────────────────────────────────

export const ORDER_STATUS_TRANSITIONS: Record<string, string[]> = {
  DRAFT:             ['PENDING_PAYMENT', 'PENDING', 'CANCELLED'],
  PENDING_PAYMENT:   ['PENDING', 'CONFIRMED', 'FAILED', 'CANCELLED'],
  PENDING:           ['CONFIRMED', 'CANCELLED', 'FAILED'],
  CONFIRMED:         ['PROCESSING', 'CANCELLED'],
  PROCESSING:        ['PACKED', 'CANCELLED'],
  PACKED:            ['SHIPPED', 'CANCELLED'],
  SHIPPED:           ['OUT_FOR_DELIVERY'],
  OUT_FOR_DELIVERY:  ['DELIVERED'],
  DELIVERED:         ['COMPLETED', 'REFUND_REQUESTED'],
  COMPLETED:         ['REFUND_REQUESTED'],
  CANCELLED:         [],
  REFUND_REQUESTED:  ['REFUNDED', 'CONFIRMED'],
  REFUNDED:          [],
  FAILED:            [],
  RETURNED:          ['REFUNDED'],
};

export const PAYMENT_STATUS_TRANSITIONS: Record<string, string[]> = {
  UNPAID:         ['PENDING', 'PAID', 'FAILED'],
  PENDING:        ['PAID', 'FAILED'],
  PAID:           ['PARTIALLY_PAID', 'REFUNDED'],
  FAILED:         ['PENDING', 'PAID'],
  PARTIALLY_PAID: ['PAID', 'REFUNDED'],
  REFUNDED:       [],
};

// ─── LABELS & COLORS ──────────────────────────────────────────────────────────

export const ORDER_STATUS_LABELS: Record<string, string> = {
  DRAFT:             'Draft',
  PENDING_PAYMENT:   'Pending Payment',
  PENDING:           'Pending',
  CONFIRMED:         'Confirmed',
  PROCESSING:        'Processing',
  PACKED:            'Packed',
  SHIPPED:           'Shipped',
  OUT_FOR_DELIVERY:  'Out for Delivery',
  DELIVERED:         'Delivered',
  COMPLETED:         'Completed',
  CANCELLED:         'Cancelled',
  REFUND_REQUESTED:  'Refund Requested',
  REFUNDED:          'Refunded',
  FAILED:            'Failed',
  RETURNED:          'Returned',
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  UNPAID:         'Unpaid',
  PENDING:        'Pending',
  PAID:           'Paid',
  FAILED:         'Failed',
  PARTIALLY_PAID: 'Partially Paid',
  REFUNDED:       'Refunded',
};

export const STATUS_COLORS: Record<string, string> = {
  DRAFT:             'bg-gray-100 text-gray-600',
  PENDING_PAYMENT:   'bg-yellow-100 text-yellow-700',
  PENDING:           'bg-amber-100 text-amber-700',
  CONFIRMED:         'bg-blue-100 text-blue-700',
  PROCESSING:        'bg-indigo-100 text-indigo-700',
  PACKED:            'bg-cyan-100 text-cyan-700',
  SHIPPED:           'bg-sky-100 text-sky-700',
  OUT_FOR_DELIVERY:  'bg-purple-100 text-purple-700',
  DELIVERED:         'bg-green-100 text-green-700',
  COMPLETED:         'bg-emerald-100 text-emerald-700',
  CANCELLED:         'bg-red-100 text-red-700',
  REFUND_REQUESTED:  'bg-orange-100 text-orange-700',
  REFUNDED:          'bg-rose-100 text-rose-700',
  FAILED:            'bg-red-100 text-red-600',
  RETURNED:          'bg-slate-100 text-slate-600',
};

export const PAYMENT_COLORS: Record<string, string> = {
  UNPAID:         'bg-gray-100 text-gray-600',
  PENDING:        'bg-yellow-100 text-yellow-700',
  PAID:           'bg-green-100 text-green-700',
  FAILED:         'bg-red-100 text-red-700',
  PARTIALLY_PAID: 'bg-orange-100 text-orange-700',
  REFUNDED:       'bg-purple-100 text-purple-700',
};

// ─── PURE HELPER FUNCTIONS ────────────────────────────────────────────────────

export function calculateShippingCost(division: string): number {
  return ['Dhaka', 'dhaka'].includes(division) ? 60 : 120;
}

export function calculateEstimatedDelivery(division: string): Date {
  const days = ['Dhaka', 'dhaka'].includes(division) ? 2 : 5;
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

export function canTransitionStatus(from: string, to: string): boolean {
  return (ORDER_STATUS_TRANSITIONS[from] ?? []).includes(to);
}

export function canTransitionPayment(from: string, to: string): boolean {
  return (PAYMENT_STATUS_TRANSITIONS[from] ?? []).includes(to);
}

export function getAllowedTransitions(currentStatus: string): string[] {
  return ORDER_STATUS_TRANSITIONS[currentStatus] ?? [];
}
