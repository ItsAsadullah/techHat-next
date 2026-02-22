import { NextRequest, NextResponse } from 'next/server';
import { getOrderById } from '@/lib/actions/order-actions';
import { supabaseServer } from '@/lib/supabase-server';

/**
 * GET /api/orders/[id]  — Admin: fetch full order detail
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await getOrderById(id);

    if (!result.success) {
      return NextResponse.json(result, { status: 404 });
    }
    return NextResponse.json(result);
  } catch (error) {
    console.error('GET /api/orders/[id] error:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
