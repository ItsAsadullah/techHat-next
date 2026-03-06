import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const rows = await prisma.setting.findMany({
      where: { category: 'shipping' },
    });
    const map: Record<string, string> = {};
    rows.forEach((r) => { map[r.key] = r.value; });

    return NextResponse.json({
      dhaka: Number(map.shippingDhaka) || 60,
      outside: Number(map.shippingOutsideDhaka) || 120,
      freeThreshold: Number(map.freeDeliveryThreshold) || 0,
    });
  } catch {
    return NextResponse.json({ dhaka: 60, outside: 120, freeThreshold: 0 });
  }
}
