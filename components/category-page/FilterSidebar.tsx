'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ChevronDown, ChevronUp, Star, SlidersHorizontal } from 'lucide-react';
import { buildSearchParams, type FilterOptions, type FilterParams } from '@/lib/types/category-page';
import PriceRangeSlider from './PriceRangeSlider';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

interface Props {
  filters: FilterParams;
  filterOptions: FilterOptions;
  isMobile?: boolean;
  onClose?: () => void;
}

function FilterSection({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full text-sm font-semibold py-3 hover:text-primary transition-colors"
      >
        <span>{title}</span>
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
      {open && <div className="pb-3 space-y-1.5">{children}</div>}
      <Separator />
    </div>
  );
}

export default function FilterSidebar({ filters, filterOptions, isMobile, onClose }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [localFilters, setLocalFilters] = useState<FilterParams>(filters);

  const apply = (patch: Partial<FilterParams>) => {
    const updated = { ...localFilters, ...patch, page: 1 };
    setLocalFilters(updated);
    const params = buildSearchParams(updated);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
    if (isMobile) onClose?.();
  };

  const toggle = <K extends keyof FilterParams>(key: K, value: FilterParams[K]) =>
    apply({ [key]: value } as Partial<FilterParams>);

  const toggleBrand = (slug: string) => {
    const brands = localFilters.brands.includes(slug)
      ? localFilters.brands.filter((b) => b !== slug)
      : [...localFilters.brands, slug];
    apply({ brands });
  };

  const toggleSpec = (specKey: string, value: string) => {
    const current = localFilters.specs[specKey] ?? [];
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    apply({ specs: { ...localFilters.specs, [specKey]: updated } });
  };

  const clearAll = () => {
    router.push(pathname, { scroll: false });
    if (isMobile) onClose?.();
  };

  const activeCount =
    (localFilters.brands.length > 0 ? 1 : 0) +
    (localFilters.minPrice > 0 || localFilters.maxPrice > 0 ? 1 : 0) +
    (localFilters.rating > 0 ? 1 : 0) +
    (localFilters.inStock ? 1 : 0) +
    (localFilters.onSale ? 1 : 0) +
    Object.values(localFilters.specs).filter((v) => v.length > 0).length;

  return (
    <div className="space-y-0">
      {/* Header */}
      <div className="flex items-center justify-between py-3">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-primary" />
          <span className="font-semibold text-sm">Filters</span>
          {activeCount > 0 && (
            <span className="bg-primary text-primary-foreground text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
              {activeCount}
            </span>
          )}
        </div>
        {activeCount > 0 && (
          <button
            onClick={clearAll}
            className="text-xs text-destructive hover:underline"
          >
            Clear all
          </button>
        )}
      </div>
      <Separator />

      {/* Quick toggles */}
      <FilterSection title="Availability">
        <div className="flex items-center justify-between">
          <Label htmlFor="inStock" className="text-sm cursor-pointer">
            In Stock Only
          </Label>
          <Switch
            id="inStock"
            checked={localFilters.inStock}
            onCheckedChange={(v) => toggle('inStock', v)}
          />
        </div>
        <div className="flex items-center justify-between mt-2">
          <Label htmlFor="onSale" className="text-sm cursor-pointer">
            On Sale / Discount
          </Label>
          <Switch
            id="onSale"
            checked={localFilters.onSale}
            onCheckedChange={(v) => toggle('onSale', v)}
          />
        </div>
      </FilterSection>

      {/* Price range */}
      <FilterSection title="Price Range">
        <PriceRangeSlider
          min={filterOptions.priceRange.min}
          max={filterOptions.priceRange.max}
          value={[
            localFilters.minPrice || filterOptions.priceRange.min,
            localFilters.maxPrice || filterOptions.priceRange.max,
          ]}
          onChange={([min, max]) => apply({ minPrice: min, maxPrice: max })}
        />

        {/* Price quick-pick */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          {buildPricePresets(filterOptions.priceRange.max).map((preset) => (
            <button
              key={preset.label}
              onClick={() => apply({ minPrice: preset.min, maxPrice: preset.max })}
              className={cn(
                'text-[11px] px-2 py-1 rounded-full border transition-colors',
                localFilters.minPrice === preset.min && localFilters.maxPrice === preset.max
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'hover:bg-accent'
              )}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Brands */}
      {filterOptions.brands.length > 0 && (
        <FilterSection title="Brand">
          <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
            {filterOptions.brands.map((brand) => (
              <label
                key={brand.id}
                className="flex items-center justify-between gap-2 cursor-pointer group"
              >
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={localFilters.brands.includes(brand.slug)}
                    onCheckedChange={() => toggleBrand(brand.slug)}
                    id={`brand-${brand.slug}`}
                  />
                  <span className="text-sm group-hover:text-primary transition-colors">
                    {brand.name}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground ml-auto">
                  ({brand.count})
                </span>
              </label>
            ))}
          </div>
        </FilterSection>
      )}

      {/* Rating */}
      <FilterSection title="Customer Rating">
        <div className="space-y-1">
          {[4, 3, 2, 1].map((stars) => {
            const ratingData = filterOptions.ratingCounts.find((r) => r.stars === stars);
            return (
              <button
                key={stars}
                onClick={() => apply({ rating: localFilters.rating === stars ? 0 : stars })}
                className={cn(
                  'flex items-center gap-2 w-full rounded-lg px-2 py-1.5 text-sm transition-colors',
                  localFilters.rating === stars
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'hover:bg-accent'
                )}
              >
                <div className="flex">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        'h-3.5 w-3.5',
                        i < stars ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'
                      )}
                    />
                  ))}
                </div>
                <span>& Up</span>
                {ratingData && (
                  <span className="ml-auto text-xs text-muted-foreground">
                    ({ratingData.count})
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </FilterSection>

      {/* Dynamic spec filters */}
      {filterOptions.specFilters.map((spec) => (
        <FilterSection key={spec.key} title={spec.displayKey} defaultOpen={false}>
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {spec.values.map(({ value, count }) => (
              <label
                key={value}
                className="flex items-center justify-between gap-2 cursor-pointer group"
              >
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={(localFilters.specs[spec.key] ?? []).includes(value)}
                    onCheckedChange={() => toggleSpec(spec.key, value)}
                    id={`spec-${spec.key}-${value}`}
                  />
                  <span className="text-sm group-hover:text-primary transition-colors">
                    {value}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">({count})</span>
              </label>
            ))}
          </div>
        </FilterSection>
      ))}
    </div>
  );
}

function buildPricePresets(max: number) {
  if (max <= 5000) {
    return [
      { label: 'Under ৳1k', min: 0, max: 1000 },
      { label: '৳1k-3k', min: 1000, max: 3000 },
      { label: '৳3k+', min: 3000, max: 0 },
    ];
  }
  if (max <= 50000) {
    return [
      { label: 'Under ৳5k', min: 0, max: 5000 },
      { label: '৳5k-20k', min: 5000, max: 20000 },
      { label: '৳20k-50k', min: 20000, max: 50000 },
    ];
  }
  return [
    { label: 'Under ৳20k', min: 0, max: 20000 },
    { label: '৳20k-100k', min: 20000, max: 100000 },
    { label: '৳100k+', min: 100000, max: 0 },
  ];
}
