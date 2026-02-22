import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth/require-role';

export async function GET() {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const staff = await prisma.staff.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(staff);
  } catch (e) {
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(req: NextRequest) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const body = await req.json();
    const member = await prisma.staff.create({
      data: {
        name: body.name,
        phone: body.phone,
        email: body.email || null,
        role: body.role || null,
        baseSalary: body.baseSalary || 0,
        address: body.address || null,
        isActive: body.isActive ?? true,
      },
    });
    return NextResponse.json(member, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
