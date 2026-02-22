'use server';

import { cache } from 'react';
import { prisma } from '@/lib/prisma';

/**
 * Cached data fetchers for frequently-used static data
 * These use React's cache() to deduplicate requests within a single render
 */

// Cache categories (rarely change)
export const getCachedCategories = cache(async () => {
  return prisma.category.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      parentId: true,
    },
    orderBy: { name: 'asc' },
  });
});

// Cache brands (rarely change)
export const getCachedBrands = cache(async () => {
  return prisma.brand.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      logo: true,
    },
    orderBy: { name: 'asc' },
  });
});

// Cache root categories (for navigation)
export const getCachedRootCategories = cache(async () => {
  return prisma.category.findMany({
    where: { parentId: null },
    select: {
      id: true,
      name: true,
      slug: true,
      _count: {
        select: { products: true }
      }
    },
    orderBy: { name: 'asc' },
  });
});

// Cache category hierarchy with children
export const getCachedCategoryHierarchy = cache(async () => {
  return prisma.category.findMany({
    where: { parentId: null },
    select: {
      id: true,
      name: true,
      slug: true,
      children: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
        orderBy: { name: 'asc' },
      },
    },
    orderBy: { name: 'asc' },
  });
});
