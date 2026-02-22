import { NextRequest, NextResponse } from 'next/server';
import { createReview } from '@/lib/actions/review-actions';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { productId, userId, name, email, rating, reviewText, images } = body;

    const result = await createReview({
      productId,
      userId,
      name,
      email,
      rating: Number(rating),
      reviewText,
      images,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
