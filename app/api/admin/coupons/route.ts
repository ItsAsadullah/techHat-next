import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth/require-role';

interface CouponRow {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  min_order_amount: number;
  usage_limit: number;
  used_count: number;
  expires_at: Date | null;
  is_active: boolean;
}

export async function GET() {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const coupons = await prisma.$queryRaw<CouponRow[]>`
      SELECT id, code, discount_type, discount_value, min_order_amount,
             usage_limit, used_count, expires_at, is_active
      FROM coupons
      ORDER BY is_active DESC, code ASC
    `;
    return NextResponse.json(coupons);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const body = await req.json();
    const {
      code,
      discount_type,
      discount_value,
      min_order_amount = 0,
      usage_limit = 100,
      expires_at,
    } = body;

    if (!code?.trim()) {
      return NextResponse.json({ error: 'Coupon code is required' }, { status: 400 });
    }
    if (!['PERCENTAGE', 'FLAT'].includes(discount_type)) {
      return NextResponse.json({ error: 'Invalid discount type' }, { status: 400 });
    }

    const expiresAtValue = expires_at ? new Date(expires_at) : null;
    const upperCode = code.toUpperCase().trim();

    const [coupon] = await prisma.$queryRaw<CouponRow[]>`
      INSERT INTO coupons (id, code, discount_type, discount_value, min_order_amount, usage_limit, used_count, expires_at, is_active)
      VALUES (gen_random_uuid(), ${upperCode}, ${discount_type}, ${Number(discount_value)}, ${Number(min_order_amount)}, ${Number(usage_limit)}, 0, ${expiresAtValue}, true)
      RETURNING id, code, discount_type, discount_value, min_order_amount, usage_limit, used_count, expires_at, is_active
    `;
    return NextResponse.json(coupon, { status: 201 });
  } catch (e: any) {
    if (e.message?.includes('unique') || e.message?.includes('duplicate')) {
      return NextResponse.json({ error: 'Coupon code already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
