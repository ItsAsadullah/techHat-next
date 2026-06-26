'use client';

import { useState, useEffect, useRef, useCallback, KeyboardEvent } from 'react';
import {
  Search, ScanLine, Package, X, TrendingUp, AlertTriangle,
  Loader2, Zap, Tag, Eye, EyeOff, TrendingDown,
} from 'lucide-react';
import Image from 'next/image';
import { useDebouncedCallback } from 'use-debounce';
import { cn } from '@/lib/utils';
import { BarcodeScannerModal } from '@/components/admin/pos/barcode-scanner-modal';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FinderProduct {
  id: string;
  name: string;
  sku: string | null;
  barcode: string | null;
  model: string | null;
  price: number;
  offerPrice: number | null;
  costPrice: number;
  stock: number;
  minStock: number | null;
  stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock';
  soldCount: number;
  warrantyMonths: number | null;
  warrantyType: string | null;
  image: string | null;
  brandId: string | null;
  brandName: string | null;
  categoryId: string | null;
  categoryName: string | null;
  variants: {
    id: string;
    name: string;
    sku: string | null;
    upc: string | null;
    price: number;
    offerPrice: number | null;
    costPrice: number;
    stock: number;
    image: string | null;
  }[];
}

type StockFilter = 'all' | 'in_stock' | 'low_stock' | 'out_of_stock' | 'top_selling' | 'recently_added';

export interface ProductFinderProps {
  mode?: 'exchange' | 'pos' | 'purchase' | 'grn' | 'return' | 'warranty' | 'default';
  onSelect: (product: any, variantId?: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  showScanner?: boolean;
  showCostPrice?: boolean;
  excludeProductId?: string;
  contextBrandId?: string;
  contextCategoryId?: string;
}

// ─── Stock Badge ──────────────────────────────────────────────────────────────

function StockBadge({ status, stock }: { status: FinderProduct['stockStatus']; stock: number }) {
  if (status === 'out_of_stock') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
        Out of Stock
      </span>
    );
  }
  if (status === 'low_stock') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
        Low: {stock}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
      {stock} pcs
    </span>
  );
}

// ─── Product Row ──────────────────────────────────────────────────────────────

function ProductRow({
  product,
  isHighlighted,
  showProfitInfo,
  onClick,
}: {
  product: FinderProduct;
  isHighlighted: boolean;
  showProfitInfo: boolean;
  onClick: () => void;
}) {
  const sellingPrice = product.offerPrice ?? product.price;
  const cost = product.costPrice ?? 0;
  const profit = sellingPrice - cost;
  const profitPct = cost > 0 ? ((profit / cost) * 100).toFixed(1) : null;
  const isProfitable = profit >= 0;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full flex items-start gap-3 px-3 py-2.5 transition-colors text-left border-b border-gray-50 last:border-0',
        isHighlighted ? 'bg-indigo-50 border-indigo-100' : 'hover:bg-gray-50',
        product.stockStatus === 'out_of_stock' && 'opacity-60'
      )}
    >
      {/* Image */}
      <div className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 shrink-0 overflow-hidden flex items-center justify-center mt-0.5">
        {product.image ? (
          <Image src={product.image} alt={product.name} width={40} height={40} className="object-cover w-full h-full" />
        ) : (
          <Package className="w-5 h-5 text-gray-300" />
        )}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 truncate leading-tight">{product.name}</p>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
          {product.sku && (
            <span className="text-[10px] font-mono text-gray-400">{product.sku}</span>
          )}
          {product.brandName && (
            <span className="text-[10px] text-gray-500 font-medium">{product.brandName}</span>
          )}
          {product.categoryName && (
            <span className="text-[10px] text-gray-400">{product.categoryName}</span>
          )}
        </div>
        {product.variants.length > 1 && (
          <p className="text-[10px] text-indigo-500 font-medium mt-0.5">
            {product.variants.length} variants
          </p>
        )}

        {/* ── Profit / Cost row (hidden unless toggled) ── */}
        {showProfitInfo && cost > 0 && (
          <div className="flex items-center gap-3 mt-1.5 pt-1.5 border-t border-dashed border-gray-200">
            <span className="text-[10px] text-gray-500">
              Cost: <span className="font-semibold text-gray-700">৳{cost.toLocaleString()}</span>
            </span>
            <span className={cn(
              'text-[10px] font-bold inline-flex items-center gap-0.5',
              isProfitable ? 'text-emerald-600' : 'text-red-500'
            )}>
              {isProfitable
                ? <TrendingUp className="w-3 h-3" />
                : <TrendingDown className="w-3 h-3" />
              }
              ৳{Math.abs(profit).toLocaleString()}
              {profitPct && (
                <span className={cn(
                  'ml-1 px-1 py-0.5 rounded text-[9px] font-bold',
                  isProfitable ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'
                )}>
                  {isProfitable ? '+' : '-'}{Math.abs(parseFloat(profitPct))}%
                </span>
              )}
            </span>
          </div>
        )}
      </div>

      {/* Price + Stock */}
      <div className="shrink-0 text-right flex flex-col items-end gap-1 mt-0.5">
        <p className="text-sm font-bold text-gray-900">৳{sellingPrice.toLocaleString()}</p>
        {product.offerPrice && product.offerPrice < product.price && (
          <p className="text-[10px] text-gray-400 line-through">৳{product.price.toLocaleString()}</p>
        )}
        <StockBadge status={product.stockStatus} stock={product.stock} />
      </div>
    </button>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────

function SectionHeader({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 px-3 pt-3 pb-1.5">
      <span className="text-gray-400">{icon}</span>
      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</span>
    </div>
  );
}

// ─── Filter Pills ─────────────────────────────────────────────────────────────

const FILTER_OPTIONS: { label: string; value: string; color?: string }[] = [
  { label: 'All', value: 'all' },
  { label: 'In Stock', value: 'in_stock' },
  { label: 'Low Stock', value: 'low_stock' },
  { label: 'Out of Stock', value: 'out_of_stock' },
  { label: 'Top Selling', value: 'top_selling' },
  { label: 'Recently Added', value: 'recently_added' },
];

const WARRANTY_FILTER_OPTIONS: { label: string; value: string; color?: string }[] = [
  { label: 'All Warranty Products', value: 'all' },
  { label: 'Warranty Active', value: 'warranty_active' },
  { label: 'Expiring Soon', value: 'expiring_soon' },
  { label: 'Recently Sold', value: 'recently_sold' },
  { label: 'My Claims', value: 'my_claims' },
  { label: 'Ready For Pickup', value: 'ready_pickup' },
  { label: 'Repair Running', value: 'repair_running' },
  { label: 'Already Claimed', value: 'already_claimed' },
];

function WarrantyProductRow({
  item,
  isHighlighted,
  onClick
}: {
  item: any;
  isHighlighted: boolean;
  onClick: () => void;
}) {
  const getBadgeColors = (status: string) => {
    switch (status) {
      case 'Warranty Active':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'Expiring Soon':
        return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'Expired':
        return 'bg-red-50 text-red-700 border-red-100';
      case 'Already Claimed':
        return 'bg-purple-50 text-purple-700 border-purple-100';
      case 'Repair Running':
        return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'Collected':
      case 'Closed':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'Ready For Pickup':
        return 'bg-green-50 text-green-700 border-green-200';
      default:
        return 'bg-gray-50 text-gray-600 border-gray-100';
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-3 py-3 transition-colors text-left border-b border-gray-100 last:border-0 hover:bg-gray-50/80',
        isHighlighted ? 'bg-indigo-50 border-indigo-100' : ''
      )}
    >
      <div className="flex items-start gap-3 min-w-0 flex-1">
        {/* Product Image */}
        <div className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 shrink-0 overflow-hidden flex items-center justify-center">
          {item.image ? (
            <img src={item.image} alt={item.productName} className="object-cover w-full h-full" />
          ) : (
            <Package className="w-5 h-5 text-gray-300" />
          )}
        </div>

        {/* Details */}
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-gray-900 truncate leading-tight">{item.productName}</p>
          <p className="text-[10px] text-gray-500 font-medium mt-0.5">
            Brand: {item.brandName} {item.variantName ? `· ${item.variantName}` : ''}
          </p>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1 text-[10px] text-gray-400">
            <span className="font-mono bg-gray-100 text-gray-600 px-1 py-0.2 rounded text-[9px]">Inv: {item.invoiceNumber}</span>
            <span>Cust: {item.customerName} ({item.customerPhone})</span>
          </div>
        </div>
      </div>

      {/* Badges / Remaining Time */}
      <div className="flex sm:flex-col items-start sm:items-end justify-between sm:justify-center gap-1.5 shrink-0 text-[10px] w-full sm:w-auto border-t sm:border-t-0 pt-2 sm:pt-0 border-gray-50">
        <div className="flex items-center gap-1">
          <span className={cn(
            'inline-flex items-center gap-0.5 text-[9px] font-black px-2 py-0.5 rounded-full border uppercase tracking-wider',
            getBadgeColors(item.currentStatus)
          )}>
            <span className="w-1 h-1 rounded-full bg-current shrink-0" />
            {item.currentStatus}
          </span>
          {item.claimStatus && (
            <span className="text-[8px] font-black bg-blue-50 text-blue-600 px-1 rounded uppercase tracking-wider">
              {item.claimStatus}
            </span>
          )}
        </div>
        <div className="text-right text-[10px] text-gray-400 font-medium">
          <p className="font-bold text-gray-500">Remaining: {item.warrantyRemainingDays} days ({item.warrantyType})</p>
          <p>Sold: {new Date(item.purchaseDate).toLocaleDateString()}</p>
        </div>
      </div>
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ProductFinder({
  mode = 'default',
  onSelect,
  placeholder = mode === 'warranty' ? 'Search Product / SKU / Barcode / IMEI / Phone / Customer...' : 'Search products, SKU, barcode or model...',
  autoFocus = false,
  showScanner = true,
  showCostPrice: _showCostPriceProp = false,
  excludeProductId,
  contextBrandId,
  contextCategoryId,
}: ProductFinderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [suggestions, setSuggestions] = useState<FinderProduct[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [showScanner_, setShowScanner_] = useState(false);
  // 👁 Profit/cost toggle — hidden by default
  const [showProfitInfo, setShowProfitInfo] = useState(false);

  const allItems = products;

  // ── Fetch products ─────────────────────────────────────────────────────────
  const fetchProducts = useCallback(async (q: string, f: string) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('q', q);
      params.set('filter', f);
      params.set('limit', '30');
      if (mode) params.set('mode', mode);
      if (excludeProductId) params.set('excludeId', excludeProductId);
      const res = await fetch(`/api/admin/products/search?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
        if (data.counts) setCounts(data.counts);
      }
    } catch { /* silent */ } finally {
      setIsLoading(false);
    }
  }, [excludeProductId, mode]);

  // ── Smart suggestions (exchange mode) ─────────────────────────────────────
  const fetchSuggestions = useCallback(async () => {
    if (mode !== 'exchange' || (!contextBrandId && !contextCategoryId)) return;
    try {
      const params = new URLSearchParams({ q: '', filter: 'in_stock', limit: '8' });
      if (excludeProductId) params.set('excludeId', excludeProductId);
      const res = await fetch(`/api/admin/products/search?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        const filtered = (data.products as FinderProduct[]).filter(
          (p) =>
            (contextBrandId && p.brandId === contextBrandId) ||
            (contextCategoryId && p.categoryId === contextCategoryId)
        );
        setSuggestions(filtered.slice(0, 6));
      }
    } catch { /* silent */ }
  }, [mode, contextBrandId, contextCategoryId, excludeProductId]);

  const debouncedFetch = useDebouncedCallback((q: string, f: string) => {
    fetchProducts(q, f);
  }, 250);

  // ── Open panel ─────────────────────────────────────────────────────────────
  const handleOpen = useCallback(() => {
    if (!isOpen) {
      setIsOpen(true);
      fetchProducts(query, filter);
      fetchSuggestions();
    }
  }, [isOpen, query, filter, fetchProducts, fetchSuggestions]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    setHighlightedIndex(-1);
    debouncedFetch(val, filter);
    if (!isOpen) setIsOpen(true);
  };

  const handleFilterChange = (f: string) => {
    setFilter(f);
    fetchProducts(query, f);
    setHighlightedIndex(-1);
  };

  const handleSelect = useCallback((product: any) => {
    if (mode === 'warranty') {
      onSelect(product);
    } else {
      if (product.variants && product.variants.length === 1) {
        onSelect(product, product.variants[0].id);
      } else {
        onSelect(product);
      }
    }
    setIsOpen(false);
    setQuery('');
    setHighlightedIndex(-1);
  }, [onSelect, mode]);

  // ── Keyboard navigation ────────────────────────────────────────────────────
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((i) => Math.min(i + 1, allItems.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && allItems[highlightedIndex]) {
        handleSelect(allItems[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  // ── Close on outside click ─────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Ctrl+K shortcut ────────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: globalThis.KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        handleOpen();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [handleOpen]);

  // ── Barcode scan ───────────────────────────────────────────────────────────
  const handleScanCode = async (code: string): Promise<{ found: boolean; message?: string }> => {
    setQuery(code);
    setShowScanner_(false);
    setIsOpen(true);
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ q: code, limit: '30' });
      if (excludeProductId) params.set('excludeId', excludeProductId);
      const res = await fetch(`/api/admin/products/search?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        const found: FinderProduct[] = data.products || [];
        setProducts(found);
        if (found.length === 1) {
          setTimeout(() => handleSelect(found[0]), 300);
          return { found: true, message: `${found[0].name} found!` };
        }
        if (found.length === 0) return { found: false, message: 'No product found for this barcode.' };
        return { found: true };
      }
    } catch { /* silent */ } finally {
      setIsLoading(false);
    }
    return { found: false, message: 'Search failed. Please try again.' };
  };

  // ── Scroll highlighted into view ───────────────────────────────────────────
  useEffect(() => {
    if (highlightedIndex >= 0 && panelRef.current) {
      const el = panelRef.current.querySelector(`[data-index="${highlightedIndex}"]`);
      el?.scrollIntoView({ block: 'nearest' });
    }
  }, [highlightedIndex]);

  const showSuggestions = mode === 'exchange' && suggestions.length > 0 && !query;
  const topSelling = !query
    ? [...products].sort((a, b) => b.soldCount - a.soldCount).slice(0, 5)
    : [];
  const lowStock = !query ? products.filter((p) => p.stockStatus === 'low_stock').slice(0, 3) : [];
  const regularResults = query
    ? products
    : products.filter((p) => p.stockStatus !== 'low_stock').slice(0, 15);

  // Helper to render a product row with correct global index
  const renderRow = (p: any, globalIndex: number) => {
    if (mode === 'warranty') {
      return (
        <div key={p.id} data-index={globalIndex}>
          <WarrantyProductRow
            item={p}
            isHighlighted={highlightedIndex === globalIndex}
            onClick={() => handleSelect(p)}
          />
        </div>
      );
    }
    return (
      <div key={p.id} data-index={globalIndex}>
        <ProductRow
          product={p}
          isHighlighted={highlightedIndex === globalIndex}
          showProfitInfo={showProfitInfo}
          onClick={() => handleSelect(p)}
        />
      </div>
    );
  };

  return (
    <div ref={containerRef} className="relative w-full">

      {/* ── Search Input ───────────────────────────────────────────────── */}
      <div className={cn(
        'flex items-center gap-2 h-11 px-3 bg-white border-2 rounded-xl transition-all duration-200',
        isOpen ? 'border-indigo-500 ring-2 ring-indigo-500/15 shadow-sm' : 'border-gray-200 hover:border-gray-300'
      )}>
        <Search className={cn('w-4 h-4 shrink-0 transition-colors', isOpen ? 'text-indigo-500' : 'text-gray-400')} />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={handleOpen}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="flex-1 bg-transparent text-sm text-gray-900 placeholder:text-gray-400 outline-none font-medium"
        />
        {isLoading && <Loader2 className="w-4 h-4 text-indigo-400 animate-spin shrink-0" />}
        {query && !isLoading && (
          <button type="button" onClick={() => { setQuery(''); setProducts([]); setHighlightedIndex(-1); fetchProducts('', filter); }}
            className="text-gray-300 hover:text-gray-500 transition-colors">
            <X className="w-4 h-4" />
          </button>
        )}
        {showScanner && !isLoading && (
          <button type="button" title="Scan barcode" onClick={() => setShowScanner_(true)}
            className="p-1 rounded-lg transition-colors shrink-0 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50">
            <ScanLine className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* ── Floating Panel ─────────────────────────────────────────────── */}
      {isOpen && (
        <div className="absolute top-[calc(100%+6px)] left-0 right-0 z-50 bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[460px]">

          {/* ── Filter pills + Eye toggle row ──────────────────────────── */}
          <div className="px-3 pt-2.5 pb-2 border-b border-gray-100 shrink-0 space-y-2">
            {/* Filters — horizontally scrollable */}
            <div className="flex gap-1.5 overflow-x-auto scrollbar-hide snap-x pb-1">
              {(mode === 'warranty' ? WARRANTY_FILTER_OPTIONS : FILTER_OPTIONS).map((opt) => {
                const count = counts[opt.value];
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleFilterChange(opt.value)}
                    className={cn(
                      'text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-colors shrink-0 snap-start flex items-center gap-1.5',
                      filter === opt.value
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                    )}
                  >
                    {opt.label}
                    {count !== undefined && count > 0 && (
                      <span className={cn(
                        'px-1.5 py-0.5 rounded-full text-[9px] font-bold leading-none',
                        filter === opt.value
                          ? 'bg-white/20 text-white'
                          : 'bg-gray-100 text-gray-500'
                      )}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* 👁 Profit toggle */}
            {mode !== 'warranty' && (
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-gray-400">
                  {products.length > 0 && `${products.length} product${products.length !== 1 ? 's' : ''}`}
                </span>
                <button
                  type="button"
                  onClick={() => setShowProfitInfo((v) => !v)}
                  title={showProfitInfo ? 'Hide cost & profit' : 'Show cost & profit'}
                  className={cn(
                    'inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-full border transition-colors',
                    showProfitInfo
                      ? 'bg-violet-600 text-white border-violet-600'
                      : 'bg-white text-gray-500 border-gray-200 hover:bg-violet-50 hover:text-violet-600 hover:border-violet-200'
                  )}
                >
                  {showProfitInfo ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  {showProfitInfo ? 'Hide Profit' : 'Show Cost & Profit'}
                </button>
              </div>
            )}
            {mode === 'warranty' && (
              <div className="text-[10px] text-gray-400">
                {products.length > 0 && `${products.length} item${products.length !== 1 ? 's' : ''} eligible`}
              </div>
            )}
          </div>

          {/* ── Results ─────────────────────────────────────────────────── */}
          <div ref={panelRef} className="overflow-y-auto flex-1">

            {/* Exchange Smart Suggestions */}
            {showSuggestions && (
              <>
                <SectionHeader icon={<Zap className="w-3.5 h-3.5" />} label="Smart Suggestions — Same Brand / Category" />
                {suggestions.map((p, i) => renderRow(p, i))}
                <div className="border-t border-gray-100 mt-1" />
              </>
            )}

            {/* Search results */}
            {query ? (
              <>
                {products.length === 0 && !isLoading ? (
                  <div className="flex flex-col items-center justify-center py-10 gap-3">
                    <Package className="w-10 h-10 text-gray-200" />
                    <p className="text-sm text-gray-500 font-medium">No items found for "{query}"</p>
                    <p className="text-xs text-gray-400">Try a different name, SKU, or barcode</p>
                  </div>
                ) : (
                  <>
                    <SectionHeader
                      icon={<Search className="w-3.5 h-3.5" />}
                      label={`${products.length} result${products.length !== 1 ? 's' : ''}`}
                    />
                    {products.map((p, i) => renderRow(p, i))}
                  </>
                )}
              </>
            ) : (
              <>
                {/* Top Selling */}
                {mode !== 'warranty' && topSelling.length > 0 && (
                  <>
                    <SectionHeader icon={<TrendingUp className="w-3.5 h-3.5" />} label="Top Selling" />
                    {topSelling.map((p, i) => renderRow(p, suggestions.length + i))}
                  </>
                )}

                {/* Low Stock Alert */}
                {mode !== 'warranty' && lowStock.length > 0 && (
                  <>
                    <SectionHeader icon={<AlertTriangle className="w-3.5 h-3.5 text-amber-400" />} label="Low Stock Alert" />
                    {lowStock.map((p, i) => renderRow(p, suggestions.length + topSelling.length + i))}
                  </>
                )}

                {/* All Products */}
                {mode === 'warranty' ? (
                  products.length > 0 && (
                    <>
                      <SectionHeader icon={<Tag className="w-3.5 h-3.5" />} label="Warranty Eligible Items" />
                      {products.map((p, i) => renderRow(p, i))}
                    </>
                  )
                ) : (
                  regularResults.length > 0 && (
                    <>
                      <SectionHeader icon={<Tag className="w-3.5 h-3.5" />} label="All Products" />
                      {regularResults.map((p, i) =>
                        renderRow(p, suggestions.length + topSelling.length + lowStock.length + i)
                      )}
                    </>
                  )
                )}

                {!isLoading && products.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-10 gap-3">
                    <Package className="w-10 h-10 text-gray-200" />
                    <p className="text-sm text-gray-500 font-medium">No warranty eligible items found</p>
                  </div>
                )}
              </>
            )}

            {isLoading && products.length === 0 && (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-3 py-1.5 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between shrink-0">
            <span className="text-[10px] text-gray-400">↑↓ navigate · Enter select · Esc close</span>
            <span className="text-[10px] text-gray-400">Ctrl+K to open</span>
          </div>
        </div>
      )}

      {/* ── Barcode Scanner Modal ──────────────────────────────────────── */}
      {showScanner_ && (
        <BarcodeScannerModal
          isOpen={showScanner_}
          onClose={() => setShowScanner_(false)}
          onScan={handleScanCode}
        />
      )}
    </div>
  );
}
