import { NextRequest, NextResponse } from 'next/server';
import { placeOrder, PlaceOrderInput } from '@/lib/actions/order-actions';
import { checkIpRateLimit } from '@/lib/utils/fraud';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting / fraud prevention
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      '0.0.0.0';

    const rateCheck = await checkIpRateLimit(ip, 'order_create', { windowMinutes: 60, maxRequests: 10 });
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many orders from this IP. Please try again later.' },
        { status: 429 }
      );
    }

    const body: PlaceOrderInput = await request.json();

    // Basic required field validation before hitting DB
    if (!body.customerName || !body.customerPhone || !body.shippingAddress || !body.items?.length) {
      return NextResponse.json(
        { success: false, error: 'Please fill in all required fields.' },
        { status: 400 }
      );
    }

    // Inject IP for logging / fraud tracking
    body.ipAddress = ip;

    // placeOrder does comprehensive server-side price, stock, and coupon validation
    const result = await placeOrder(body);

    if (result.success) {
      return NextResponse.json(result, { status: 201 });
    }

    return NextResponse.json(result, { status: 400 });
  } catch (error) {
    console.error('Order API error:', error);
    return NextResponse.json(
      { success: false, error: 'Server error. Please try again.' },
      { status: 500 }
    );
  }
}
