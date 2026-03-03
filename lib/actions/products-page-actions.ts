'use server';

import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import type { CategoryProduct, SortOption } from '@/lib/types/category-page';

const PER_PAGE = 24;

const PRODUCT_SELECT = {
  id: true,
  name: true,
  slug: true,
  price: true,
  offerPrice: true,
  discountPercentage: true,
  stock: true,
  minStock: true,
  isFeatured: true,
  isFlashSale: true,
  isBestSeller: true,
  soldCount: true,
  viewCount: true,
  shortDesc: true,
  images: true,
  warrantyMonths: true,
  warrantyType: true,
  specifications: true,
  createdAt: true,
  brand: { select: { id: true, name: true, slug: true } },
  reviews: {
    where: { status: 'APPROVED' },
    select: { rating: true },
  },
  productImages: {
    select: { url: true, isThumbnail: true, displayOrder: true },
    orderBy: { displayOrder: 'asc' as const },
  },
} satisfies Prisma.ProductSelect;

type RawImage = { url: string; isThumbnail: boolean; displayOrder: number };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapProduct(raw: any): CategoryProduct {
  const reviews: { rating: number }[] = raw.reviews ?? [];
  const avgRating =
    reviews.length > 0
      ? Math.round((reviews.reduce((s: number, r: { rating: number }) => s + r.rating, 0) / reviews.length) * 10) / 10
      : 0;

  const thumbnailImg =
    raw.productImages?.find((i: RawImage) => i.isThumbnail)?.url ??
    raw.productImages?.[0]?.url ??
    raw.images?.[0] ?? null;
  const hoverImg =
    raw.productImages?.find((i: RawImage) => !i.isThumbnail && i.url !== thumbnailImg)?.url ??
    raw.images?.[1] ?? null;

  const effectiveDiscount =
    raw.discountPercentage != null
      ? raw.discountPercentage
      : raw.offerPrice != null && raw.offerPrice < raw.price
      ? Math.round(((raw.price - raw.offerPrice) / raw.price) * 100)
      : null;

  return {
    id: raw.id,
    name: raw.name,
    slug: raw.slug,
    price: raw.price,
    offerPrice: raw.offerPrice ?? null,
    discountPercentage: effectiveDiscount,
    stock: raw.stock,
    minStock: raw.minStock ?? 5,
    isFeatured: raw.isFeatured,
    isFlashSale: raw.isFlashSale,
    isBestSeller: raw.isBestSeller,
    soldCount: raw.soldCount,
    viewCount: raw.viewCount,
    shortDesc: raw.shortDesc ?? null,
    images: raw.images ?? [],
    primaryImage: thumbnailImg,
    hoverImage: hoverImg,
    brand: raw.brand ?? null,
    avgRating,
    reviewCount: reviews.length,
    warrantyMonths: raw.warrantyMonths ?? null,
    warrantyType: raw.warrantyType ?? null,
    specifications: (raw.specifications as Record<string, string> | null) ?? null,
  };
}

function buildOrderBy(sort: SortOption): Prisma.ProductOrderByWithRelationInput[] {
  switch (sort) {
    case 'newest':     return [{ createdAt: 'desc' }];
    case 'price-asc':  return [{ price: 'asc' }];
    case 'price-desc': return [{ price: 'desc' }];
    case 'discount':   return [{ discountPercentage: { sort: 'desc', nulls: 'last' } }];
    default:           return [{ soldCount: 'desc' }, { viewCount: 'desc' }];
  }
}

export interface AllProductsFilters {
  q?: string;
  sort?: SortOption;
  category?: string; // category slug
  inStock?: boolean;
  onSale?: boolean;
  page?: number;
}

export interface AllProductsPageData {
  products: CategoryProduct[];
  totalCount: number;
  totalPages: number;
  page: number;
  categories: { id: string; name: string; slug: string }[];
}

export async function getAllProductsPageData(
  filters: AllProductsFilters = {}
): Promise<AllProductsPageData> {
  const page = filters.page ?? 1;
  const sort = filters.sort ?? 'newest';

  const where: Prisma.ProductWhereInput = { isActive: true };

  if (filters.q && filters.q.trim()) {
    const q = filters.q.trim();
    where.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { shortDesc: { contains: q, mode: 'insensitive' } },
      { brand: { name: { contains: q, mode: 'insensitive' } } },
    ];
  }

  if (filters.category) {
    where.category = { slug: filters.category };
  }

  if (filters.inStock) {
    where.stock = { gt: 0 };
  }

  if (filters.onSale) {
    where.OR = [
      ...(where.OR ?? []),
      { offerPrice: { not: null } },
      { discountPercentage: { gt: 0 } },
      { isFlashSale: true },
    ];
  }

  try {
    const [rawProducts, totalCount, categories] = await Promise.all([
      prisma.product.findMany({
        where,
        select: PRODUCT_SELECT,
        orderBy: buildOrderBy(sort),
        skip: (page - 1) * PER_PAGE,
        take: PER_PAGE,
      }),
      prisma.product.count({ where }),
      prisma.category.findMany({
        where: { isActive: true },
        select: { id: true, name: true, slug: true },
        orderBy: { name: 'asc' },
      }),
    ]);

    return {
      products: rawProducts.map(mapProduct),
      totalCount,
      totalPages: Math.max(1, Math.ceil(totalCount / PER_PAGE)),
      page,
      categories,
    };
  } catch (err) {
    console.error('[getAllProductsPageData] DB error:', err);
    return { products: [], totalCount: 0, totalPages: 1, page, categories: [] };
  }
}
