import { NextRequest, NextResponse } from 'next/server';
import { validateOrderStock } from '@/lib/actions/order-actions';

/**
 * POST /api/orders/validate-stock
 * Pre-checkout stock revalidation (called before placing order)
 */
export async function POST(request: NextRequest) {
  try {
    const { items } = await request.json();

    if (!Array.isArray(items) || !items.length) {
      return NextResponse.json({ success: false, error: 'items array required' }, { status: 400 });
    }

    const result = await validateOrderStock(items);
    return NextResponse.json(result);
  } catch (error) {
    console.error('validate-stock error:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
