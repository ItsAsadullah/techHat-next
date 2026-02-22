'use client';

import { useRouter, usePathname } from 'next/navigation';
import { ArrowUpDown, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { buildSearchParams, type FilterParams, type SortOption } from '@/lib/types/category-page';
import { cn } from '@/lib/utils';

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'popularity',  label: 'Most Popular' },
  { value: 'newest',      label: 'Newest First' },
  { value: 'price-asc',   label: 'Price: Low to High' },
  { value: 'price-desc',  label: 'Price: High to Low' },
  { value: 'discount',    label: 'Best Discount' },
  { value: 'rating',      label: 'Top Rated' },
];

interface Props {
  filters: FilterParams;
  totalCount: number;
  onMobileFilterOpen: () => void;
}

export default function SortBar({ filters, totalCount, onMobileFilterOpen }: Props) {
  const router = useRouter();
  const pathname = usePathname();

  const currentSortLabel = SORT_OPTIONS.find((o) => o.value === filters.sort)?.label ?? 'Most Popular';

  const handleSort = (sort: SortOption) => {
    const params = buildSearchParams({ ...filters, sort, page: 1 });
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="flex items-center justify-between gap-3 py-3">
      {/* Results count */}
      <p className="text-sm text-muted-foreground whitespace-nowrap">
        <span className="font-semibold text-foreground">{totalCount.toLocaleString()}</span> products
      </p>

      <div className="flex items-center gap-2 ml-auto">
        {/* Mobile filter button */}
        <Button
          variant="outline"
          size="sm"
          className="lg:hidden gap-1.5 text-xs"
          onClick={onMobileFilterOpen}
        >
          <span>Filters</span>
          {countActiveFilters(filters) > 0 && (
            <span className="bg-primary text-primary-foreground rounded-full w-4 h-4 text-[10px] flex items-center justify-center font-bold">
              {countActiveFilters(filters)}
            </span>
          )}
        </Button>

        {/* Sort dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs min-w-[150px] justify-between">
              <span className="flex items-center gap-1.5">
                <ArrowUpDown className="h-3.5 w-3.5" />
                {currentSortLabel}
              </span>
              <ChevronDown className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {SORT_OPTIONS.map((opt) => (
              <DropdownMenuItem
                key={opt.value}
                onClick={() => handleSort(opt.value)}
                className={cn(
                  'text-sm cursor-pointer',
                  filters.sort === opt.value && 'font-semibold bg-accent'
                )}
              >
                {opt.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

function countActiveFilters(filters: FilterParams): number {
  let c = 0;
  if (filters.brands.length) c++;
  if (filters.minPrice > 0 || filters.maxPrice > 0) c++;
  if (filters.rating > 0) c++;
  if (filters.inStock) c++;
  if (filters.onSale) c++;
  c += Object.values(filters.specs).filter((v) => v.length > 0).length;
  return c;
}
