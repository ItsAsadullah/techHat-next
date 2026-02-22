import { NextRequest, NextResponse } from 'next/server';
import { trackOrderByNumberAndPhone } from '@/lib/actions/order-actions';
import { checkIpRateLimit } from '@/lib/utils/fraud';

/**
 * POST /api/orders/track
 * Public: find order by order_number + phone
 */
export async function POST(request: NextRequest) {
  try {
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      '0.0.0.0';

    // Rate limit tracking requests (10 per 5 min per IP)
    const rateCheck = await checkIpRateLimit(ip, 'track', { windowMinutes: 5, maxRequests: 10 });
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many tracking requests. Please wait.' },
        { status: 429 }
      );
    }

    const { orderNumber, phone } = await request.json();

    if (!orderNumber?.trim() || !phone?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Order number and phone number are required.' },
        { status: 400 }
      );
    }

    const result = await trackOrderByNumberAndPhone(orderNumber, phone);

    if (result.success) {
      return NextResponse.json(result);
    }

    // Return 404 but with generic message for security
    return NextResponse.json(
      { success: false, error: 'No order found. Please check your order number and phone.' },
      { status: 404 }
    );
  } catch (error) {
    console.error('Track order API error:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
