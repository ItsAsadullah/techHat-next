'use client';
import { useState, useEffect, useRef } from 'react';
import { Search, Loader2, Package, TrendingDown, TrendingUp, AlertCircle, ShoppingCart } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface SmartProductSelectorProps {
  onAddProduct: (product: any, variant: any) => void;
  searchProducts: (query: string) => Promise<any>;
  addedItems: any[];
}

export function SmartProductSelector({ onAddProduct, searchProducts, addedItems }: SmartProductSelectorProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      const res = await searchProducts(query);
      if (res?.success) setResults(res.data || []);
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query, searchProducts]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredResults = results.map(product => {
    const hasVariants = product.variants && product.variants.length > 0;
    if (hasVariants) {
      const availableVariants = product.variants.filter((v: any) => 
        !addedItems.some(item => item.productId === product.id && item.variantId === v.id)
      );
      return availableVariants.length > 0 ? { ...product, variants: availableVariants } : null;
    } else {
      const isAdded = addedItems.some(item => item.productId === product.id && !item.variantId);
      return !isAdded ? product : null;
    }
  }).filter(Boolean);

  const getCostIndicator = (current: number, last: number) => {
    if (!last || last === 0) return null;
    if (current > last) return <Badge variant="outline" className="text-red-600 bg-red-50 border-red-200"><TrendingUp className="w-3 h-3 mr-1"/> Higher</Badge>;
    if (current < last) return <Badge variant="outline" className="text-emerald-600 bg-emerald-50 border-emerald-200"><TrendingDown className="w-3 h-3 mr-1"/> Lower</Badge>;
    return null;
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      <div className="relative">
        <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
        <Input
          placeholder="Search by SKU, Barcode, Product Name, Variant, or Model..."
          className="pl-10 h-12 text-base rounded-xl border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-900"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
        />
        {isSearching && <Loader2 className="absolute right-3 top-3 h-5 w-5 animate-spin text-gray-400" />}
      </div>

      {isOpen && filteredResults.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-2xl z-50 max-h-[400px] overflow-y-auto">
          <div className="p-2 grid gap-1">
            {filteredResults.map((product: any) => (
              <div key={product.id}>
                {product.variants?.length > 0 ? (
                  <div className="space-y-1 p-2 bg-gray-50/50 dark:bg-gray-900/50 rounded-lg border border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                      <Package className="w-4 h-4" /> {product.name}
                    </div>
                    {product.variants.map((v: any) => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => { onAddProduct(product, v); setIsOpen(false); setQuery(''); }}
                        className="w-full text-left p-3 hover:bg-white dark:hover:bg-gray-800 bg-transparent rounded-lg border border-transparent hover:border-indigo-100 dark:hover:border-indigo-900 hover:shadow-sm transition-all group flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          {v.images?.[0]?.url ? (
                            <img src={v.images[0].url} alt={v.name} className="w-10 h-10 rounded-md object-cover border border-gray-200" />
                          ) : (
                            <div className="w-10 h-10 rounded-md bg-gray-100 dark:bg-gray-800 flex items-center justify-center border border-gray-200 dark:border-gray-700">
                              <Package className="w-5 h-5 text-gray-400" />
                            </div>
                          )}
                          <div>
                            <div className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-indigo-600 transition-colors">{v.name}</div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] font-mono px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-gray-600 dark:text-gray-400">{v.sku}</span>
                              <span className={`text-[10px] font-semibold flex items-center gap-1 ${v.stock <= (product.reorderPoint || 5) ? 'text-red-600' : 'text-emerald-600'}`}>
                                {v.stock <= (product.reorderPoint || 5) && <AlertCircle className="w-3 h-3" />}
                                Stock: {v.stock}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right flex flex-col items-end gap-1">
                          <div className="text-sm font-mono font-bold text-gray-900 dark:text-gray-100">৳{v.costPrice || product.costPrice || 0}</div>
                          {getCostIndicator(v.costPrice || product.costPrice || 0, v.lastPurchaseCost || 0)}
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => { onAddProduct(product, null); setIsOpen(false); setQuery(''); }}
                    className="w-full text-left p-3 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20 bg-white dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-800 hover:border-indigo-200 dark:hover:border-indigo-800 transition-all group flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      {product.images?.[0]?.url ? (
                        <img src={product.images[0].url} alt={product.name} className="w-10 h-10 rounded-md object-cover border border-gray-200" />
                      ) : (
                        <div className="w-10 h-10 rounded-md bg-gray-100 dark:bg-gray-800 flex items-center justify-center border border-gray-200 dark:border-gray-700">
                          <Package className="w-5 h-5 text-gray-400" />
                        </div>
                      )}
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-indigo-600 transition-colors">{product.name}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-mono px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-gray-600 dark:text-gray-400">{product.sku}</span>
                          <span className={`text-[10px] font-semibold flex items-center gap-1 ${product.stock <= (product.reorderPoint || 5) ? 'text-red-600' : 'text-emerald-600'}`}>
                            {product.stock <= (product.reorderPoint || 5) && <AlertCircle className="w-3 h-3" />}
                            Stock: {product.stock}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1">
                      <div className="text-sm font-mono font-bold text-gray-900 dark:text-gray-100">৳{product.costPrice || 0}</div>
                      {getCostIndicator(product.costPrice || 0, product.lastPurchaseCost || 0)}
                    </div>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
