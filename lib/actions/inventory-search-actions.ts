'use server';

import { prisma } from '@/lib/prisma';
import { requireInventoryUser } from '@/lib/inventory/server';

export async function searchInventoryProducts(query: string) {
  await requireInventoryUser();
  const search = query.trim().slice(0, 100);
  if (search.length < 2) return [];
  return prisma.product.findMany({
    where: { status: 'ACTIVE', OR: [
      { name: { contains: search, mode: 'insensitive' } },
      { sku: { contains: search, mode: 'insensitive' } },
      { variants: { some: { OR: [{ name: { contains: search, mode: 'insensitive' } }, { sku: { contains: search, mode: 'insensitive' } }] } } },
    ] },
    select: { id: true, name: true, sku: true, costPrice: true, variants: { select: { id: true, name: true, sku: true, costPrice: true } } },
    orderBy: { name: 'asc' }, take: 30,
  });
}
