'use server';

import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';

// Categories — cached 10 minutes across all requests, invalidated by 'categories' tag
export const getCachedCategories = unstable_cache(
  async () => {
    return prisma.category.findMany({
      select: {
        id: true,
        name: true,
        shortCode: true,
        slug: true,
        parentId: true,
      },
      orderBy: { name: 'asc' },
    });
  },
  ['cached-categories'],
  { revalidate: 600, tags: ['categories'] }
);

// Brands — cached 10 minutes across all requests, invalidated by 'brands' tag
export const getCachedBrands = unstable_cache(
  async () => {
    return prisma.brand.findMany({
      select: {
        id: true,
        name: true,
        shortCode: true,
        slug: true,
        logo: true,
      },
      orderBy: { name: 'asc' },
    });
  },
  ['cached-brands'],
  { revalidate: 600, tags: ['brands'] }
);
