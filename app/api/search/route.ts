import { NextRequest, NextResponse } from 'next/server';
import { searchProducts } from '@/lib/actions/homepage-actions';

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q') || '';
  if (q.length < 2) {
    return NextResponse.json({ products: [], categories: [] });
  }
  const results = await searchProducts(q, 8);
  return NextResponse.json(results);
}
