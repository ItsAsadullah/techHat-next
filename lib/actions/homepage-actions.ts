'use server';

import { prisma } from '@/lib/prisma';
import {
  type HomepageBanner,
  type HomepageSectionConfig,
  type PromoBanner,
  type FlashSaleConfig,
  type HomepageProduct,
  type HomepageCategory,
  type HomepageBrand,
  type HomepageReview,
  DEFAULT_BANNERS,
  DEFAULT_HOMEPAGE_SECTIONS,
  DEFAULT_PROMO_BANNERS,
} from '@/lib/homepage-types';
import { revalidatePath, unstable_cache } from 'next/cache';

// ─────────────────────────────────────────────────────────────
// SETTING HELPERS
// ─────────────────────────────────────────────────────────────

async function getSettingJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const setting = await prisma.setting.findUnique({ where: { key } });
    return setting ? JSON.parse(setting.value) : fallback;
  } catch {
    return fallback;
  }
}

async function saveSettingJson(key: string, value: any, category = 'homepage') {
  await prisma.setting.upsert({
    where: { key },
    update: { value: JSON.stringify(value), category },
    create: { key, value: JSON.stringify(value), category },
  });
}

// ─────────────────────────────────────────────────────────────
// HOMEPAGE BANNERS
// ─────────────────────────────────────────────────────────────

export async function getHomepageBanners(): Promise<HomepageBanner[]> {
  const _fetch = unstable_cache(
    async () => {
      const banners = await getSettingJson<HomepageBanner[]>('homepage_banners', DEFAULT_BANNERS);
      return banners.filter((b) => b.isActive).sort((a, b) => a.order - b.order);
    },
    ['homepage-banners'],
    { revalidate: 300, tags: ['homepage'] }
  );
  return _fetch();
}

export async function saveHomepageBanners(banners: HomepageBanner[]) {
  await saveSettingJson('homepage_banners', banners);
  revalidatePath('/');
  return { success: true };
}

// ─────────────────────────────────────────────────────────────
// SECTION CONFIG
// ─────────────────────────────────────────────────────────────

export async function getHomepageSections(): Promise<HomepageSectionConfig[]> {
  const _fetch = unstable_cache(
    async () => {
      const sections = await getSettingJson<HomepageSectionConfig[]>(
        'homepage_sections',
        DEFAULT_HOMEPAGE_SECTIONS
      );
      return sections.sort((a, b) => a.order - b.order);
    },
    ['homepage-sections'],
    { revalidate: 300, tags: ['homepage'] }
  );
  return _fetch();
}

export async function saveHomepageSections(sections: HomepageSectionConfig[]) {
  await saveSettingJson('homepage_sections', sections);
  revalidatePath('/');
  return { success: true };
}

// ─────────────────────────────────────────────────────────────
// PROMOTIONAL BANNERS
// ─────────────────────────────────────────────────────────────

export async function getPromoBanners(): Promise<PromoBanner[]> {
  const _fetch = unstable_cache(
    async () => {
      return getSettingJson<PromoBanner[]>('homepage_promo_banners', DEFAULT_PROMO_BANNERS);
    },
    ['homepage-promo-banners'],
    { revalidate: 300, tags: ['homepage'] }
  );
  return _fetch();
}

export async function savePromoBanners(banners: PromoBanner[]) {
  await saveSettingJson('homepage_promo_banners', banners);
  revalidatePath('/');
  return { success: true };
}

// ─────────────────────────────────────────────────────────────
// FLASH SALE CONFIG
// ─────────────────────────────────────────────────────────────

export async function getFlashSaleConfig(): Promise<FlashSaleConfig> {
  const _fetch = unstable_cache(
    async () => {
      return getSettingJson<FlashSaleConfig>('flash_sale_config', {
        endTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        isActive: true,
      });
    },
    ['flash-sale-config'],
    { revalidate: 120, tags: ['homepage'] }
  );
  return _fetch();
}

export async function saveFlashSaleConfig(config: FlashSaleConfig) {
  await saveSettingJson('flash_sale_config', config);
  revalidatePath('/');
  return { success: true };
}

// ─────────────────────────────────────────────────────────────
// PRODUCT QUERIES
// ─────────────────────────────────────────────────────────────

const PRODUCT_SELECT = {
  id: true,
  name: true,
  slug: true,
  price: true,
  offerPrice: true,
  costPrice: true,
  stock: true,
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
  productImages: { select: { url: true }, orderBy: { displayOrder: 'asc' } },
  _count: { select: { reviews: { where: { status: 'APPROVED' } }, orderItems: true } },
} as const;

function mapProduct(p: any): HomepageProduct {
  const thumbnailUrl = p.productImages?.[0]?.url || p.images?.[0] || '';
  const allImages = p.productImages?.map((i: any) => i.url) || p.images || [];
  // Calculate average rating
  let rating = 0;
  if (p.reviews && p.reviews.length > 0) {
    rating = p.reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / p.reviews.length;
  }
  // Calculate discount percentage if not set
  const discountPct = p.discountPercentage ??
    (p.offerPrice ? Math.round(((p.price - p.offerPrice) / p.price) * 100) : null);

  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    price: p.price,
    offerPrice: p.offerPrice,
    costPrice: p.costPrice,
    stock: p.stock,
    images: allImages.length > 0 ? allImages : [thumbnailUrl],
    thumbnailUrl,
    categoryName: p.category?.name || '',
    categorySlug: p.category?.slug || '',
    brandName: p.brand?.name || null,
    rating: rating || (p._avgRating ?? 0),
    reviewCount: p._count?.reviews ?? 0,
    isFeatured: p.isFeatured,
    isFlashSale: p.isFlashSale,
    isBestSeller: p.isBestSeller ?? false,
    viewCount: p.viewCount ?? 0,
    soldCount: p.soldCount ?? p._count?.orderItems ?? p._soldCount ?? 0,
    discountPercentage: discountPct,
    flashSaleEndTime: p.flashSaleEndTime?.toISOString?.() ?? p.flashSaleEndTime ?? null,
    createdAt: p.createdAt?.toISOString?.() ?? p.createdAt,
    _soldCount: p.soldCount ?? p._count?.orderItems ?? p._soldCount ?? 0,
  };
}

export async function getFlashSaleProducts(limit = 12): Promise<HomepageProduct[]> {
  const _fetch = unstable_cache(
    async () => {
  try {
    // Flash sale: isFlashSale=true AND flashSaleEndTime is in the future (or null = always on)
    const products = await prisma.product.findMany({
      where: {
        isFlashSale: true,
        isActive: true,
        OR: [
          { flashSaleEndTime: { gte: new Date() } },
          { flashSaleEndTime: null },
        ],
      },
      select: {
        ...PRODUCT_SELECT,
        images: true,
        reviews: { where: { status: 'APPROVED' }, select: { rating: true } },
      },
      orderBy: { soldCount: 'desc' },
      take: limit,
    });
    // Fetch images
    return products.map(mapProduct);
  } catch (error) {
    console.error('Error fetching flash sale products:', error);
    return [];
  }
    },
    [`flash-sale-products-${limit}`],
    { revalidate: 120, tags: ['homepage', 'products'] }
  );
  return _fetch();
}

export async function getBestSellerProducts(limit = 12): Promise<HomepageProduct[]> {
  const _fetch = unstable_cache(
    async () => {
  try {
    // Primary: use soldCount field (denormalized counter)
    const products = await prisma.product.findMany({
      where: { isActive: true, soldCount: { gt: 0 } },
      select: {
        ...PRODUCT_SELECT,
        images: true,
        reviews: { where: { status: 'APPROVED' }, select: { rating: true } },
      },
      orderBy: { soldCount: 'desc' },
      take: limit,
    });

    // Fallback: if no products have soldCount, try isBestSeller flag or featured
    if (products.length === 0) {
      const flagged = await prisma.product.findMany({
        where: { isActive: true, OR: [{ isBestSeller: true }, { isFeatured: true }] },
        select: {
          ...PRODUCT_SELECT,
          images: true,
          reviews: { where: { status: 'APPROVED' }, select: { rating: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });
      return flagged.map(mapProduct);
    }

    return products.map(mapProduct);
  } catch (error) {
    console.error('Error fetching best sellers:', error);
    return [];
  }
    },
    [`best-seller-products-${limit}`],
    { revalidate: 120, tags: ['homepage', 'products'] }
  );
  return _fetch();
}

export async function getNewArrivalProducts(limit = 12): Promise<HomepageProduct[]> {
  const _fetch = unstable_cache(
    async () => {
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      select: {
        ...PRODUCT_SELECT,
        images: true,
        reviews: { where: { status: 'APPROVED' }, select: { rating: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return products.map(mapProduct);
  } catch (error) {
    console.error('Error fetching new arrivals:', error);
    return [];
  }
    },
    [`new-arrival-products-${limit}`],
    { revalidate: 120, tags: ['homepage', 'products'] }
  );
  return _fetch();
}

export async function getTrendingProducts(limit = 12): Promise<HomepageProduct[]> {
  const _fetch = unstable_cache(
    async () => {
  try {
    // Trending = highest viewCount (most viewed recently)
    const products = await prisma.product.findMany({
      where: { isActive: true, viewCount: { gt: 0 } },
      select: {
        ...PRODUCT_SELECT,
        images: true,
        reviews: { where: { status: 'APPROVED' }, select: { rating: true } },
      },
      orderBy: { viewCount: 'desc' },
      take: limit,
    });

    // Fallback: if no views recorded yet, use recently created
    if (products.length === 0) {
      return getNewArrivalProducts(limit);
    }

    return products.map(mapProduct);
  } catch (error) {
    console.error('Error fetching trending products:', error);
    return [];
  }
    },
    [`trending-products-${limit}`],
    { revalidate: 120, tags: ['homepage', 'products'] }
  );
  return _fetch();
}

export async function getFeaturedProducts(limit = 12): Promise<HomepageProduct[]> {
  const _fetch = unstable_cache(
    async () => {
  try {
    const products = await prisma.product.findMany({
      where: { isFeatured: true, isActive: true },
      select: {
        ...PRODUCT_SELECT,
        images: true,
        reviews: { where: { status: 'APPROVED' }, select: { rating: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return products.map(mapProduct);
  } catch (error) {
    console.error('Error fetching featured products:', error);
    return [];
  }
    },
    [`featured-products-${limit}`],
    { revalidate: 120, tags: ['homepage', 'products'] }
  );
  return _fetch();
}

export async function getDealsUnderAmount(amount: number, limit = 12): Promise<HomepageProduct[]> {
  const _fetch = unstable_cache(
    async () => {
  try {
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        OR: [
          { offerPrice: { not: null, lte: amount } },
          { AND: [{ offerPrice: null }, { price: { lte: amount } }] },
        ],
      },
      select: {
        ...PRODUCT_SELECT,
        images: true,
        reviews: { where: { status: 'APPROVED' }, select: { rating: true } },
      },
      orderBy: { price: 'asc' },
      take: limit,
    });
    return products.map(mapProduct);
  } catch (error) {
    console.error('Error fetching deals:', error);
    return [];
  }
    },
    [`deals-under-${amount}-${limit}`],
    { revalidate: 120, tags: ['homepage', 'products'] }
  );
  return _fetch();
}

export async function getProductsByIds(ids: string[]): Promise<HomepageProduct[]> {
  if (!ids.length) return [];
  try {
    const products = await prisma.product.findMany({
      where: { id: { in: ids }, isActive: true },
      select: {
        ...PRODUCT_SELECT,
        images: true,
        reviews: { where: { status: 'APPROVED' }, select: { rating: true } },
      },
    });
    return products.map(mapProduct);
  } catch (error) {
    console.error('Error fetching products by IDs:', error);
    return [];
  }
}

// ─────────────────────────────────────────────────────────────
// CATEGORIES
// ─────────────────────────────────────────────────────────────

export async function getTopCategories(): Promise<HomepageCategory[]> {
  const _fetch = unstable_cache(
    async () => {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true, parentId: null },
      select: {
        id: true,
        name: true,
        slug: true,
        image: true,
        _count: { select: { products: true } },
        children: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            slug: true,
            image: true,
            _count: { select: { products: true } },
            children: {
              where: { isActive: true },
              select: {
                id: true,
                name: true,
                slug: true,
                image: true,
                _count: { select: { products: true } },
              },
            },
          },
        },
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
    return categories.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      image: c.image,
      _count: c._count,
      children: (c.children || []).map((ch) => ({
        id: ch.id,
        name: ch.name,
        slug: ch.slug,
        image: ch.image,
        _count: ch._count,
        children: ((ch as any).children || []).map((gc: any) => ({
          id: gc.id,
          name: gc.name,
          slug: gc.slug,
          image: gc.image,
          _count: gc._count,
          children: [],
        })),
      })),
    }));
  } catch (error) {
    console.error('Error fetching top categories:', error);
    return [];
  }
    },
    ['top-categories'],
    { revalidate: 300, tags: ['homepage', 'categories'] }
  );
  return _fetch();
}

// ─────────────────────────────────────────────────────────────
// BRANDS
// ─────────────────────────────────────────────────────────────

export async function getFeaturedBrands(): Promise<HomepageBrand[]> {
  const _fetch = unstable_cache(
    async () => {
  try {
    // Prefer brands marked as featured, fallback to all brands with products
    const brands = await prisma.brand.findMany({
      where: {
        OR: [
          { isFeatured: true },
          { products: { some: { isActive: true } } },
        ],
      },
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
        isFeatured: true,
        _count: { select: { products: true } },
      },
      orderBy: [{ isFeatured: 'desc' }, { name: 'asc' }],
      take: 24,
    });
    return brands;
  } catch (error) {
    console.error('Error fetching brands:', error);
    return [];
  }
    },
    ['featured-brands'],
    { revalidate: 300, tags: ['homepage', 'brands'] }
  );
  return _fetch();
}

// ─────────────────────────────────────────────────────────────
// REVIEWS
// ─────────────────────────────────────────────────────────────

export async function getHomepageReviews(limit = 10): Promise<HomepageReview[]> {
  const _fetch = unstable_cache(
    async () => {
  try {
    const reviews = await prisma.review.findMany({
      where: { status: 'APPROVED', rating: { gte: 4 } },
      select: {
        id: true,
        name: true,
        rating: true,
        reviewText: true,
        isVerified: true,
        createdAt: true,
        product: { select: { name: true, slug: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return reviews.map((r) => ({
      id: r.id,
      name: r.name,
      rating: r.rating,
      reviewText: r.reviewText,
      isVerified: r.isVerified,
      createdAt: r.createdAt.toISOString(),
      productName: r.product.name,
      productSlug: r.product.slug,
    }));
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return [];
  }
    },
    [`homepage-reviews-${limit}`],
    { revalidate: 300, tags: ['homepage', 'reviews'] }
  );
  return _fetch();
}

// ─────────────────────────────────────────────────────────────
// SEARCH
// ─────────────────────────────────────────────────────────────

export async function searchProducts(query: string, limit = 8) {
  if (!query || query.length < 2) return { products: [], categories: [] };
  try {
    const [products, categories] = await Promise.all([
      prisma.product.findMany({
        where: {
          isActive: true,
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { category: { name: { contains: query, mode: 'insensitive' } } },
            { brand: { name: { contains: query, mode: 'insensitive' } } },
          ],
        },
        select: {
          id: true,
          name: true,
          slug: true,
          price: true,
          offerPrice: true,
          images: true,
          category: { select: { name: true } },
        },
        take: limit,
      }),
      prisma.category.findMany({
        where: {
          isActive: true,
          name: { contains: query, mode: 'insensitive' },
        },
        select: { id: true, name: true, slug: true, image: true },
        take: 4,
      }),
    ]);

    // Get thumbnail images
    const productIds = products.map((p) => p.id);
    const thumbnails = await prisma.productImage.findMany({
      where: { productId: { in: productIds }, isThumbnail: true },
      select: { productId: true, url: true },
    });
    const thumbMap = new Map(thumbnails.map((t) => [t.productId, t.url]));

    return {
      products: products.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        price: p.price,
        offerPrice: p.offerPrice,
        image: thumbMap.get(p.id) || p.images?.[0] || '',
        categoryName: p.category?.name || '',
      })),
      categories: categories.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        image: c.image,
      })),
    };
  } catch (error) {
    console.error('Error searching:', error);
    return { products: [], categories: [] };
  }
}

// ─────────────────────────────────────────────────────────────
// AGGREGATE HOMEPAGE DATA (for SSR)
// ─────────────────────────────────────────────────────────────

export async function getHomepageData() {
  const [banners, sections, promoBanners, flashSaleConfig, campaigns] = await Promise.all([
    getHomepageBanners(),
    getHomepageSections(),
    getPromoBanners(),
    getFlashSaleConfig(),
    getActiveCampaigns(),
  ]);

  return { banners, sections, promoBanners, flashSaleConfig, campaigns };
}

// ─────────────────────────────────────────────────────────────
// CAMPAIGNS
// ─────────────────────────────────────────────────────────────

export async function getActiveCampaigns() {
  const _fetch = unstable_cache(
    async () => {
  try {
    const now = new Date();
    const campaigns = await prisma.campaign.findMany({
      where: {
        isActive: true,
        OR: [
          { endDate: null },
          { endDate: { gte: now } },
        ],
      },
      orderBy: { priority: 'desc' },
      take: 10,
    });
    return campaigns.map((c) => ({
      id: c.id,
      title: c.title,
      subtitle: c.subtitle,
      bannerImage: c.bannerImage,
      ctaLink: c.ctaLink,
      isActive: c.isActive,
      priority: c.priority,
    }));
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    return [];
  }
    },
    ['active-campaigns'],
    { revalidate: 300, tags: ['homepage', 'campaigns'] }
  );
  return _fetch();
}

// ─────────────────────────────────────────────────────────────
// VIEW COUNT INCREMENT (call from product detail page)
// ─────────────────────────────────────────────────────────────

export async function incrementProductViewCount(productId: string) {
  try {
    await prisma.product.update({
      where: { id: productId },
      data: { viewCount: { increment: 1 } },
    });
    return { success: true };
  } catch {
    return { success: false };
  }
}
