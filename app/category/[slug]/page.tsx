import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getCategoryPageData, getCategoryMeta } from '@/lib/actions/category-page-actions';
import { parseSearchParams } from '@/lib/types/category-page';
import CategoryPageClient from './category-page-client';
import { isLucideIcon } from '@/lib/category-icon';

// ISR: revalidate every 5 minutes instead of pre-rendering all categories at build time
export const revalidate = 300;

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryMeta(slug);

  if (!category) {
    return { title: 'Category Not Found' };
  }

  const sp = await searchParams;
  const filters = parseSearchParams(sp);
  const page = filters.page && filters.page > 1 ? ` - Page ${filters.page}` : '';
  const brandFilter = filters.brands?.length
    ? ` | ${filters.brands.join(', ')}`
    : '';

  return {
    title: `${category.name}${brandFilter}${page} | TechHat`,
    description:
      category.description ??
      `Shop the best ${category.name} deals at TechHat. Fast delivery across Bangladesh.`,
    openGraph: {
      title: `${category.name} | TechHat`,
      description:
        category.description ??
        `Shop the best ${category.name} deals at TechHat.`,
      images: (category.image && !isLucideIcon(category.image)) ? [{ url: category.image }] : [],
      type: 'website',
    },
    alternates: {
      canonical: `/category/${slug}`,
    },
  };
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const sp = await searchParams;
  const filters = parseSearchParams(sp);

  const data = await getCategoryPageData(slug, filters);

  if (!data) {
    notFound();
  }

  // JSON-LD structured data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: data.category.name,
    description: data.category.description ?? `Shop ${data.category.name} at TechHat`,
    url: `https://techhat.com/category/${slug}`,
    numberOfItems: data.totalCount,
    ...(data.category.image && !isLucideIcon(data.category.image) ? { image: data.category.image } : {}),
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: data.category.breadcrumbs.map((crumb, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: crumb.name,
        item: `https://techhat.com/category/${crumb.slug}`,
      })),
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: structured data safe
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <CategoryPageClient data={data} filters={filters} />
    </>
  );
}
