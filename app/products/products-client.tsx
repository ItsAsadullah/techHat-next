'use client';

import { useState, useCallback, useTransition } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  Search, SlidersHorizontal, X, ChevronLeft, ChevronRight, Package,
  TrendingUp, Clock, ArrowUpDown, Tag, CheckSquare,
} from 'lucide-react';
import ProductGrid from '@/components/category-page/ProductGrid';
import type { CategoryProduct } from '@/lib/types/category-page';
import type { AllProductsFilters } from '@/lib/actions/products-page-actions';
import { cn } from '@/lib/utils';

interface Props {
  products: CategoryProduct[];
  totalCount: number;
  totalPages: number;
  page: number;
  categories: { id: string; name: string; slug: string }[];
  filters: AllProductsFilters;
}

const SORT_OPTIONS = [
  { value: 'newest',     label: 'Newest First',    icon: Clock },
  { value: 'popularity', label: 'Most Popular',     icon: TrendingUp },
  { value: 'price-asc',  label: 'Price: Low → High', icon: ArrowUpDown },
  { value: 'price-desc', label: 'Price: High → Low', icon: ArrowUpDown },
  { value: 'discount',   label: 'Best Discount',   icon: Tag },
];

export default function ProductsPageClient({ products, totalCount, totalPages, page, categories, filters }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [showFilters, setShowFilters] = useState(false);
  const [search, setSearch] = useState(filters.q ?? '');

  const navigate = useCallback((newFilters: Partial<AllProductsFilters>) => {
    const merged = { ...filters, ...newFilters };
    const params = new URLSearchParams();
    if (merged.q)        params.set('q', merged.q);
    if (merged.sort && merged.sort !== 'newest') params.set('sort', merged.sort);
    if (merged.category) params.set('category', merged.category);
    if (merged.brand)    params.set('brand', merged.brand);
    if (merged.inStock)  params.set('inStock', '1');
    if (merged.onSale)   params.set('onSale', '1');
    if (merged.page && merged.page > 1) params.set('page', String(merged.page));
    const qs = params.toString();
    startTransition(() => { router.push(`${pathname}${qs ? '?' + qs : ''}`, { scroll: true }); });
  }, [filters, pathname, router]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({ q: search.trim() || undefined, page: 1 });
  };

  const activeFilterCount = [
    filters.category,
    filters.brand,
    filters.inStock,
    filters.onSale,
    filters.sort && filters.sort !== 'newest',
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* ── Header ── */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 space-y-2">
          {/* Title + count */}
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-600" />
              {filters.brand
                ? `Brand: ${filters.brand.charAt(0).toUpperCase() + filters.brand.slice(1)}`
                : 'All Products'}
              <span className="text-sm font-normal text-gray-400">({totalCount.toLocaleString()})</span>
            </h1>
            <button
              onClick={() => setShowFilters(v => !v)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold border transition-colors',
                showFilters || activeFilterCount > 0
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700'
              )}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters
              {activeFilterCount > 0 && (
                <span className="ml-0.5 w-4 h-4 bg-white text-blue-600 rounded-full text-[10px] font-black flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="search"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search products..."
                className="w-full pl-9 pr-4 h-9 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-gray-100"
              />
              {search && (
                <button type="button" onClick={() => { setSearch(''); navigate({ q: undefined, page: 1 }); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button type="submit" className="px-4 h-9 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors">
              Go
            </button>
          </form>

          {/* Active brand chip */}
          {filters.brand && (
            <div className="flex items-center gap-1.5">
              <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-700">
                Brand: {filters.brand.charAt(0).toUpperCase() + filters.brand.slice(1)}
                <button onClick={() => navigate({ brand: undefined, page: 1 })} className="ml-0.5 hover:text-blue-900 dark:hover:text-blue-100">
                  <X className="w-3 h-3" />
                </button>
              </span>
            </div>
          )}

          {/* Sort chips */}
          <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide">
            {SORT_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => navigate({ sort: opt.value as AllProductsFilters['sort'], page: 1 })}
                className={cn(
                  'flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-all shrink-0',
                  (filters.sort ?? 'newest') === opt.value
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="border-t border-gray-100 dark:border-gray-800 px-3 sm:px-6 py-3 space-y-3 bg-gray-50 dark:bg-gray-900/50">
            {/* Category */}
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Category</p>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => navigate({ category: undefined, page: 1 })}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-xs font-semibold border transition-all',
                    !filters.category
                      ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 border-gray-900 dark:border-gray-100'
                      : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700'
                  )}
                >
                  All
                </button>
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => navigate({ category: cat.slug, page: 1 })}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-xs font-semibold border transition-all',
                      filters.category === cat.slug
                        ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 border-gray-900 dark:border-gray-100'
                        : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700'
                    )}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Toggles */}
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => navigate({ inStock: !filters.inStock, page: 1 })}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all',
                  filters.inStock
                    ? 'bg-green-600 text-white border-green-600'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700'
                )}
              >
                <CheckSquare className="w-3.5 h-3.5" /> In Stock Only
              </button>
              <button
                onClick={() => navigate({ onSale: !filters.onSale, page: 1 })}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all',
                  filters.onSale
                    ? 'bg-red-600 text-white border-red-600'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700'
                )}
              >
                <Tag className="w-3.5 h-3.5" /> On Sale
              </button>

              {/* Clear all */}
              {activeFilterCount > 0 && (
                <button
                  onClick={() => { setSearch(''); navigate({ q: undefined, category: undefined, inStock: false, onSale: false, sort: 'newest', page: 1 }); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-red-600 border border-red-200 bg-red-50 hover:bg-red-100 transition-all"
                >
                  <X className="w-3.5 h-3.5" /> Clear Filters
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Product Grid ── */}
      <div className={cn('max-w-7xl mx-auto px-3 sm:px-6 py-4', isPending && 'opacity-60 pointer-events-none')}>
        {isPending ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <ProductGrid products={products} />
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8 flex-wrap">
            <button
              onClick={() => navigate({ page: page - 1 })}
              disabled={page <= 1}
              className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              let p: number;
              if (totalPages <= 7) { p = i + 1; }
              else if (page <= 4) { p = i + 1; }
              else if (page >= totalPages - 3) { p = totalPages - 6 + i; }
              else { p = page - 3 + i; }
              return (
                <button
                  key={p}
                  onClick={() => navigate({ page: p })}
                  className={cn(
                    'w-9 h-9 flex items-center justify-center rounded-lg text-sm font-semibold border transition-colors',
                    p === page
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  )}
                >
                  {p}
                </button>
              );
            })}

            <button
              onClick={() => navigate({ page: page + 1 })}
              disabled={page >= totalPages}
              className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Summary */}
        <p className="text-center text-xs text-gray-400 mt-3">
          Showing {((page - 1) * 24) + 1}–{Math.min(page * 24, totalCount)} of {totalCount.toLocaleString()} products
        </p>
      </div>
    </div>
  );
}
