import { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';
import { ProductLifecycleStatus } from '@prisma/client';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://techhat.shop';

  // Fetch active products
  const products = await prisma.product.findMany({
    where: { status: ProductLifecycleStatus.ACTIVE },
    select: { slug: true, updatedAt: true },
  });

  // Fetch active categories
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    select: { slug: true },
  });

  const productUrls: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${baseUrl}/products/${product.slug}`,
    lastModified: product.updatedAt,
    changeFrequency: 'daily',
    priority: 0.8,
  }));

  const categoryUrls: MetadataRoute.Sitemap = categories.map((category) => ({
    url: `${baseUrl}/category/${category.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/products`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    ...categoryUrls,
    ...productUrls,
  ];
}
