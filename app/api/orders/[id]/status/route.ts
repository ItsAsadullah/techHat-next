import { NextRequest, NextResponse } from 'next/server';
import {
  updateOrderStatus,
  updatePaymentStatus,
  setOrderInternalNote,
  cancelOrder,
} from '@/lib/actions/order-actions';
import {
  getAllowedTransitions,
  ORDER_STATUS_LABELS,
} from '@/lib/utils/order-helpers';

/**
 * PATCH /api/orders/[id]/status
 * Admin: update order status, payment status, or internal note.
 * 
 * Body: { action, status?, paymentStatus?, note?, cancelReason?, changedBy?, refundAmount? }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const { action, status, paymentStatus, note, cancelReason, changedBy, refundAmount } = body;

    switch (action) {
      case 'update_status': {
        if (!status) {
          return NextResponse.json({ success: false, error: 'status is required' }, { status: 400 });
        }
        const result = await updateOrderStatus(id, status, { note, cancelReason, changedBy, refundAmount });
        return NextResponse.json(result, { status: result.success ? 200 : 400 });
      }

      case 'update_payment': {
        if (!paymentStatus) {
          return NextResponse.json({ success: false, error: 'paymentStatus is required' }, { status: 400 });
        }
        const result = await updatePaymentStatus(id, paymentStatus, { note, changedBy });
        return NextResponse.json(result, { status: result.success ? 200 : 400 });
      }

      case 'cancel': {
        const result = await cancelOrder(id, { reason: cancelReason || note, changedBy });
        return NextResponse.json(result, { status: result.success ? 200 : 400 });
      }

      case 'add_note': {
        if (!note) {
          return NextResponse.json({ success: false, error: 'note is required' }, { status: 400 });
        }
        const result = await setOrderInternalNote(id, note, changedBy);
        return NextResponse.json(result, { status: result.success ? 200 : 400 });
      }

      default:
        return NextResponse.json(
          { success: false, error: `Unknown action: ${action}. Use: update_status, update_payment, cancel, add_note` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('PATCH /api/orders/[id]/status error:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}

/**
 * GET /api/orders/[id]/status
 * Returns the allowed next status transitions for an order.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { prisma }  = await import('@/lib/prisma');
    const db = prisma as any;
    const order = await db.order.findUnique({
      where: { id },
      select: { status: true, paymentStatus: true },
    });
    if (!order) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });

    const allowed = getAllowedTransitions(order.status).map((s) => ({
      value: s,
      label: ORDER_STATUS_LABELS[s] ?? s,
    }));

    return NextResponse.json({ success: true, currentStatus: order.status, currentPaymentStatus: order.paymentStatus, allowed });
  } catch (error) {
    console.error('GET /api/orders/[id]/status error:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
