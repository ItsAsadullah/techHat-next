import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { prisma } from '@/lib/prisma';
import { checkIpRateLimit, getClientIp } from '@/lib/utils/fraud';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type ImageSignature = {
  hash: number[];
  histogram: number[];
};

const signatureCache = new Map<string, ImageSignature>();

async function createSignature(buffer: Buffer): Promise<ImageSignature> {
  const hashImage = await sharp(buffer)
    .rotate()
    .resize(8, 8, { fit: 'cover' })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const hashPixels: number[] = [];
  for (let i = 0; i < hashImage.data.length; i += hashImage.info.channels) {
    const r = hashImage.data[i] ?? 0;
    const g = hashImage.data[i + 1] ?? r;
    const b = hashImage.data[i + 2] ?? r;
    hashPixels.push(0.299 * r + 0.587 * g + 0.114 * b);
  }
  const average = hashPixels.reduce((sum, value) => sum + value, 0) / hashPixels.length;
  const hash = hashPixels.map((value) => (value >= average ? 1 : 0));

  const colorImage = await sharp(buffer)
    .rotate()
    .resize(16, 16, { fit: 'cover' })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const histogram = Array.from({ length: 64 }, () => 0);
  for (let i = 0; i < colorImage.data.length; i += colorImage.info.channels) {
    const r = colorImage.data[i] ?? 0;
    const g = colorImage.data[i + 1] ?? r;
    const b = colorImage.data[i + 2] ?? r;
    const bucket = Math.floor(r / 64) * 16 + Math.floor(g / 64) * 4 + Math.floor(b / 64);
    histogram[bucket] += 1;
  }

  const total = 16 * 16;
  return {
    hash,
    histogram: histogram.map((value) => value / total),
  };
}

function hammingDistance(a: number[], b: number[]) {
  let distance = 0;
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    if (a[i] !== b[i]) distance++;
  }
  return distance / Math.max(a.length, b.length, 1);
}

function histogramDistance(a: number[], b: number[]) {
  let distance = 0;
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    const delta = a[i] - b[i];
    distance += delta * delta;
  }
  return Math.min(Math.sqrt(distance), 1);
}

function similarityScore(a: ImageSignature, b: ImageSignature) {
  const distance = hammingDistance(a.hash, b.hash) * 0.55 + histogramDistance(a.histogram, b.histogram) * 0.45;
  return 1 - distance;
}

async function fetchImageBuffer(url: string, origin: string): Promise<Buffer | null> {
  try {
    const absoluteUrl = url.startsWith('http') ? url : new URL(url, origin).toString();
    const response = await fetch(absoluteUrl, { cache: 'force-cache' });
    if (!response.ok) return null;
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.startsWith('image/')) return null;
    const contentLength = Number(response.headers.get('content-length') || 0);
    if (contentLength > 6 * 1024 * 1024) return null;
    return Buffer.from(await response.arrayBuffer());
  } catch {
    return null;
  }
}

async function getImageSignature(url: string, origin: string): Promise<ImageSignature | null> {
  const cached = signatureCache.get(url);
  if (cached) return cached;

  const buffer = await fetchImageBuffer(url, origin);
  if (!buffer) return null;

  try {
    const signature = await createSignature(buffer);
    signatureCache.set(url, signature);
    if (signatureCache.size > 500) {
      const firstKey = signatureCache.keys().next().value;
      if (firstKey) signatureCache.delete(firstKey);
    }
    return signature;
  } catch {
    return null;
  }
}

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  mapper: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = [];
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex++;
      results[currentIndex] = await mapper(items[currentIndex]);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rateCheck = await checkIpRateLimit(ip, 'image_search', { windowMinutes: 10, maxRequests: 8 });
    if (!rateCheck.allowed) {
      return NextResponse.json({ products: [], categories: [], error: 'Too many image searches. Please try again later.' }, { status: 429 });
    }

    const formData = await request.formData();
    const file = formData.get('image');

    if (!(file instanceof File)) {
      return NextResponse.json({ products: [], categories: [], error: 'Image is required' }, { status: 400 });
    }

    if (file.type && file.type !== 'application/octet-stream' && !file.type.startsWith('image/')) {
      return NextResponse.json({ products: [], categories: [], error: 'Unsupported file type' }, { status: 400 });
    }

    if (file.size > 8 * 1024 * 1024) {
      return NextResponse.json({ products: [], categories: [], error: 'Image must be under 8MB' }, { status: 400 });
    }

    const uploadBuffer = Buffer.from(await file.arrayBuffer());
    const metadata = await sharp(uploadBuffer).metadata();
    if (!metadata.width || !metadata.height || metadata.width * metadata.height > 16_000_000) {
      return NextResponse.json({ products: [], categories: [], error: 'Image dimensions are too large' }, { status: 400 });
    }

    const uploadedSignature = await createSignature(uploadBuffer);
    const origin = request.nextUrl.origin;

    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        OR: [
          { productImages: { some: {} } },
          { images: { isEmpty: false } },
        ],
      },
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        offerPrice: true,
        sku: true,
        barcode: true,
        images: true,
        category: { select: { name: true } },
        brand: { select: { name: true } },
        productImages: {
          select: { url: true, isThumbnail: true, displayOrder: true },
          orderBy: [{ isThumbnail: 'desc' }, { displayOrder: 'asc' }],
          take: 3,
        },
      },
      take: 300,
    });

    const matches = (await mapWithConcurrency(products, 10, async (product) => {
      const urls = [
        ...product.productImages.map((image) => image.url),
        ...product.images,
      ].filter(Boolean).slice(0, 2);

      let bestScore = 0;
      let bestImage = urls[0] || '';

      for (const url of urls) {
        const signature = await getImageSignature(url, origin);
        if (!signature) continue;

        const score = similarityScore(uploadedSignature, signature);
        if (score > bestScore) {
          bestScore = score;
          bestImage = url;
        }
      }

      return bestScore >= 0.52 ? { product, image: bestImage, score: bestScore } : null;
    })).filter((match): match is { product: (typeof products)[number]; image: string; score: number } => Boolean(match));

    const productsResult = matches
      .sort((a, b) => b.score - a.score)
      .slice(0, 20)
      .map(({ product, image, score }) => ({
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        offerPrice: product.offerPrice,
        sku: product.sku,
        barcode: product.barcode,
        image: image || product.productImages?.[0]?.url || product.images?.[0] || '',
        categoryName: product.category?.name || '',
        brandName: product.brand?.name || '',
        matchedText: `Visual match ${Math.round(score * 100)}%`,
      }));

    return NextResponse.json(
      { products: productsResult, categories: [], mode: 'image' },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    console.error('Image search failed:', error);
    return NextResponse.json({ products: [], categories: [], error: 'Image search failed' }, { status: 500 });
  }
}
