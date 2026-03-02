/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import ProductView from './product-view';
import Footer from '@/components/Footer';
import type { Metadata } from 'next';
import { getProductReviewStats } from '@/lib/actions/review-actions';
import { unstable_cache } from 'next/cache';


export async function generateStaticParams() {
  try {
    const { prisma: p } = await import('@/lib/prisma');
    const products = await (p as any).product.findMany({
      where: { isActive: true },
      select: { slug: true },
      orderBy: [{ soldCount: 'desc' }, { viewCount: 'desc' }],
      take: 100,
    });
    return products.map(({ slug }: { slug: string }) => ({ slug }));
  } catch {
    return [];
  }
}

export const revalidate = 300;

interface Props {
  params: Promise<{ slug: string }>;
}

async function _getProductBySlug(slug: string) {
  const product = await (prisma as any).product.findUnique({
    where: { slug, isActive: true },
    include: {
      category: true,
      brand: true,
      variants: {
        include: {
          productImage: true,
        }
      },
      specs: true,
      reviews: {
        where: { status: 'APPROVED' },
        include: {
          images: true,
          user: {
            select: {
              fullName: true,
              avatarUrl: true,
            }
          }
        },
        orderBy: [
          { isVerified: 'desc' },
          { helpfulCount: 'desc' },
          { createdAt: 'desc' },
        ],
        take: 10,
      },
      productImages: {
        orderBy: { displayOrder: 'asc' }
      }
    }
  });

  return product as any;
}

const getProductBySlug = (slug: string) =>
  unstable_cache(
    () => _getProductBySlug(slug),
    ['product-by-slug', slug],
    { revalidate: 300, tags: ['products', `product-${slug}`] }
  )();

async function _getRelatedProducts(categoryId: string, currentProductId: string) {
  const products = await (prisma as any).product.findMany({
    where: {
      categoryId,
      isActive: true,
      id: { not: currentProductId }
    },
    include: {
      productImages: {
        where: { isThumbnail: true },
        take: 1
      },
      brand: true,
    },
    take: 8,
    orderBy: { createdAt: 'desc' }
  });

  return products as any[];
}

const getRelatedProducts = (categoryId: string, currentProductId: string) =>
  unstable_cache(
    () => _getRelatedProducts(categoryId, currentProductId),
    ['related-products', categoryId, currentProductId],
    { revalidate: 300, tags: ['products'] }
  )();

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: 'Product Not Found' };

  const thumbnail = product.productImages?.find((img: any) => img.isThumbnail)?.url || product.productImages?.[0]?.url;

  return {
    title: `${product.name} - TechHat`,
    description: product.description?.slice(0, 160) || `Buy ${product.name} at the best price`,
    openGraph: {
      title: product.name,
      description: product.description?.slice(0, 160) || '',
      images: thumbnail ? [{ url: thumbnail }] : [],
    }
  };
}


const PROXY_BASE = '/api/proxy?path=';
const BACKEND_BASE = 'http://localhost/techhat/';

function getImageUrl(url: string | null) {
  if (!url) return null;
  
  // Check if it's a local backend URL (http://localhost/techhat/...)
  if (url.includes('localhost/techhat/') || url.includes('127.0.0.1/techhat/')) {
      const relativePath = url.split('/techhat/')[1];
      return `${PROXY_BASE}${encodeURIComponent(relativePath)}`;
  }

  // If it's another external URL (cloudinary, youtube, etc.), return as is
  if (url.startsWith('http') || url.startsWith('https') || url.startsWith('data:')) return url;
  
  let cleanUrl = url;
  // Clean relative paths
  while (cleanUrl.startsWith('/') || cleanUrl.startsWith('./') || cleanUrl.startsWith('../')) {
      if (cleanUrl.startsWith('/')) cleanUrl = cleanUrl.slice(1);
      else if (cleanUrl.startsWith('./')) cleanUrl = cleanUrl.slice(2);
      else if (cleanUrl.startsWith('../')) cleanUrl = cleanUrl.slice(3);
  }
  
  return `${PROXY_BASE}${encodeURIComponent(cleanUrl)}`;
}

function processContent(content: string | null) {
  if (!content) return '';
  
  // 1. Handle explicit http://localhost/techhat/... URLs in src
  let processed = content.replace(/src=["'](http:\/\/localhost\/techhat\/|http:\/\/127\.0\.0\.1\/techhat\/)([^"']+)["']/gi, (match, prefix, path) => {
      return `src="${PROXY_BASE}${encodeURIComponent(path)}"`;
  });

  // 2. Handle relative paths (exclude http, https, data:, blob:, and /api/proxy)
  processed = processed.replace(/src\s*=\s*["'](?!http|https|data:|blob:|\/api\/proxy)([^"']+)["']/gi, (match, src) => {
    let cleanSrc = src;
    while (cleanSrc.startsWith('/') || cleanSrc.startsWith('./') || cleanSrc.startsWith('../')) {
        if (cleanSrc.startsWith('/')) cleanSrc = cleanSrc.slice(1);
        else if (cleanSrc.startsWith('./')) cleanSrc = cleanSrc.slice(2);
        else if (cleanSrc.startsWith('../')) cleanSrc = cleanSrc.slice(3);
    }
    return `src="${PROXY_BASE}${encodeURIComponent(cleanSrc)}"`;
  });
  
  return processed;
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) notFound();

  // Parallel fetch: related products + review stats (both depend on product but not on each other)
  const [relatedProducts, reviewStatsResult] = await Promise.all([
    getRelatedProducts(product.categoryId, product.id),
    getProductReviewStats(product.id),
  ]);

  const reviewStats = reviewStatsResult.success && reviewStatsResult.stats
    ? reviewStatsResult.stats
    : { averageRating: 0, totalReviews: 0, ratingBreakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } };

  const productData = {
    id: product.id,
    name: product.name,
    slug: product.slug,
    image: getImageUrl((product.productImages?.find((img: any) => img.isThumbnail) || product.productImages?.[0])?.url) || '',
    description: processContent(product.description),
    price: product.price,
    offerPrice: product.offerPrice,
    costPrice: product.costPrice,
    stock: product.stock,
    sku: product.sku,
    barcode: product.barcode,
    unit: product.unit,
    warrantyMonths: product.warrantyMonths,
    warrantyType: product.warrantyType,
    videoUrl: product.videoUrl,
    isFeatured: product.isFeatured,
    isFlashSale: product.isFlashSale,
    productVariantType: product.productVariantType,
    specifications: product.specifications as Record<string, string> | null,
    attributes: product.attributes as Array<{ id: string; name: string; values: string[] }> | null,
    category: {
      id: product.category.id,
      name: product.category.name,
      slug: product.category.slug,
    },
    brand: product.brand ? {
      id: product.brand.id,
      name: product.brand.name,
      slug: product.brand.slug,
      logo: getImageUrl(product.brand.logo),
    } : null,
    images: (product.productImages || []).map((img: any) => ({
      id: img.id,
      url: getImageUrl(img.url),
      isThumbnail: img.isThumbnail,
      displayOrder: img.displayOrder,
    })),
    variants: (product.variants || []).map((v: any) => ({
      id: v.id,
      name: v.name,
      sku: v.sku,
      price: v.price,
      offerPrice: v.offerPrice,
      stock: v.stock,
      image: getImageUrl(v.image),
      productImage: v.productImage ? {
        id: v.productImage.id,
        url: getImageUrl(v.productImage.url),
      } : null,
      attributes: v.attributes as Record<string, string> | null,
    })),
    specs: (product.specs || []).map((s: any) => ({
      id: s.id,
      name: s.name,
      value: s.value,
    })),
    reviews: (product.reviews || []).map((r: any) => ({
      id: r.id,
      name: r.name,
      rating: r.rating,
      reviewText: r.reviewText,
      status: r.status,
      isVerified: r.isVerified,
      helpfulCount: r.helpfulCount,
      images: (r.images || []).map((img: any) => ({
        id: img.id,
        imageUrl: getImageUrl(img.imageUrl),
      })),
      user: r.user ? {
        fullName: r.user.fullName,
        avatarUrl: getImageUrl(r.user.avatarUrl),
      } : null,
      createdAt: r.createdAt?.toISOString?.() || new Date().toISOString(),
    })),
    reviewStats: reviewStats,
  };

  const relatedProductsData = (relatedProducts || []).map((p: any) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    price: p.price,
    offerPrice: p.offerPrice,
    image: getImageUrl(p.productImages?.[0]?.url),
    brand: p.brand?.name || null,
  }));

  return (
    <div className="min-h-screen bg-white">
      <ProductView product={productData} relatedProducts={relatedProductsData} />
      <Footer />
    </div>
  );
}
