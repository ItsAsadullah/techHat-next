import { NextRequest, NextResponse } from 'next/server';
import { placeOrder, PlaceOrderInput } from '@/lib/actions/order-actions';
import { checkIpRateLimit, detectOrderFraud, getClientIp } from '@/lib/utils/fraud';

export async function POST(request: NextRequest) {
  try {
    // ── 1. Extract real client IP (Cloudflare-aware, proxy-count-aware) ──
    const ip = getClientIp(request);

    // ── 2. IP-based rate limit: 10 orders / IP / hour ──
    const rateCheck = await checkIpRateLimit(ip, 'order_create', { windowMinutes: 60, maxRequests: 10 });
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many orders from this IP. Please try again later.' },
        { status: 429 }
      );
    }

    const body: PlaceOrderInput = await request.json();

    // ── 3. Basic required field validation before hitting DB ──
    if (!body.customerName || !body.customerPhone || !body.shippingAddress || !body.items?.length) {
      return NextResponse.json(
        { success: false, error: 'Please fill in all required fields.' },
        { status: 400 }
      );
    }

    // ── 4. Behavioural fraud detection (velocity by phone / email) ──
    const fraudCheck = await detectOrderFraud({
      ip,
      phone: body.customerPhone,
      email: body.customerEmail,
    });
    if (fraudCheck.isSuspicious) {
      console.warn('[fraud] Suspicious order blocked:', { ip, phone: body.customerPhone, reason: fraudCheck.reason });
      return NextResponse.json(
        { success: false, error: 'Your order could not be processed. Please contact support.' },
        { status: 429 }
      );
    }

    // ── 5. Inject IP for logging / fraud tracking ──
    body.ipAddress = ip;

    // ── 6. placeOrder: server-side price, stock, coupon validation ──
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
