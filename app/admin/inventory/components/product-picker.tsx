'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { Search, Loader2, Package, X, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { searchInventoryProducts } from '@/lib/actions/inventory-search-actions';

export type InventorySelection = {
  productId: string;
  variantId?: string;
  name: string;
  sku: string | null;
  unitCost: number;
  image?: string | null;
};

type SearchResult = Awaited<ReturnType<typeof searchInventoryProducts>>;

export function ProductPicker({
  disabled,
  onSelect,
}: {
  disabled?: boolean;
  onSelect: (item: InventorySelection) => Promise<void>;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [addingKey, setAddingKey] = useState<string | null>(null);
  const [error, setError] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch products (initial empty search or debounced query)
  const fetchProducts = useCallback(async (searchQuery: string) => {
    if (disabled) return;
    setIsSearching(true);
    setError('');
    try {
      const data = await searchInventoryProducts(searchQuery);
      setResults(data);
    } catch {
      setError('Could not load products. Please try again.');
    } finally {
      setIsSearching(false);
    }
  }, [disabled]);

  // Initial load when component is mounted and warehouse is ready
  useEffect(() => {
    if (!disabled) {
      fetchProducts('');
    } else {
      setResults([]);
    }
  }, [disabled, fetchProducts]);

  // Debounced search on typing
  useEffect(() => {
    if (disabled) return;
    const timer = setTimeout(() => {
      fetchProducts(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, disabled, fetchProducts]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function handleSelect(item: InventorySelection) {
    const key = `${item.productId}:${item.variantId || ''}`;
    setAddingKey(key);
    setError('');
    try {
      await onSelect(item);
      setIsOpen(false);
      setQuery('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add item.');
    } finally {
      setAddingKey(null);
    }
  }

  return (
    <div className="relative w-full" ref={containerRef}>
      {/* Search Bar matching Purchase Order's SmartProductSelector */}
      <div className="relative">
        <Search className="absolute left-3.5 top-3.5 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder={
            disabled
              ? 'Select a warehouse to add products...'
              : 'Search by SKU, Barcode, Product Name, or click to choose...'
          }
          className="pl-11 pr-10 h-12 text-sm sm:text-base rounded-xl border border-input shadow-sm focus-visible:ring-2 focus-visible:ring-primary bg-background"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => {
            if (!disabled) setIsOpen(true);
          }}
          onClick={() => {
            if (!disabled) setIsOpen(true);
          }}
          disabled={disabled}
        />
        {isSearching ? (
          <Loader2 className="absolute right-3.5 top-3.5 h-5 w-5 animate-spin text-muted-foreground" />
        ) : query ? (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => {
              setQuery('');
              fetchProducts('');
            }}
            className="absolute right-3 top-3 p-1 rounded-full hover:bg-muted text-muted-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {error && (
        <div className="mt-2 p-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs">
          {error}
        </div>
      )}

      {/* Floating Dropdown Overlay like Purchase Order */}
      {isOpen && !disabled && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-2xl z-50 max-h-[420px] overflow-y-auto">
          {/* Subheader */}
          <div className="px-3 py-2 bg-muted/40 border-b flex items-center justify-between text-xs text-muted-foreground font-medium sticky top-0 z-10 backdrop-blur-sm">
            <span>
              {query.trim()
                ? `Search results for "${query}" (${results.length})`
                : `Available Products (${results.length})`}
            </span>
            <span className="text-[11px]">Click a product to add</span>
          </div>

          <div className="p-2 grid gap-1.5">
            {isSearching && results.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground text-sm flex items-center justify-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Searching products...</span>
              </div>
            ) : results.length === 0 ? (
              <div className="py-10 text-center text-muted-foreground text-sm">
                {query.trim()
                  ? `No products match "${query}". Try another name or SKU.`
                  : 'No active products found.'}
              </div>
            ) : (
              results.map((product) => (
                <div key={product.id}>
                  {product.variants && product.variants.length > 0 ? (
                    /* Product with variants */
                    <div className="space-y-1 p-2 bg-muted/30 rounded-lg border border-border/60">
                      <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground px-2 py-1 uppercase tracking-wider">
                        <Package className="w-3.5 h-3.5" />
                        <span className="truncate">{product.name}</span>
                      </div>
                      {product.variants.map((v) => {
                        const key = `${product.id}:${v.id}`;
                        const isAdding = addingKey === key;
                        const item: InventorySelection = {
                          productId: product.id,
                          variantId: v.id,
                          name: `${product.name} · ${v.name}`,
                          sku: v.sku || product.sku,
                          unitCost: v.costPrice || product.costPrice || 0,
                          image: v.imageUrl,
                        };

                        return (
                          <button
                            key={v.id}
                            type="button"
                            disabled={addingKey !== null}
                            onClick={() => handleSelect(item)}
                            className="w-full text-left p-2.5 hover:bg-card bg-transparent rounded-lg border border-transparent hover:border-border hover:shadow-sm transition-all group flex items-center justify-between gap-3 disabled:opacity-50"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              {v.imageUrl ? (
                                <img
                                  src={v.imageUrl}
                                  alt={v.name}
                                  className="w-10 h-10 rounded-md object-cover border border-border shrink-0 bg-background"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center border shrink-0 text-muted-foreground">
                                  <Package className="w-5 h-5 text-muted-foreground" />
                                </div>
                              )}
                              <div className="min-w-0">
                                <div className="font-semibold text-sm group-hover:text-primary transition-colors truncate">
                                  {v.name}
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-[10px] font-mono px-1.5 py-0.5 bg-muted rounded text-muted-foreground">
                                    {v.sku || product.sku || 'No SKU'}
                                  </span>
                                  <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                                    Stock: {v.stock}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="text-right flex items-center gap-3 shrink-0">
                              <div className="text-sm font-mono font-bold">
                                ৳{(v.costPrice || product.costPrice || 0).toLocaleString()}
                              </div>
                              {isAdding ? (
                                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                              ) : (
                                <span className="p-1.5 rounded-md bg-muted group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                  <Plus className="w-3.5 h-3.5" />
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    /* Single product without variants */
                    (() => {
                      const key = `${product.id}:`;
                      const isAdding = addingKey === key;
                      const item: InventorySelection = {
                        productId: product.id,
                        variantId: undefined,
                        name: product.name,
                        sku: product.sku,
                        unitCost: product.costPrice || 0,
                        image: product.imageUrl,
                      };

                      return (
                        <button
                          key={product.id}
                          type="button"
                          disabled={addingKey !== null}
                          onClick={() => handleSelect(item)}
                          className="w-full text-left p-3 hover:bg-muted/50 bg-card rounded-lg border border-border/50 hover:border-border transition-all group flex items-center justify-between gap-3 disabled:opacity-50"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {product.imageUrl ? (
                              <img
                                src={product.imageUrl}
                                alt={product.name}
                                className="w-10 h-10 rounded-md object-cover border border-border shrink-0 bg-background"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center border shrink-0 text-muted-foreground">
                                <Package className="w-5 h-5 text-muted-foreground" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="font-semibold text-sm group-hover:text-primary transition-colors truncate">
                                {product.name}
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                {product.sku && (
                                  <span className="text-[10px] font-mono px-1.5 py-0.5 bg-muted rounded text-muted-foreground">
                                    {product.sku}
                                  </span>
                                )}
                                <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                                  Stock: {product.stock}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="text-right flex items-center gap-3 shrink-0">
                            <div className="text-sm font-mono font-bold">
                              ৳{(product.costPrice || 0).toLocaleString()}
                            </div>
                            {isAdding ? (
                              <Loader2 className="w-4 h-4 animate-spin text-primary" />
                            ) : (
                              <span className="p-1.5 rounded-md bg-muted group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                <Plus className="w-3.5 h-3.5" />
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })()
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
