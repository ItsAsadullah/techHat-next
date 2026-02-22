import { NextRequest, NextResponse } from 'next/server';
import { deleteReview, bulkDeleteReviews } from '@/lib/actions/review-actions';
import { requireAdmin } from '@/lib/auth/require-role';

export async function DELETE(request: NextRequest) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const body = await request.json();
    const { reviewId, reviewIds } = body;

    // Bulk delete
    if (reviewIds && Array.isArray(reviewIds)) {
      const result = await bulkDeleteReviews(reviewIds);
      return NextResponse.json(result);
    }

    // Single delete
    if (!reviewId) {
      return NextResponse.json({ error: 'reviewId is required' }, { status: 400 });
    }

    const result = await deleteReview(reviewId);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
