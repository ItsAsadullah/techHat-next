import { NextRequest, NextResponse } from 'next/server';
import { getAdminReviews } from '@/lib/actions/review-actions';
import { requireAdmin } from '@/lib/auth/require-role';

export async function GET(request: NextRequest) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    
    const status = searchParams.get('status') as 'PENDING' | 'APPROVED' | 'REJECTED' | null;
    const isVerified = searchParams.get('verified') === 'true' ? true : undefined;
    const productId = searchParams.get('product_id') || undefined;
    const search = searchParams.get('search') || undefined;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const result = await getAdminReviews({
      status: status || undefined,
      isVerified,
      productId,
      search,
      page,
      limit,
    });

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
