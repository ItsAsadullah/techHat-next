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

  const products = await prisma.product.findMany({
    where,
    select: {
      id: true,
      name: true,
      sku: true,
      costPrice: true,
      stock: true,
      images: true,
      productImages: {
        take: 1,
        select: { url: true },
      },
      variants: {
        select: {
          id: true,
          name: true,
          sku: true,
          costPrice: true,
          stock: true,
          image: true,
          productImage: {
            select: { url: true },
          },
        },
      },
    },
    orderBy: search.length > 0 ? { name: 'asc' } : { updatedAt: 'desc' },
    take: 50,
  });

  return products.map((p) => {
    const mainImageUrl = p.productImages?.[0]?.url || (p.images && p.images.length > 0 ? p.images[0] : null);
    return {
      id: p.id,
      name: p.name,
      sku: p.sku,
      costPrice: p.costPrice,
      stock: p.stock,
      imageUrl: mainImageUrl,
      variants: p.variants.map((v) => ({
        id: v.id,
        name: v.name,
        sku: v.sku,
        costPrice: v.costPrice,
        stock: v.stock,
        imageUrl: v.image || v.productImage?.url || mainImageUrl,
      })),
    };
  });
}
