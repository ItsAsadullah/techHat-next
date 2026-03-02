'use client';

import { useState, type ElementType } from 'react';
import * as Icons from 'lucide-react';
import type { CategoryPageData, FilterParams } from '@/lib/types/category-page';
import CategoryBreadcrumb from '@/components/category-page/CategoryBreadcrumb';
import SortBar from '@/components/category-page/SortBar';
import ActiveFilters from '@/components/category-page/ActiveFilters';
import FilterSidebar from '@/components/category-page/FilterSidebar';
import FilterDrawer from '@/components/category-page/FilterDrawer';
import ProductGrid from '@/components/category-page/ProductGrid';
import Pagination from '@/components/category-page/Pagination';
import Image from 'next/image';
import Link from 'next/link';
import { isLucideIcon } from '@/lib/category-icon';

interface Props {
  data: CategoryPageData;
  filters: FilterParams;
}

export default function CategoryPageClient({ data, filters }: Props) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { category, products, totalCount, totalPages, filterOptions } = data;
  const { breadcrumbs, childCategories } = category;

  return (
    <div className="min-h-screen bg-background">
      {/* Breadcrumb */}
      <div className="border-b bg-muted/30">
        <div className="container mx-auto px-4 md:px-6 py-2.5">
          <CategoryBreadcrumb breadcrumbs={breadcrumbs} />
        </div>
      </div>

      {/* Category Hero Banner */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b">
        <div className="container mx-auto px-4 md:px-6 py-6 flex items-center gap-6">
          {category.image && (() => {
            if (!isLucideIcon(category.image)) {
              return (
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden flex-shrink-0 shadow-md">
                  <Image src={category.image!} alt={category.name} fill className="object-cover" sizes="80px" />
                </div>
              );
            }
            const Icon = (Icons as any)[category.image] as ElementType | undefined;
            return (
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl flex-shrink-0 shadow-md bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                {Icon && <Icon className="w-8 h-8 sm:w-9 sm:h-9 text-white" />}
              </div>
            );
          })()}
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{category.name}</h1>
            {category.description && (
              <p className="text-muted-foreground mt-1 text-sm max-w-xl line-clamp-2">
                {category.description}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1.5">
              {totalCount.toLocaleString()} product{totalCount !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Child category chips */}
      {childCategories.length > 0 && (
        <div className="border-b bg-background">
          <div className="container mx-auto px-4 md:px-6 py-3 overflow-x-auto">
            <div className="flex gap-2 pb-1">
              {childCategories.map((child) => (
                <Link
                  key={child.id}
                  href={`/category/${child.slug}`}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full border bg-muted/30 hover:bg-primary hover:text-primary-foreground hover:border-primary text-sm whitespace-nowrap transition-colors flex-shrink-0"
                >
                  {child.image && !isLucideIcon(child.image) && (
                    <div className="relative w-5 h-5 rounded-full overflow-hidden flex-shrink-0">
                      <Image src={child.image} alt="" fill className="object-cover" sizes="20px" />
                    </div>
                  )}
                  {child.image && isLucideIcon(child.image) && (() => {
                    const Icon = (Icons as any)[child.image] as ElementType | undefined;
                    return Icon ? <Icon className="w-3.5 h-3.5 flex-shrink-0" /> : null;
                  })()}
                  {child.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Sort bar (sticky) */}
      <div className="sticky top-[65px] z-20 border-b bg-background/80 backdrop-blur">
        <div className="container mx-auto px-4 md:px-6">
          <SortBar
            totalCount={totalCount}
            filters={filters}
            onMobileFilterOpen={() => setDrawerOpen(true)}
          />
        </div>
      </div>

      {/* Main layout */}
      <div className="container mx-auto px-4 md:px-6 py-4">
        {/* Active filters (mobile + desktop) */}
        <ActiveFilters filters={filters} />

        <div className="flex gap-6 mt-2">
          {/* Desktop sidebar */}
          <aside className="hidden lg:block w-56 xl:w-60 flex-shrink-0">
            <div className="sticky top-[132px] space-y-1">
              <FilterSidebar
                filterOptions={filterOptions}
                filters={filters}
              />
            </div>
          </aside>

          {/* Product area */}
          <main className="flex-1 min-w-0">
            <ProductGrid products={products} />

            {totalPages > 1 && (
              <div className="mt-8 mb-4">
                <Pagination
                  currentPage={filters.page ?? 1}
                  totalPages={totalPages}
                  filters={filters}
                />
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Mobile filter drawer */}
      <FilterDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        filterOptions={filterOptions}
        filters={filters}
      />
    </div>
  );
}
