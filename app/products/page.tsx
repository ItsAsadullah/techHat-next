import type { Metadata } from 'next';
import { getAllProductsPageData, type AllProductsFilters } from '@/lib/actions/products-page-actions';
import ProductsPageClient from './products-client';
import type { SortOption } from '@/lib/types/category-page';

export const metadata: Metadata = {
  title: 'All Products | TechHat',
  description: 'Browse all products at TechHat — gadgets, accessories, and more. Fast delivery across Bangladesh.',
  openGraph: {
    title: 'All Products | TechHat',
    description: 'Browse all products at TechHat — gadgets, accessories, and more.',
    type: 'website',
  },
  alternates: { canonical: '/products' },
};

export const revalidate = 60;

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function str(v: string | string[] | undefined): string | undefined {
  if (!v) return undefined;
  return Array.isArray(v) ? v[0] : v;
}

export default async function ProductsPage({ searchParams }: PageProps) {
  const sp = await searchParams;

  const filters: AllProductsFilters = {
    q:        str(sp.q),
    sort:     (str(sp.sort) as SortOption | undefined) ?? 'newest',
    category: str(sp.category),
    inStock:  sp.inStock === '1',
    onSale:   sp.onSale === '1',
    page:     sp.page ? parseInt(String(sp.page), 10) : 1,
  };

  const data = await getAllProductsPageData(filters);

  return (
    <ProductsPageClient
      products={data.products}
      totalCount={data.totalCount}
      totalPages={data.totalPages}
      page={data.page}
      categories={data.categories}
      filters={filters}
    />
  );
}
