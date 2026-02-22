import { NextRequest, NextResponse } from 'next/server';
import { rejectReview, bulkUpdateReviewStatus } from '@/lib/actions/review-actions';
import { requireAdmin } from '@/lib/auth/require-role';

export async function POST(request: NextRequest) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const body = await request.json();
    const { reviewId, reviewIds, adminNote } = body;

    // Bulk reject
    if (reviewIds && Array.isArray(reviewIds)) {
      const result = await bulkUpdateReviewStatus(reviewIds, 'REJECTED');
      return NextResponse.json(result);
    }

    // Single reject
    if (!reviewId) {
      return NextResponse.json({ error: 'reviewId is required' }, { status: 400 });
    }

    const result = await rejectReview(reviewId, adminNote);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
