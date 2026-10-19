'use server';

import { prisma } from '@/lib/prisma';
import { requireInventoryUser } from '@/lib/inventory/server';

export async function searchInventoryProducts(query: string = '') {
  await requireInventoryUser();
  const search = (query || '').trim().slice(0, 100);

  const where = search.length > 0
    ? {
        status: 'ACTIVE' as const,
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { sku: { contains: search, mode: 'insensitive' as const } },
          {
            variants: {
              some: {
                OR: [
                  { name: { contains: search, mode: 'insensitive' as const } },
                  { sku: { contains: search, mode: 'insensitive' as const } },
                ],
              },
            },
          },
        ],
      }
    : {
        status: 'ACTIVE' as const,
      };

  return prisma.product.findMany({
    where,
    select: {
      id: true,
      name: true,
      sku: true,
      costPrice: true,
      images: true,
      variants: {
        select: {
          id: true,
          name: true,
          sku: true,
          costPrice: true,
          image: true,
        },
      },
    },
    orderBy: search.length > 0 ? { name: 'asc' } : { updatedAt: 'desc' },
    take: 60,
  });
}
