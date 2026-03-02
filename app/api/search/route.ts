import { NextRequest, NextResponse } from 'next/server';
import { searchProducts } from '@/lib/actions/homepage-actions';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q') || '';
  if (q.length < 2) {
    return NextResponse.json({ products: [], categories: [] }, {
      headers: { 'Cache-Control': 'no-store' },
    });
  }
  const results = await searchProducts(q, 8);
  return NextResponse.json(results, {
    headers: {
      // Cache identical queries in CDN/browser for 60s, serve stale for 5min
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
    },
  });
}
