import { NextRequest, NextResponse } from 'next/server';
import { getProductReviews, getProductReviewStats } from '@/lib/actions/review-actions';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('product_id');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const statsOnly = searchParams.get('stats') === 'true';

    if (!productId) {
      return NextResponse.json({ error: 'product_id is required' }, { status: 400 });
    }

    if (statsOnly) {
      const result = await getProductReviewStats(productId);
      return NextResponse.json(result);
    }

    const result = await getProductReviews(productId, page, limit);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
