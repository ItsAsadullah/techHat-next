import { NextRequest, NextResponse } from 'next/server';
import { searchProducts } from '@/lib/actions/homepage-actions';
import { checkIpRateLimit, getClientIp } from '@/lib/utils/fraud';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q') || '';
  if (q.trim().length < 1) {
    return NextResponse.json({ products: [], categories: [] }, {
      headers: { 'Cache-Control': 'no-store' },
    });
  }
  const ip = getClientIp(request);
  const rateCheck = await checkIpRateLimit(ip, 'text_search', { windowMinutes: 1, maxRequests: 60 });
  if (!rateCheck.allowed) {
    return NextResponse.json({ products: [], categories: [], error: 'Too many searches. Please try again later.' }, { status: 429 });
  }
  const results = await searchProducts(q, 20);
  return NextResponse.json(results, {
    headers: {
      // Cache identical queries in CDN/browser for 60s, serve stale for 5min
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
    },
  });
}
