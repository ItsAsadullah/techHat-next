'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';

interface LedgerFiltersProps {
  warehouses: { id: string; name: string; code: string }[];
  products: { id: string; name: string; sku: string | null }[];
  currentFilter: {
    dateFrom?: string;
    dateTo?: string;
    warehouseId?: string;
    productId?: string;
    referenceType?: string;
    search?: string;
  };
}

const REF_TYPES = [
  { value: '', label: 'All Types' },
  { value: 'GRN', label: '📦 GRN (Receive)' },
  { value: 'SALE', label: '🛒 Sale' },
  { value: 'RETURN', label: '↩️ Return' },
  { value: 'ADJUSTMENT', label: '⚙️ Adjustment' },
  { value: 'TRANSFER', label: '🔄 Transfer' },
  { value: 'PO', label: '📋 Purchase Order' },
];

export function LedgerFilters({ warehouses, products, currentFilter }: LedgerFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateFilter = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete('page'); // Reset to page 1 on filter change
    router.push(`/admin/inventory/ledger?${params.toString()}`);
  }, [router, searchParams]);

  const clearAll = useCallback(() => {
    router.push('/admin/inventory/ledger');
  }, [router]);

  const hasActiveFilters = Object.values(currentFilter).some(
    v => v && v !== '' && typeof v !== 'number'
  );

  return (
    <div className="bg-card border rounded-lg p-4">
      <div className="flex items-center gap-2 mb-4">
        <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-semibold text-foreground">Filters</span>
        {hasActiveFilters && (
          <button
            onClick={clearAll}
            className="ml-auto flex items-center gap-1 text-xs text-destructive hover:underline"
          >
            <X className="h-3 w-3" />
            Clear All
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Search */}
        <div className="lg:col-span-2 relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search product, reference..."
            defaultValue={currentFilter.search || ''}
            onKeyDown={e => {
              if (e.key === 'Enter') updateFilter('search', (e.target as HTMLInputElement).value);
            }}
            onBlur={e => updateFilter('search', e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-xs bg-background border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* Date From */}
        <div>
          <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">From</label>
          <input
            type="date"
            defaultValue={currentFilter.dateFrom || ''}
            onChange={e => updateFilter('dateFrom', e.target.value)}
            className="w-full px-2 py-2 text-xs bg-background border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* Date To */}
        <div>
          <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">To</label>
          <input
            type="date"
            defaultValue={currentFilter.dateTo || ''}
            onChange={e => updateFilter('dateTo', e.target.value)}
            className="w-full px-2 py-2 text-xs bg-background border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* Warehouse */}
        <div>
          <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">Warehouse</label>
          <select
            value={currentFilter.warehouseId || ''}
            onChange={e => updateFilter('warehouseId', e.target.value)}
            className="w-full px-2 py-2 text-xs bg-background border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">All Warehouses</option>
            {warehouses.map(w => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
        </div>

        {/* Reference Type */}
        <div>
          <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">Movement</label>
          <select
            value={currentFilter.referenceType || ''}
            onChange={e => updateFilter('referenceType', e.target.value)}
            className="w-full px-2 py-2 text-xs bg-background border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            {REF_TYPES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
