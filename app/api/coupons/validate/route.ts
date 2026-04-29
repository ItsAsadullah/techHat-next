import { NextRequest, NextResponse } from 'next/server';
import { validateCouponServer } from '@/lib/actions/order-actions';
import { checkIpRateLimit, getClientIp } from '@/lib/utils/fraud';

// Uses the shared validateCouponServer (DB-first + static fallback)
// so UI validation and actual order placement always use the same logic.

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rateCheck = await checkIpRateLimit(ip, 'coupon_validate', { windowMinutes: 10, maxRequests: 20 });
    if (!rateCheck.allowed) {
      return NextResponse.json({ valid: false, message: 'Too many attempts. Please try again later.' }, { status: 429 });
    }

    const body = await req.json();
    const code: string = (body.code ?? '').trim().toUpperCase();
    const subtotal: number = Number(body.subtotal ?? 0);

    if (!code) {
      return NextResponse.json({ valid: false, message: 'কুপন কোড প্রয়োজন' }, { status: 400 });
    }

    const result = await validateCouponServer(code, subtotal);

    if (result.valid) {
      return NextResponse.json({ valid: true, discount: result.discount, message: 'কুপন সফলভাবে প্রয়োগ হয়েছে' });
    }

    return NextResponse.json({ valid: false, message: result.error ?? 'কুপন কোডটি বৈধ নয়' });
  } catch {
    return NextResponse.json(
      { valid: false, message: 'কুপন যাচাই করতে ব্যর্থ হয়েছে' },
      { status: 500 }
    );
  }
}
