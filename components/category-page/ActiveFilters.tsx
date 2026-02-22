'use client';

import { useRouter, usePathname } from 'next/navigation';
import { X } from 'lucide-react';
import { buildSearchParams, type FilterParams } from '@/lib/types/category-page';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Props {
  filters: FilterParams;
}

export default function ActiveFilters({ filters }: Props) {
  const router = useRouter();
  const pathname = usePathname();

  const chips: { label: string; onRemove: () => void }[] = [];

  const update = (patch: Partial<FilterParams>) => {
    const params = buildSearchParams({ ...filters, ...patch, page: 1 });
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  if (filters.brands.length > 0) {
    filters.brands.forEach((slug) => {
      chips.push({
        label: `Brand: ${slug}`,
        onRemove: () => update({ brands: filters.brands.filter((b) => b !== slug) }),
      });
    });
  }

  if (filters.minPrice > 0 || filters.maxPrice > 0) {
    const label = filters.minPrice > 0 && filters.maxPrice > 0
      ? `৳${filters.minPrice.toLocaleString()} – ৳${filters.maxPrice.toLocaleString()}`
      : filters.minPrice > 0
      ? `৳${filters.minPrice.toLocaleString()}+`
      : `Up to ৳${filters.maxPrice.toLocaleString()}`;
    chips.push({
      label: `Price: ${label}`,
      onRemove: () => update({ minPrice: 0, maxPrice: 0 }),
    });
  }

  if (filters.rating > 0) {
    chips.push({
      label: `${filters.rating}★ & up`,
      onRemove: () => update({ rating: 0 }),
    });
  }

  if (filters.inStock) {
    chips.push({ label: 'In Stock', onRemove: () => update({ inStock: false }) });
  }

  if (filters.onSale) {
    chips.push({ label: 'On Sale', onRemove: () => update({ onSale: false }) });
  }

  for (const [specKey, values] of Object.entries(filters.specs)) {
    values.forEach((v) => {
      chips.push({
        label: `${specKey}: ${v}`,
        onRemove: () => {
          const newSpecs = {
            ...filters.specs,
            [specKey]: filters.specs[specKey].filter((sv) => sv !== v),
          };
          update({ specs: newSpecs });
        },
      });
    });
  }

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 items-center py-2">
      <span className="text-xs text-muted-foreground shrink-0">Active:</span>
      {chips.map((chip, i) => (
        <Badge
          key={i}
          variant="secondary"
          className="gap-1 pr-1 text-xs cursor-pointer hover:bg-destructive/10 group"
        >
          <span>{chip.label}</span>
          <button
            onClick={chip.onRemove}
            className="rounded-full p-0.5 hover:bg-destructive/20"
            aria-label={`Remove ${chip.label} filter`}
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
      <Button
        variant="ghost"
        size="sm"
        className="h-6 text-xs text-muted-foreground hover:text-destructive px-2"
        onClick={() =>
          router.push(pathname, { scroll: false })
        }
      >
        Clear all
      </Button>
    </div>
  );
}
