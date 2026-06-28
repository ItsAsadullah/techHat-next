/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from '@/lib/prisma';
import { ProductLifecycleStatus } from '@prisma/client';
import { notFound } from 'next/navigation';
import ProductView from './product-view';
import Footer from '@/components/Footer';
import type { Metadata } from 'next';
import { getProductReviewStats } from '@/lib/actions/review-actions';
import { getStoreSettings } from '@/lib/actions/invoice-settings-actions';
import { unstable_cache } from 'next/cache';
import sanitizeHtml from 'sanitize-html';


// ISR: cache each product page for 5 minutes, re-validate in background
export const revalidate = 300;

interface Props {
  params: Promise<{ slug: string }>;
}

async function _getProductBySlug(slug: string) {
  const product = await (prisma as any).product.findFirst({
    where: { slug, status: ProductLifecycleStatus.ACTIVE },
    include: {
      category: true,
      brand: true,
      variants: {
        include: {
          productImage: {
            select: { id: true, url: true }
          },
          variantAttributes: {
            include: {
              attributeValue: {
                include: {
                  attribute: {
                    select: { id: true, name: true, uiType: true }
                  }
                }
              }
            }
          }
        },
        take: 50,
      },
      productAttributes: {
        include: {
          attribute: {
            select: { id: true, name: true, uiType: true }
          },
          values: {
            include: {
              attributeValue: {
                select: { id: true, label: true, value: true, colorCode: true, displayOrder: true }
              }
            }
          }
        },
      },
      specs: true,
      reviews: {
        where: { status: 'APPROVED' },
        select: {
          id: true,
          name: true,
          rating: true,
          reviewText: true,
          status: true,
          isVerified: true,
          helpfulCount: true,
          createdAt: true,
          images: {
            select: { id: true, imageUrl: true },
            take: 2, // Limit review images to 2
          },
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
        take: 5, // Reduce from 10 to 5 for faster initial load
      },
      productImages: {
        select: { id: true, url: true, isThumbnail: true, displayOrder: true },
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
      status: ProductLifecycleStatus.ACTIVE,
      id: { not: currentProductId }
    },
    select: {
      id: true,
      name: true,
      slug: true,
      price: true,
      offerPrice: true,
      productImages: {
        select: { url: true },
        where: { isThumbnail: true },
        take: 1
      },
      brand: { select: { name: true } },
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

  const rawThumbnail = product.productImages?.find((img: any) => img.isThumbnail)?.url || product.productImages?.[0]?.url;

  // Convert to absolute public URL for Facebook/social crawlers
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://techhat.shop';
  let ogImage: string | undefined;
  if (rawThumbnail) {
    if (rawThumbnail.startsWith('http') && !rawThumbnail.includes('localhost') && !rawThumbnail.includes('127.0.0.1')) {
      // Already a public absolute URL (Cloudinary, S3, etc.)
      ogImage = rawThumbnail;
    } else if (rawThumbnail.includes('localhost/techhat/') || rawThumbnail.includes('127.0.0.1/techhat/')) {
      // Local backend image → serve via our proxy with absolute URL
      const relativePath = rawThumbnail.split('/techhat/')[1];
      ogImage = `${siteUrl}/api/proxy?path=${encodeURIComponent(relativePath)}`;
    } else if (rawThumbnail.startsWith('/')) {
      ogImage = `${siteUrl}${rawThumbnail}`;
    }
  }

  const productUrl = `${siteUrl}/products/${slug}`;
  const description = product.description?.slice(0, 160) || `Buy ${product.name} at the best price on TechHat`;

  return {
    title: product.name,
    description,
    openGraph: {
      title: product.name,
      description,
      url: productUrl,
      siteName: 'TechHat',
      type: 'website',
      // We purposefully DO NOT set openGraph.images here so that 
      // Next.js automatically uses our opengraph-image.tsx routes!
    },
    twitter: {
      card: 'summary_large_image',
      title: product.name,
      description,
    },
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

  return sanitizeHtml(processed, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'h1', 'h2', 'h3', 'figure', 'figcaption']),
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      '*': ['class', 'style'],
      a: ['href', 'name', 'target', 'rel', 'class', 'style'],
      img: ['src', 'alt', 'title', 'width', 'height', 'loading', 'class', 'style'],
    },
    allowedSchemes: ['http', 'https', 'mailto', 'tel', 'data'],
    allowedSchemesByTag: {
      img: ['http', 'https', 'data'],
    },
    transformTags: {
      a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer' }, true),
    },
  });
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) notFound();

  // Parallel fetch: related products + review stats + store settings
  const [relatedProducts, reviewStatsResult, storeSettings] = await Promise.all([
    getRelatedProducts(product.categoryId, product.id),
    getProductReviewStats(product.id),
    getStoreSettings(),
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
    shortDesc: processContent(product.shortDesc),
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
    attributes: (() => {
      // Prefer productAttributes relation (new form data) over legacy JSON field
      if (product.productAttributes && product.productAttributes.length > 0) {
        return product.productAttributes.map((pa: any) => ({
          id: pa.attribute.id,
          name: pa.attribute.name,
          uiType: pa.attribute.uiType,
          values: (pa.values || [])
            .map((pav: any) => {
              const label = pav.attributeValue?.label;
              const value = pav.attributeValue?.value;
              const raw = label || value;
              return raw != null ? String(raw) : '';
            })
            .filter(Boolean),
          valueDetails: (pa.values || []).map((pav: any) => ({
            id: pav.attributeValue?.id,
            label: String(pav.attributeValue?.label || pav.attributeValue?.value || ''),
            value: String(pav.attributeValue?.value || ''),
            colorCode: pav.attributeValue?.colorCode || null,
          })).filter((v: any) => v.label),
        }));
      }
      // Fallback to legacy JSON field — normalise values to strings
      const legacyAttrs = product.attributes;
      if (!legacyAttrs || !Array.isArray(legacyAttrs)) return null;
      return legacyAttrs.map((attr: any) => ({
        ...attr,
        values: Array.isArray(attr.values)
          ? attr.values.map((v: any) => {
            if (v == null) return '';
            if (typeof v === 'string') return v;
            if (typeof v === 'number' || typeof v === 'boolean') return String(v);
            // v is an object — extract label/value/name
            if (typeof v === 'object') return String(v.label || v.value || v.name || '');
            return '';
          }).filter(Boolean)
          : [],
      }));
    })(),
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
    variants: (product.variants || []).map((v: any) => {
      // Build attributes from variantAttributes relation (new form) + fallback to JSON
      let builtAttributes: Record<string, string> | null = null;
      let builtColorCode: string | null = null;

      if (v.variantAttributes && v.variantAttributes.length > 0) {
        builtAttributes = {};
        for (const va of v.variantAttributes) {
          const attrName = va.attributeValue?.attribute?.name;
          const attrLabel = va.attributeValue?.label || va.attributeValue?.value;
          const attrColorCode = va.attributeValue?.colorCode;
          if (attrName && attrLabel) {
            builtAttributes[attrName] = attrLabel;
            // Pick up colorCode for color-type attributes
            const uiType = va.attributeValue?.attribute?.uiType;
            if (uiType === 'COLOR_SWATCH' && attrColorCode && !builtColorCode) {
              builtColorCode = attrColorCode;
            }
          }
        }
      } else if (v.attributes) {
        // Fallback: use legacy JSON attributes
        builtAttributes = v.attributes as Record<string, string>;
      }

      return {
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
        attributes: builtAttributes,
        colorCode: builtColorCode,
      };
    }),
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
    faqs: (product.faqs || []).map((faq: any) => ({
      question: faq.question,
      answer: faq.answer,
    })),
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

  // Generate JSON-LD Schema
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://techhat.shop';
  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: productData.name,
    description: sanitizeHtml(productData.description || productData.shortDesc || '', { allowedTags: [] }),
    image: productData.images.map((img: any) => img.url),
    sku: productData.sku,
    brand: {
      '@type': 'Brand',
      name: productData.brand?.name || 'TechHat',
    },
    offers: {
      '@type': 'Offer',
      url: `${baseUrl}/products/${productData.slug}`,
      priceCurrency: 'BDT',
      price: productData.offerPrice || productData.price,
      itemCondition: 'https://schema.org/NewCondition',
      availability: productData.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: 'TechHat',
      },
    },
    ...(productData.reviewStats?.totalReviews > 0 ? {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: productData.reviewStats.averageRating,
        reviewCount: productData.reviewStats.totalReviews,
      }
    } : {}),
  };

  return (
    <div className="min-h-screen bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <ProductView
        product={productData}
        relatedProducts={relatedProductsData}
        whatsappNumber={storeSettings.whatsappNumber || ''}
        callNumber={storeSettings.callNumber || storeSettings.phone || ''}
      />
      <Footer />
    </div>
  );
}
