'use server';

import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { unstable_cache } from 'next/cache';
import type {
  CategoryPageData,
  CategoryPageInfo,
  CategoryProduct,
  FilterOptions,
  FilterParams,
  BrandFilterOption,
  SpecFilterOption,
} from '@/lib/types/category-page';

// ─── Constants ────────────────────────────────────────────────────────────────

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

// ─── Map raw Prisma product to CategoryProduct ────────────────────────────────

function mapProduct(raw: any): CategoryProduct {
  const r = raw as any;
  const reviews: { rating: number }[] = r.reviews ?? [];
  const avgRating =
    reviews.length > 0
      ? Math.round((reviews.reduce((s: number, r: { rating: number }) => s + r.rating, 0) / reviews.length) * 10) / 10
      : 0;

  const thumbnailImg = r.productImages?.find((i: any) => i.isThumbnail)?.url ?? r.productImages?.[0]?.url ?? r.images?.[0] ?? null;
  const hoverImg = r.productImages?.find((i: any) => !i.isThumbnail && i.url !== thumbnailImg)?.url ?? r.images?.[1] ?? null;

  const effectiveDiscount =
    r.discountPercentage != null
      ? r.discountPercentage
      : r.offerPrice != null && r.offerPrice < r.price
      ? Math.round(((r.price - r.offerPrice) / r.price) * 100)
      : null;

  return {
    id: r.id,
    name: r.name,
    slug: r.slug,
    price: r.price,
    offerPrice: r.offerPrice ?? null,
    discountPercentage: effectiveDiscount,
    stock: r.stock,
    minStock: r.minStock ?? 5,
    isFeatured: r.isFeatured,
    isFlashSale: r.isFlashSale,
    isBestSeller: r.isBestSeller,
    soldCount: r.soldCount,
    viewCount: r.viewCount,
    shortDesc: r.shortDesc ?? null,
    images: r.images ?? [],
    primaryImage: thumbnailImg,
    hoverImage: hoverImg,
    brand: r.brand ?? null,
    avgRating,
    reviewCount: reviews.length,
    warrantyMonths: r.warrantyMonths ?? null,
    warrantyType: r.warrantyType ?? null,
    specifications: (r.specifications as Record<string, string> | null) ?? null,
  };
}

// ─── Get all descendant category IDs (including self) ────────────────────────
// Optimized: fetch ALL categories once and build tree in memory instead of
// recursive DB queries (1 query instead of 1+N+N*M)

async function getAllDescendantIds(categoryId: string): Promise<string[]> {
  const allCategories = await prisma.category.findMany({
    where: { isActive: true },
    select: { id: true, parentId: true },
  });

  // Build parent -> children map
  const childrenMap = new Map<string, string[]>();
  for (const cat of allCategories) {
    if (cat.parentId) {
      if (!childrenMap.has(cat.parentId)) childrenMap.set(cat.parentId, []);
      childrenMap.get(cat.parentId)!.push(cat.id);
    }
  }

  // BFS to collect all descendants
  const ids: string[] = [categoryId];
  const queue = [categoryId];
  while (queue.length > 0) {
    const current = queue.shift()!;
    const children = childrenMap.get(current) || [];
    for (const childId of children) {
      ids.push(childId);
      queue.push(childId);
    }
  }
  return ids;
}

// ─── Build Prisma WHERE from FilterParams ─────────────────────────────────────

function buildProductWhere(
  categoryIds: string[],
  filters: FilterParams,
  excludePrice = false
): Prisma.ProductWhereInput {
  const where: Prisma.ProductWhereInput = {
    isActive: true,
    categoryId: { in: categoryIds },
  };

  if (!excludePrice) {
    if (filters.minPrice > 0 || filters.maxPrice > 0) {
      where.OR = [
        {
          offerPrice: {
            ...(filters.minPrice > 0 ? { gte: filters.minPrice } : {}),
            ...(filters.maxPrice > 0 ? { lte: filters.maxPrice } : {}),
          },
        },
        {
          price: {
            ...(filters.minPrice > 0 ? { gte: filters.minPrice } : {}),
            ...(filters.maxPrice > 0 ? { lte: filters.maxPrice } : {}),
          },
          offerPrice: null,
        },
      ];
    }
  }

  if (filters.brands.length > 0) {
    where.brand = { slug: { in: filters.brands } };
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

  return where;
}

// ─── Build Prisma orderBy from SortOption ─────────────────────────────────────

function buildOrderBy(sort: string): Prisma.ProductOrderByWithRelationInput[] {
  switch (sort) {
    case 'newest':
      return [{ createdAt: 'desc' }];
    case 'price-asc':
      return [{ price: 'asc' }];
    case 'price-desc':
      return [{ price: 'desc' }];
    case 'discount':
      return [{ discountPercentage: { sort: 'desc', nulls: 'last' } }];
    case 'rating':
      return [{ soldCount: 'desc' }]; // proxy; real rating sort needs aggregation
    default: // popularity
      return [{ soldCount: 'desc' }, { viewCount: 'desc' }];
  }
}

// ─── Get category hierarchy for breadcrumb ────────────────────────────────────
// Optimized: fetch ALL categories once and walk up in memory (1 query instead of N)

async function buildBreadcrumbs(categoryId: string): Promise<{ id: string; name: string; slug: string }[]> {
  const allCategories = await prisma.category.findMany({
    where: { isActive: true },
    select: { id: true, name: true, slug: true, parentId: true },
  });

  const categoryMap = new Map(allCategories.map(c => [c.id, c]));
  const crumbs: { id: string; name: string; slug: string }[] = [];
  let currentId: string | null = categoryId;

  while (currentId) {
    const cat = categoryMap.get(currentId);
    if (!cat) break;
    crumbs.unshift({ id: cat.id, name: cat.name, slug: cat.slug });
    currentId = cat.parentId;
  }

  return crumbs;
}

// ─── Aggregate spec filters from products ────────────────────────────────────

function aggregateSpecFilters(products: any[]): SpecFilterOption[] {
  const specMap: Map<string, Map<string, number>> = new Map();

  for (const product of products) {
    const specs = (product as any).specifications as Record<string, string> | null;
    if (!specs) continue;
    for (const [key, value] of Object.entries(specs)) {
      if (!key || !value) continue;
      if (!specMap.has(key)) specMap.set(key, new Map());
      const valueMap = specMap.get(key)!;
      valueMap.set(String(value), (valueMap.get(String(value)) ?? 0) + 1);
    }
  }

  return Array.from(specMap.entries())
    .filter(([, valueMap]) => valueMap.size >= 2) // Only show if 2+ distinct values
    .map(([key, valueMap]) => ({
      key: key.toLowerCase().replace(/\s+/g, '-'),
      displayKey: key,
      values: Array.from(valueMap.entries())
        .map(([value, count]) => ({ value, count }))
        .sort((a, b) => b.count - a.count),
    }))
    .slice(0, 8); // Max 8 spec filter groups
}

// ─── MAIN: getCategoryPageData ────────────────────────────────────────────────

async function _getCategoryPageData(
  slug: string,
  filters: FilterParams
): Promise<CategoryPageData | null> {
  // 1. Fetch category
  const category = await prisma.category.findUnique({
    where: { slug, isActive: true },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      image: true,
      parentId: true,
      children: {
        where: { isActive: true },
        select: { id: true, name: true, slug: true, image: true },
        orderBy: { sortOrder: 'asc' },
      },
    },
  });

  if (!category) return null;

  // 2. Get all descendant category IDs
  const categoryIds = await getAllDescendantIds(category.id);

  // 3. Build breadcrumbs
  const breadcrumbs = await buildBreadcrumbs(category.id);

  // 4. Base WHERE (without price filter for filter options)
  const baseWhere = buildProductWhere(categoryIds, { ...filters, minPrice: 0, maxPrice: 0 }, true);

  // 5. Fetch ALL products for filter aggregation (id + brand + price + specs + ratings)
  const allProducts = await prisma.product.findMany({
    where: baseWhere,
    select: {
      id: true,
      price: true,
      offerPrice: true,
      discountPercentage: true,
      specifications: true,
      brand: { select: { id: true, name: true, slug: true } },
      reviews: { where: { status: 'APPROVED' }, select: { rating: true } },
    },
  });

  // 6. Compute filter options from ALL products
  const priceValues = allProducts.map((p) => {
    const effective = p.offerPrice ?? p.price;
    return effective;
  });
  const priceRange = {
    min: priceValues.length ? Math.floor(Math.min(...priceValues)) : 0,
    max: priceValues.length ? Math.ceil(Math.max(...priceValues)) : 100000,
  };

  // Brand counts
  const brandCountMap = new Map<string, { brand: typeof allProducts[number]['brand']; count: number }>();
  for (const p of allProducts) {
    if (!p.brand) continue;
    const existing = brandCountMap.get(p.brand.id);
    if (existing) existing.count++;
    else brandCountMap.set(p.brand.id, { brand: p.brand, count: 1 });
  }
  const brands: BrandFilterOption[] = Array.from(brandCountMap.values())
    .sort((a, b) => b.count - a.count)
    .map(({ brand, count }) => ({ id: brand!.id, name: brand!.name, slug: brand!.slug, count }));

  // Rating distribution — single pass instead of 5 filter() passes
  const _ratingCounts: number[] = [0, 0, 0, 0, 0, 0]; // index 1-5
  for (const p of allProducts) {
    if (!p.reviews.length) continue;
    const avg = p.reviews.reduce((s: number, r: { rating: number }) => s + r.rating, 0) / p.reviews.length;
    for (let stars = 1; stars <= 5; stars++) {
      if (avg >= stars) _ratingCounts[stars]++;
    }
  }
  const ratingBuckets = [5, 4, 3, 2, 1].map((stars) => ({ stars, count: _ratingCounts[stars] }));

  // Spec filters (from full product set)
  const specFilters: SpecFilterOption[] = aggregateSpecFilters(allProducts as any);

  const filterOptions: FilterOptions = {
    brands,
    priceRange,
    specFilters,
    ratingCounts: ratingBuckets,
  };

  // 7. Fetch paginated + filtered products
  const where = buildProductWhere(categoryIds, filters);
  const orderBy = buildOrderBy(filters.sort);
  const skip = (filters.page - 1) * filters.perPage;

  // For rating filter, we need post-filter (Prisma can't avg-filter inline)
  // So fetch extra if rating filter is active, then filter in JS
  const fetchLimit = filters.rating > 0 ? filters.perPage * 5 : filters.perPage;
  const fetchSkip = filters.rating > 0 ? 0 : skip;

  const [rawProducts, totalRaw] = await Promise.all([
    prisma.product.findMany({
      where,
      select: PRODUCT_SELECT,
      orderBy,
      take: fetchLimit,
      skip: fetchSkip,
    }),
    prisma.product.count({ where }),
  ]);

  let mapped = rawProducts.map(mapProduct);

  // Apply spec filters in JS (specifications is a JSON field)
  if (Object.keys(filters.specs).length > 0) {
    mapped = mapped.filter((p) => {
      if (!p.specifications) return false;
      for (const [specKey, selectedValues] of Object.entries(filters.specs)) {
        if (!selectedValues.length) continue;
        // Find matching spec key (case-insensitive, slug-aware)
        const productSpecValue = Object.entries(p.specifications).find(
          ([k]) => k.toLowerCase().replace(/\s+/g, '-') === specKey
        )?.[1];
        if (!productSpecValue) return false;
        if (!selectedValues.some((v) => productSpecValue.toLowerCase().includes(v.toLowerCase()))) {
          return false;
        }
      }
      return true;
    });
  }

  // Apply rating filter in JS
  if (filters.rating > 0) {
    mapped = mapped.filter((p) => p.avgRating >= filters.rating);
    const total = mapped.length;
    const paginated = mapped.slice(skip, skip + filters.perPage);
    return {
      category: {
        ...category,
        breadcrumbs,
        childCategories: category.children,
      },
      products: paginated,
      totalCount: total,
      totalPages: Math.ceil(total / filters.perPage),
      filterOptions,
      appliedFilters: filters,
    };
  }

  return {
    category: {
      ...category,
      breadcrumbs,
      childCategories: category.children,
    },
    products: mapped,
    totalCount: totalRaw,
    totalPages: Math.ceil(totalRaw / filters.perPage),
    filterOptions,
    appliedFilters: filters,
  };
}

export const getCategoryPageData = unstable_cache(
  _getCategoryPageData,
  ['category-page-data'],
  { revalidate: 120, tags: ['categories', 'products'] }
);

// ─── Get minimal category info for metadata ───────────────────────────────────

async function _getCategoryMeta(slug: string) {
  return prisma.category.findUnique({
    where: { slug, isActive: true },
    select: { id: true, name: true, description: true, image: true, slug: true },
  });
}

export const getCategoryMeta = unstable_cache(
  _getCategoryMeta,
  ['category-meta'],
  { revalidate: 300, tags: ['categories'] }
);

// ─── Get nav category tree (for mega menu) ────────────────────────────────────

export async function getCategoryTree() {
  const roots = await prisma.category.findMany({
    where: { parentId: null, isActive: true },
    select: {
      id: true, name: true, slug: true, image: true, sortOrder: true,
      children: {
        where: { isActive: true },
        select: { id: true, name: true, slug: true, image: true, sortOrder: true },
        orderBy: { sortOrder: 'asc' },
      },
    },
    orderBy: { sortOrder: 'asc' },
  });
  return roots;
}
