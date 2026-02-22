import { NextRequest, NextResponse } from 'next/server';
import { mergeGuestOrdersToUser } from '@/lib/actions/order-actions';

/**
 * POST /api/account/merge-orders
 * Called after a new user registers to attach existing guest orders.
 * Body: { userId, email?, phone? }
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, email, phone } = await request.json();

    if (!userId) {
      return NextResponse.json({ success: false, error: 'userId is required' }, { status: 400 });
    }

    const result = await mergeGuestOrdersToUser(userId, email, phone);
    return NextResponse.json(result);
  } catch (error) {
    console.error('merge-orders error:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
