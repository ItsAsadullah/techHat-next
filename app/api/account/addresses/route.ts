import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthContext } from '@/lib/auth/require-role';

const ADDRESS_TYPES = new Set(['home', 'work', 'other']);

function parseAddress(body: Record<string, unknown>) {
  const type = typeof body.type === 'string' && ADDRESS_TYPES.has(body.type) ? body.type : 'home';
  const data = {
    label: typeof body.label === 'string' ? body.label.trim().slice(0, 80) || null : null,
    type,
    name: typeof body.name === 'string' ? body.name.trim().slice(0, 120) : '',
    phone: typeof body.phone === 'string' ? body.phone.trim().slice(0, 30) : '',
    address: typeof body.address === 'string' ? body.address.trim().slice(0, 500) : '',
    division: typeof body.division === 'string' ? body.division.trim().slice(0, 80) : '',
    district: typeof body.district === 'string' ? body.district.trim().slice(0, 80) : '',
    upazila: typeof body.upazila === 'string' ? body.upazila.trim().slice(0, 80) || null : null,
    isDefault: body.isDefault === true,
  };
  return data;
}

export async function GET() {
  const auth = await getAuthContext();
  if (auth.error || !auth.user) return auth.error;

  const addresses = await prisma.customerAddress.findMany({
    where: { userId: auth.user.id },
    orderBy: [{ isDefault: 'desc' }, { updatedAt: 'desc' }],
  });
  return NextResponse.json({ addresses });
}

export async function POST(request: NextRequest) {
  const auth = await getAuthContext();
  if (auth.error || !auth.user) return auth.error;

  const data = parseAddress(await request.json());
  if (!data.name || !data.phone || !data.address || !data.division || !data.district) {
    return NextResponse.json({ error: 'Required address fields are missing.' }, { status: 400 });
  }

  const count = await prisma.customerAddress.count({ where: { userId: auth.user.id } });
  const makeDefault = data.isDefault || count === 0;
  const address = await prisma.$transaction(async (tx) => {
    if (makeDefault) {
      await tx.customerAddress.updateMany({
        where: { userId: auth.user!.id },
        data: { isDefault: false },
      });
    }
    return tx.customerAddress.create({
      data: { ...data, isDefault: makeDefault, userId: auth.user!.id },
    });
  });
  return NextResponse.json({ address }, { status: 201 });
}
