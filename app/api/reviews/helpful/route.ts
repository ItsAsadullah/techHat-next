import { NextRequest, NextResponse } from 'next/server';
import { toggleHelpful } from '@/lib/actions/review-actions';
import { checkIpRateLimit, getClientIp } from '@/lib/utils/fraud';

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rateCheck = await checkIpRateLimit(ip, 'review_helpful', { windowMinutes: 10, maxRequests: 30 });
    if (!rateCheck.allowed) {
      return NextResponse.json({ error: 'Too many votes. Please try again later.' }, { status: 429 });
    }

    const body = await request.json();
    const { reviewId } = body;

    if (!reviewId) {
      return NextResponse.json({ error: 'reviewId is required' }, { status: 400 });
    }

    // Get user IP
    const result = await toggleHelpful(reviewId, ip);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
