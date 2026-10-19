'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { Loader2, Search, Plus, X, Package, ChevronDown, ChevronUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  const [busy, setBusy] = useState(false);
  const [addingKey, setAddingKey] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [isOpen, setIsOpen] = useState(true);

  // Load products (initial load without query, or debounced on query change)
  const fetchProducts = useCallback(async (searchQuery: string) => {
    if (disabled) return;
    setBusy(true);
    setError('');
    try {
      const data = await searchInventoryProducts(searchQuery);
      setResults(data);
    } catch {
      setError('Could not load products. Please try again.');
    } finally {
      setBusy(false);
    }
  }, [disabled]);

  // Initial load when warehouse is selected / picker enabled
  useEffect(() => {
    if (!disabled) {
      fetchProducts('');
    } else {
      setResults([]);
    }
  }, [disabled, fetchProducts]);

  // Debounced search on user input
  useEffect(() => {
    if (disabled) return;
    const timer = setTimeout(() => {
      fetchProducts(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, disabled, fetchProducts]);

  // Flatten products and variants into selectable items
  const flatItems = useMemo<InventorySelection[]>(() => {
    const list: InventorySelection[] = [];
    for (const product of results) {
      if (product.variants && product.variants.length > 0) {
        for (const v of product.variants) {
          list.push({
            productId: product.id,
            variantId: v.id,
            name: `${product.name} · ${v.name}`,
            sku: v.sku || product.sku,
            unitCost: v.costPrice ?? product.costPrice ?? 0,
            image: v.image || product.images?.[0] || null,
          });
        }
      } else {
        list.push({
          productId: product.id,
          variantId: undefined,
          name: product.name,
          sku: product.sku,
          unitCost: product.costPrice ?? 0,
          image: product.images?.[0] || null,
        });
      }
    }
    return list;
  }, [results]);

  async function handleSelect(item: InventorySelection) {
    const key = `${item.productId}:${item.variantId || ''}`;
    setAddingKey(key);
    setError('');
    try {
      await onSelect(item);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add item.');
    } finally {
      setAddingKey(null);
    }
  }

  return (
    <div className="space-y-3">
      {/* Search Bar & Toggle */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            aria-label="Search products by name or SKU"
            placeholder={
              disabled
                ? 'Select a warehouse to view and add products'
                : 'Search product name or SKU (or browse list below)…'
            }
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (!isOpen) setIsOpen(true);
            }}
            onFocus={() => {
              if (!isOpen) setIsOpen(true);
            }}
            disabled={disabled}
            className="pl-9 pr-8 h-10 bg-background"
          />
          {query && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => setQuery('')}
              className="absolute right-2.5 top-2.5 p-0.5 rounded-full hover:bg-muted text-muted-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {!disabled && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsOpen((prev) => !prev)}
            className="h-10 shrink-0 gap-1.5 text-xs font-medium"
          >
            {busy ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : isOpen ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
            <span>{isOpen ? 'Hide Products' : `Browse Products (${flatItems.length})`}</span>
          </Button>
        )}
      </div>

      {error && (
        <div className="p-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs">
          {error}
        </div>
      )}

      {/* Product List Panel */}
      {!disabled && isOpen && (
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-muted/30 border-b text-xs text-muted-foreground">
            <span className="font-medium text-foreground">
              {query.trim()
                ? `Search results for "${query}" (${flatItems.length})`
                : `Available Products (${flatItems.length})`}
            </span>
            <span className="hidden sm:inline">Click &ldquo;+ Add&rdquo; to add to list</span>
          </div>

          {/* List items */}
          <div
            className="max-h-72 overflow-y-auto divide-y divide-border/60"
            aria-label="Product list"
          >
            {busy && flatItems.length === 0 ? (
              <div className="py-10 text-center text-muted-foreground text-sm flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading product list…
              </div>
            ) : flatItems.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground text-sm">
                {query.trim()
                  ? `No products match "${query}". Try another name or SKU.`
                  : 'No active products found.'}
              </div>
            ) : (
              flatItems.map((item) => {
                const key = `${item.productId}:${item.variantId || ''}`;
                const isAddingThis = addingKey === key;

                return (
                  <div
                    key={key}
                    className="flex items-center justify-between gap-3 p-3 hover:bg-muted/40 transition-colors"
                  >
                    {/* Product Info */}
                    <div className="flex items-center gap-3 min-w-0">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-9 h-9 rounded-md object-cover border shrink-0 bg-muted"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-md bg-muted flex items-center justify-center shrink-0 border text-muted-foreground">
                          <Package className="h-4 w-4" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {item.name}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {item.sku && (
                            <span className="text-[11px] font-mono text-muted-foreground">
                              {item.sku}
                            </span>
                          )}
                          {item.unitCost > 0 && (
                            <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4">
                              ৳{item.unitCost.toLocaleString()}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Add Button */}
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      disabled={isAddingThis || addingKey !== null}
                      onClick={() => handleSelect(item)}
                      className="shrink-0 h-8 px-3 gap-1 hover:bg-primary hover:text-primary-foreground transition-colors"
                    >
                      {isAddingThis ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          <span className="text-xs">Adding…</span>
                        </>
                      ) : (
                        <>
                          <Plus className="h-3.5 w-3.5" />
                          <span className="text-xs font-medium">Add</span>
                        </>
                      )}
                    </Button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
