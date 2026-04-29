import { NextRequest, NextResponse } from 'next/server';
import { mergeGuestOrdersToUser } from '@/lib/actions/order-actions';
import { createServerClient } from '@/lib/supabase-server';

/**
 * POST /api/account/merge-orders
 * Called after a new user registers to attach existing guest orders.
 * Body: { userId, email?, phone? }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { userId, email, phone } = await request.json();

    if (!userId || userId !== user.id) {
      return NextResponse.json({ success: false, error: 'Invalid user' }, { status: 403 });
    }

    const result = await mergeGuestOrdersToUser(user.id, email || user.email, phone);
    return NextResponse.json(result);
  } catch (error) {
    console.error('merge-orders error:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
