import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import { ChevronRight, Package } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import ProductCard from '@/components/homepage/ProductCard';
import type { HomepageProduct } from '@/lib/homepage-types';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'All Categories | TechHat',
  description: 'Browse every TechHat category with its products.',
};

type CategorySection = {
  id: string;
  name: string;
  slug: string;
  parentName: string | null;
  products: HomepageProduct[];
};

async function getCategoryProductSections(): Promise<CategorySection[]> {
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      slug: true,
      parentId: true,
      parent: { select: { name: true } },
      products: {
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          slug: true,
          sku: true,
          stock: true,
          price: true,
          offerPrice: true,
          costPrice: true,
          images: true,
          isFeatured: true,
          isFlashSale: true,
          isBestSeller: true,
          viewCount: true,
          soldCount: true,
          discountPercentage: true,
          flashSaleEndTime: true,
          createdAt: true,
          category: { select: { name: true, slug: true } },
          brand: { select: { name: true } },
          productImages: {
            select: { url: true },
            orderBy: { displayOrder: 'asc' },
          },
          _count: { select: { reviews: { where: { status: 'APPROVED' } }, orderItems: true } },
        },
        orderBy: [{ isFeatured: 'desc' }, { soldCount: 'desc' }, { name: 'asc' }],
      },
    },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
  });

  return categories
    .map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      parentName: category.parent?.name || null,
      products: category.products.map((product) => ({
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        offerPrice: product.offerPrice,
        costPrice: product.costPrice,
        stock: product.stock,
        images: product.productImages?.length
          ? product.productImages.map((image) => image.url)
          : product.images,
        thumbnailUrl: product.productImages?.[0]?.url || product.images?.[0] || '',
        categoryName: product.category?.name || category.name,
        categorySlug: product.category?.slug || category.slug,
        brandName: product.brand?.name || '',
        rating: 0,
        reviewCount: product._count.reviews,
        isFeatured: product.isFeatured,
        isFlashSale: product.isFlashSale,
        isBestSeller: product.isBestSeller,
        viewCount: product.viewCount,
        soldCount: product.soldCount ?? product._count.orderItems,
        discountPercentage: product.discountPercentage ??
          (product.offerPrice ? Math.round(((product.price - product.offerPrice) / product.price) * 100) : null),
        flashSaleEndTime: product.flashSaleEndTime?.toISOString?.() ?? null,
        createdAt: product.createdAt.toISOString(),
        _soldCount: product.soldCount ?? product._count.orderItems,
      })),
    }))
    .filter((category) => category.products.length > 0);
}

export default async function CategoriesPage() {
  const sections = await getCategoryProductSections();
  const totalProducts = sections.reduce((sum, section) => sum + section.products.length, 0);

  return (
    <div className="bg-gray-50">
      <section className="border-b border-gray-100 bg-white">
        <div className="container mx-auto px-4 py-8 sm:py-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-blue-600">TechHat</p>
              <h1 className="mt-1 text-2xl font-bold text-gray-950 sm:text-3xl">All Categories</h1>
              <p className="mt-2 max-w-2xl text-sm text-gray-500">
                Category-wise product list for quick browsing.
              </p>
            </div>
            <div className="flex gap-3 text-sm text-gray-600">
              <div className="rounded-lg border border-gray-200 bg-white px-3 py-2">
                <span className="font-bold text-gray-900">{sections.length}</span> categories
              </div>
              <div className="rounded-lg border border-gray-200 bg-white px-3 py-2">
                <span className="font-bold text-gray-900">{totalProducts}</span> products
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-6 sm:py-8">
        {sections.length > 0 ? (
          <div className="space-y-6">
            {sections.map((section) => (
              <section key={section.id} className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                <div className="flex flex-col gap-3 border-b border-gray-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold text-gray-950">{section.name}</h2>
                      {section.parentName && (
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
                          {section.parentName}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-1.5 text-xs text-gray-500">
                      <Package className="h-3.5 w-3.5" />
                      <span>{section.products.length} products</span>
                    </div>
                  </div>
                  <Link
                    href={`/category/${section.slug}`}
                    className="inline-flex items-center text-sm font-semibold text-blue-600 hover:text-blue-700"
                  >
                    View category
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Link>
                </div>

                <div className="p-4">
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                    {section.products.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
            <Package className="mx-auto h-10 w-10 text-gray-300" />
            <h2 className="mt-3 text-lg font-semibold text-gray-900">No products found</h2>
          </div>
        )}
      </section>
    </div>
  );
}
