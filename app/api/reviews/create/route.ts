import { NextRequest, NextResponse } from 'next/server';
import { createReview } from '@/lib/actions/review-actions';
import { checkIpRateLimit, getClientIp } from '@/lib/utils/fraud';

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rateCheck = await checkIpRateLimit(ip, 'review_create', { windowMinutes: 60, maxRequests: 5 });
    if (!rateCheck.allowed) {
      return NextResponse.json({ error: 'Too many reviews. Please try again later.' }, { status: 429 });
    }

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
