import { NextRequest, NextResponse } from 'next/server';
import { trackOrderByToken } from '@/lib/actions/order-actions';

/**
 * GET /api/orders/token/[token]
 * Public: track order by secure UUID tracking_token
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    if (!token || token.length < 10) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 400 });
    }

    const result = await trackOrderByToken(token);

    if (result.success) {
      return NextResponse.json(result);
    }

    return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
  } catch (error) {
    console.error('Token track API error:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
