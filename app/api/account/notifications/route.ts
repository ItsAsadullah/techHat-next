import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthContext } from '@/lib/auth/require-role';

const DEFAULTS: Record<string, boolean> = {
  order_placed: true,
  order_shipped: true,
  order_delivered: true,
  order_cancelled: true,
  flash_sale: false,
  new_arrivals: false,
  price_drop: false,
  review_req: false,
  security: true,
};
const ALLOWED_KEYS = new Set(Object.keys(DEFAULTS));

export async function GET() {
  const auth = await getAuthContext();
  if (auth.error) return auth.error;
  if (!auth.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const stored = await prisma.notificationPreference.findUnique({ where: { userId: auth.user.id } });
  return NextResponse.json({ preferences: { ...DEFAULTS, ...(stored?.settings as object ?? {}) } });
}

export async function PUT(request: NextRequest) {
  const auth = await getAuthContext();
  if (auth.error) return auth.error;
  if (!auth.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await request.json();
  const input = body?.preferences;
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return NextResponse.json({ error: 'Invalid preferences.' }, { status: 400 });
  }

  const settings = { ...DEFAULTS };
  for (const [key, value] of Object.entries(input)) {
    if (ALLOWED_KEYS.has(key) && typeof value === 'boolean') settings[key] = value;
  }
  await prisma.notificationPreference.upsert({
    where: { userId: auth.user.id },
    update: { settings },
    create: { userId: auth.user.id, settings },
  });
  return NextResponse.json({ preferences: settings });
}
