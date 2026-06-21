import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthContext } from '@/lib/auth/require-role';

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await getAuthContext();
  if (auth.error) return auth.error;
  if (!auth.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await context.params;
  const body = await request.json();

  const existing = await prisma.customerAddress.findFirst({ where: { id, userId: auth.user.id } });
  if (!existing) return NextResponse.json({ error: 'Address not found.' }, { status: 404 });

  const data = {
    label: typeof body.label === 'string' ? body.label.trim().slice(0, 80) || null : existing.label,
    type: ['home', 'work', 'other'].includes(body.type) ? body.type : existing.type,
    name: typeof body.name === 'string' ? body.name.trim().slice(0, 120) : existing.name,
    phone: typeof body.phone === 'string' ? body.phone.trim().slice(0, 30) : existing.phone,
    address: typeof body.address === 'string' ? body.address.trim().slice(0, 500) : existing.address,
    division: typeof body.division === 'string' ? body.division.trim().slice(0, 80) : existing.division,
    district: typeof body.district === 'string' ? body.district.trim().slice(0, 80) : existing.district,
    upazila: typeof body.upazila === 'string' ? body.upazila.trim().slice(0, 80) || null : existing.upazila,
    isDefault: body.isDefault === true ? true : existing.isDefault,
  };

  const updated = await prisma.$transaction(async (tx) => {
    if (data.isDefault) {
      await tx.customerAddress.updateMany({
        where: { userId: auth.user!.id, id: { not: id } },
        data: { isDefault: false },
      });
    }
    return tx.customerAddress.update({ where: { id }, data });
  });
  return NextResponse.json({ address: updated });
}

export async function DELETE(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await getAuthContext();
  if (auth.error) return auth.error;
  if (!auth.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await context.params;

  const existing = await prisma.customerAddress.findFirst({ where: { id, userId: auth.user.id } });
  if (!existing) return NextResponse.json({ error: 'Address not found.' }, { status: 404 });

  await prisma.$transaction(async (tx) => {
    await tx.customerAddress.delete({ where: { id } });
    if (existing.isDefault) {
      const replacement = await tx.customerAddress.findFirst({
        where: { userId: auth.user!.id },
        orderBy: { updatedAt: 'desc' },
      });
      if (replacement) {
        await tx.customerAddress.update({ where: { id: replacement.id }, data: { isDefault: true } });
      }
    }
  });
  return NextResponse.json({ success: true });
}
