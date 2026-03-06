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

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const { id } = await params;
    const body = await req.json();
    const {
      code,
      discount_type,
      discount_value,
      min_order_amount = 0,
      usage_limit = 100,
      expires_at,
      is_active,
    } = body;

    const upperCode = code.toUpperCase().trim();
    const expiresAtValue = expires_at ? new Date(expires_at) : null;

    const [updated] = await prisma.$queryRaw<CouponRow[]>`
      UPDATE coupons
      SET code = ${upperCode},
          discount_type = ${discount_type},
          discount_value = ${Number(discount_value)},
          min_order_amount = ${Number(min_order_amount)},
          usage_limit = ${Number(usage_limit)},
          expires_at = ${expiresAtValue},
          is_active = ${Boolean(is_active)}
      WHERE id = ${id}::uuid
      RETURNING id, code, discount_type, discount_value, min_order_amount, usage_limit, used_count, expires_at, is_active
    `;

    if (!updated) {
      return NextResponse.json({ error: 'Coupon not found' }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const { id } = await params;
    await prisma.$executeRaw`DELETE FROM coupons WHERE id = ${id}::uuid`;
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
