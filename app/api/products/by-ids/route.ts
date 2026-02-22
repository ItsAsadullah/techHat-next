import { NextRequest, NextResponse } from 'next/server';
import { getProductsByIds } from '@/lib/actions/homepage-actions';

export async function GET(request: NextRequest) {
  const idsParam = request.nextUrl.searchParams.get('ids') || '';
  const ids = idsParam.split(',').filter(Boolean);
  if (!ids.length) {
    return NextResponse.json({ products: [] });
  }
  const products = await getProductsByIds(ids.slice(0, 20));
  return NextResponse.json({ products });
}
