import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { prisma } from '@/lib/prisma';

const db = prisma as any;
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function PATCH(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { fullName, phone, avatarUrl } = body;

    await db.user.upsert({
      where: { id: user.id },
      update: {
        fullName: fullName || undefined,
        phone: phone || undefined,
        avatarUrl: avatarUrl || undefined,
      },
      create: {
        id: user.id,
        email: user.email!,
        fullName: fullName || null,
        phone: phone || null,
        avatarUrl: avatarUrl || null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('Profile update error:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
