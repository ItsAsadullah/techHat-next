'use client';

import { useEffect, useState } from 'react';
import { Loader2, Search, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { searchInventoryProducts } from '@/lib/actions/inventory-search-actions';

export type InventorySelection = { productId: string; variantId?: string; name: string; sku: string | null; unitCost: number };
type SearchResult = Awaited<ReturnType<typeof searchInventoryProducts>>;

export function ProductPicker({ disabled, onSelect }: { disabled?: boolean; onSelect: (item: InventorySelection) => Promise<void> }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult>([]);
  const [busy, setBusy] = useState(false);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    let current = true;
    setResults([]);
    setError('');
    if (query.trim().length < 2 || disabled) { setBusy(false); return; }
    setBusy(true);
    const timer = setTimeout(async () => {
      try { const data = await searchInventoryProducts(query); if (current) setResults(data); }
      catch { if (current) setError('Could not search products. Please try again.'); }
      finally { if (current) setBusy(false); }
    }, 300);
    return () => { current = false; clearTimeout(timer); };
  }, [query, disabled]);
  async function select(item: InventorySelection) {
    setAdding(true);
    try { await onSelect(item); setQuery(''); }
    catch (error) { setError(error instanceof Error ? error.message : 'Could not add item.'); }
    finally { setAdding(false); }
  }
  return <div className="space-y-2">
    <div className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
      <Input aria-label="Search products by name or SKU" placeholder={disabled ? 'Select a warehouse to add products' : 'Search product name or SKU (at least 2 characters)…'} value={query} onChange={e => setQuery(e.target.value)} disabled={disabled || adding} className="pl-9 h-10" />
      {(busy || adding) && <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin" />}
    </div>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    {!disabled && query.trim().length >= 2 && !busy && !error && <div className="max-h-64 overflow-y-auto rounded-lg border bg-background" aria-label="Product search results">
      {!results.length && <p className="p-4 text-sm text-muted-foreground">No matching products. Try another name or SKU.</p>}
      {results.flatMap(product => (product.variants.length ? product.variants.map(variant => ({ productId: product.id, variantId: variant.id, name: `${product.name} · ${variant.name}`, sku: variant.sku, unitCost: variant.costPrice ?? product.costPrice ?? 0 })) : [{ productId: product.id, name: product.name, sku: product.sku, unitCost: product.costPrice ?? 0 }]).map(item =>
        <button key={`${item.productId}:${'variantId' in item ? item.variantId : ''}`} type="button" disabled={adding} onClick={() => select(item)} className="w-full flex items-center justify-between gap-3 p-3 text-left hover:bg-muted focus-visible:bg-muted border-b last:border-0 disabled:opacity-50">
          <span><span className="block text-sm font-medium">{item.name}</span><span className="text-xs text-muted-foreground font-mono">{item.sku}</span></span><Plus className="h-4 w-4 shrink-0" />
        </button>))}
    </div>}
  </div>;
}
