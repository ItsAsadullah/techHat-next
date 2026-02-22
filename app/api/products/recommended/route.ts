import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const PRODUCT_FIELDS = {
  id: true,
  name: true,
  slug: true,
  price: true,
  offerPrice: true,
  costPrice: true,
  stock: true,
  images: true,
  isFeatured: true,
  isFlashSale: true,
  isBestSeller: true,
  viewCount: true,
  soldCount: true,
  discountPercentage: true,
  flashSaleEndTime: true,
  createdAt: true,
  category: { select: { name: true, slug: true } },
  brand: { select: { name: true } },
  _count: { select: { reviews: { where: { status: 'APPROVED' as const } }, orderItems: true } },
} as const;

function mapToResponse(p: any, thumbUrl: string) {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    price: p.price,
    offerPrice: p.offerPrice,
    costPrice: p.costPrice,
    stock: p.stock,
    images: p.images || [],
    thumbnailUrl: thumbUrl || p.images?.[0] || '',
    categoryName: p.category?.name || '',
    categorySlug: p.category?.slug || '',
    brandName: p.brand?.name || null,
    rating: 0,
    reviewCount: p._count?.reviews ?? 0,
    isFeatured: p.isFeatured,
    isFlashSale: p.isFlashSale,
    isBestSeller: p.isBestSeller ?? false,
    viewCount: p.viewCount ?? 0,
    soldCount: p.soldCount ?? 0,
    discountPercentage: p.discountPercentage ?? null,
    flashSaleEndTime: p.flashSaleEndTime?.toISOString() ?? null,
    createdAt: p.createdAt.toISOString(),
  };
}

export async function GET(request: NextRequest) {
  const viewedParam = request.nextUrl.searchParams.get('viewed') || '';
  const viewedIds = viewedParam.split(',').filter(Boolean);

  try {
    let categoryIds: string[] = [];

    if (viewedIds.length > 0) {
      const viewedProducts = await prisma.product.findMany({
        where: { id: { in: viewedIds } },
        select: { categoryId: true },
      });
      categoryIds = [...new Set(viewedProducts.map((p) => p.categoryId))];
    }

    if (categoryIds.length > 0) {
      const products = await prisma.product.findMany({
        where: {
          isActive: true,
          categoryId: { in: categoryIds },
          id: { notIn: viewedIds },
        },
        select: PRODUCT_FIELDS,
        orderBy: { soldCount: 'desc' },
        take: 10,
      });

      const productIds = products.map((p) => p.id);
      const thumbs = await prisma.productImage.findMany({
        where: { productId: { in: productIds } },
        orderBy: { displayOrder: 'asc' },
        select: { productId: true, url: true },
        distinct: ['productId'],
      });
      const thumbMap = new Map(thumbs.map((t) => [t.productId, t.url]));

      return NextResponse.json({
        products: products.map((p) => mapToResponse(p, thumbMap.get(p.id) || '')),
      });
    }

    // Fallback: featured/popular products
    const products = await prisma.product.findMany({
      where: { isActive: true, OR: [{ isFeatured: true }, { soldCount: { gt: 0 } }] },
      select: PRODUCT_FIELDS,
      orderBy: { soldCount: 'desc' },
      take: 10,
    });

    const productIds = products.map((p) => p.id);
    const thumbs = await prisma.productImage.findMany({
      where: { productId: { in: productIds } },
      orderBy: { displayOrder: 'asc' },
      select: { productId: true, url: true },
      distinct: ['productId'],
    });
    const thumbMap = new Map(thumbs.map((t) => [t.productId, t.url]));

    return NextResponse.json({
      products: products.map((p) => mapToResponse(p, thumbMap.get(p.id) || '')),
    });
  } catch (error) {
    console.error('Recommended products error:', error);
    return NextResponse.json({ products: [] });
  }
}
