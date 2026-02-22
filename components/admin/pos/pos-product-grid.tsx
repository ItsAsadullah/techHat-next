'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Barcode, Package, Grid3X3, List, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { searchPOSProducts, findProductByBarcode, type POSProduct } from '@/lib/actions/pos-actions';
import { useDebouncedCallback } from 'use-debounce';
import Image from 'next/image';
import { useGlobalScanner } from '@/components/admin/global-scanner-provider';

interface POSProductGridProps {
  categories: { id: string; name: string }[];
  onProductSelect: (product: POSProduct, variantId?: string) => void;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
}

export function POSProductGrid({ categories, onProductSelect, searchInputRef }: POSProductGridProps) {
  const [products, setProducts] = useState<POSProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const [barcodeMode, setBarcodeMode] = useState(false);
  const [barcodeBuffer, setBarcodeBuffer] = useState('');

    // -- Mobile scanner integration ------------------------------------------------
  // Use lastScanEvent (not lastScannedCode) so the same barcode scanned twice
  // still triggers a new product lookup (t = Date.now() always differs).
  const { lastScanEvent } = useGlobalScanner();
  const processedScanRef = useRef<number>(0);

  useEffect(() => {
    if (!lastScanEvent || lastScanEvent.t === processedScanRef.current) return;
    processedScanRef.current = lastScanEvent.t;
    const { code } = lastScanEvent;
    findProductByBarcode(code).then((product) => {
      if (product) {
        onProductSelect(product, product.variants[0]?.id);
      } else {
        searchPOSProducts(code).then((results) => {
          if (results.length === 1) onProductSelect(results[0], results[0].variants[0]?.id);
        });
      }
    });
  }, [lastScanEvent, onProductSelect]);

  // Initial load
  useEffect(() => {
    loadProducts('', undefined);
  }, []);

  const loadProducts = async (query: string, catId?: string) => {
    setLoading(true);
    try {
      const result = await searchPOSProducts(query, catId);
      setProducts(result);
    } catch (e) {
      console.error('Search error:', e);
    } finally {
      setLoading(false);
    }
  };

  const debouncedSearch = useDebouncedCallback((query: string) => {
    loadProducts(query, selectedCategory);
  }, 150);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    debouncedSearch(value);
  };

  const handleCategorySelect = (catId: string | undefined) => {
    setSelectedCategory(catId);
    loadProducts(searchQuery, catId);
  };

  const handleBarcodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeBuffer.trim()) return;

    const product = await findProductByBarcode(barcodeBuffer.trim());
    if (product) {
      onProductSelect(product);
      setBarcodeBuffer('');
    } else {
      // Try search as fallback
      const results = await searchPOSProducts(barcodeBuffer.trim());
      if (results.length === 1) {
        onProductSelect(results[0]);
      }
      setBarcodeBuffer('');
    }
  };

  // Global barcode listener - rapid keystrokes indicate scanner
  useEffect(() => {
    let buffer = '';
    let timeout: NodeJS.Timeout;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if typing in an input (except barcode input)
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      if (e.key === 'Enter' && buffer.length > 3) {
        e.preventDefault();
        findProductByBarcode(buffer).then((product) => {
          if (product) onProductSelect(product);
        });
        buffer = '';
        return;
      }

      if (e.key.length === 1) {
        buffer += e.key;
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          buffer = '';
        }, 100);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(timeout);
    };
  }, [onProductSelect]);

  const handleProductClick = (product: POSProduct) => {
    if (product.variants.length > 1) {
      // Show variant picker - for now pick first with stock
      const availableVariant = product.variants.find((v) => v.stock > 0);
      if (availableVariant) {
        onProductSelect(product, availableVariant.id);
      }
    } else if (product.variants.length === 1) {
      onProductSelect(product, product.variants[0].id);
    } else {
      onProductSelect(product);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Search Bar */}
      <div className="p-4 space-y-3 border-b border-gray-100 bg-white">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              ref={searchInputRef}
              placeholder="Search products (F2)..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-11 h-12 text-base bg-gray-50 border-gray-200 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl font-medium"
            />
          </div>
          <form onSubmit={handleBarcodeSubmit} className="flex gap-2">
            <div className="relative">
              <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                ref={barcodeInputRef}
                placeholder="Scan barcode..."
                value={barcodeBuffer}
                onChange={(e) => setBarcodeBuffer(e.target.value)}
                className="pl-11 h-12 w-48 bg-gray-50 border-gray-200 focus:bg-white focus:border-green-500 focus:ring-2 focus:ring-green-500/20 rounded-xl font-mono"
              />
            </div>
          </form>
          <div className="flex border border-gray-200 rounded-xl overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={cn('p-3 transition-colors', viewMode === 'grid' ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:bg-gray-50')}
            >
              <Grid3X3 className="h-5 w-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn('p-3 transition-colors', viewMode === 'list' ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:bg-gray-50')}
            >
              <List className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <button
            onClick={() => handleCategorySelect(undefined)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all border',
              !selectedCategory
                ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300'
            )}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategorySelect(cat.id === selectedCategory ? undefined : cat.id)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all border',
                selectedCategory === cat.id
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300'
              )}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Product Grid */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50/50">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <Package className="h-16 w-16 mb-4 opacity-30" />
            <p className="text-lg font-medium">No products found</p>
            <p className="text-sm">Try adjusting your search or filters</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {products.map((product) => (
              <button
                key={product.id}
                onClick={() => handleProductClick(product)}
                disabled={product.stock <= 0}
                className={cn(
                  'relative bg-white rounded-xl border p-3 text-left transition-all duration-150 group',
                  product.stock > 0
                    ? 'border-gray-200 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-100 active:scale-[0.98] cursor-pointer'
                    : 'border-gray-100 opacity-50 cursor-not-allowed'
                )}
              >
                {/* Image */}
                <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 mb-3">
                  {product.image ? (
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform"
                      sizes="150px"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="h-8 w-8 text-gray-300" />
                    </div>
                  )}

                  {/* Stock Badge */}
                  <div className="absolute top-1.5 right-1.5">
                    <Badge
                      variant="secondary"
                      className={cn(
                        'text-[10px] font-bold px-1.5 py-0.5 shadow-sm',
                        product.stock <= 0
                          ? 'bg-red-100 text-red-700 border border-red-200'
                          : product.stock <= 5
                          ? 'bg-amber-100 text-amber-700 border border-amber-200'
                          : 'bg-green-100 text-green-700 border border-green-200'
                      )}
                    >
                      {product.stock <= 0 
                        ? 'Out of stock' 
                        : product.stock <= 5 
                        ? `Low stock: ${product.stock}` 
                        : product.stock}
                    </Badge>
                  </div>

                  {/* Variants indicator */}
                  {product.variants.length > 1 && (
                    <div className="absolute bottom-1.5 left-1.5">
                      <Badge variant="secondary" className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5">
                        {product.variants.length} variants
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Info */}
                <p className="text-xs font-bold text-gray-900 line-clamp-2 leading-tight mb-1.5 min-h-[2rem]">
                  {product.name}
                </p>
                <div className="flex items-baseline justify-between">
                  <span className="text-sm font-black text-blue-600">
                    ৳{(product.offerPrice || product.price).toLocaleString()}
                  </span>
                  {product.offerPrice && product.offerPrice < product.price && (
                    <span className="text-[10px] text-gray-400 line-through">
                      ৳{product.price.toLocaleString()}
                    </span>
                  )}
                </div>
                {product.sku && (
                  <p className="text-[10px] text-gray-400 font-mono mt-1 truncate">{product.sku}</p>
                )}
              </button>
            ))}
          </div>
        ) : (
          /* List View */
          <div className="space-y-2">
            {products.map((product) => (
              <button
                key={product.id}
                onClick={() => handleProductClick(product)}
                disabled={product.stock <= 0}
                className={cn(
                  'w-full flex items-center gap-4 bg-white rounded-xl border p-3 text-left transition-all duration-150',
                  product.stock > 0
                    ? 'border-gray-200 hover:border-blue-300 hover:shadow-md active:scale-[0.99] cursor-pointer'
                    : 'border-gray-100 opacity-50 cursor-not-allowed'
                )}
              >
                <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                  {product.image ? (
                    <Image src={product.image} alt={product.name} fill className="object-cover" sizes="56px" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="h-6 w-6 text-gray-300" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">{product.name}</p>
                  <p className="text-xs text-gray-500">{product.categoryName} • {product.sku || 'No SKU'}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-black text-blue-600">
                    ৳{(product.offerPrice || product.price).toLocaleString()}
                  </p>
                  <Badge
                    variant="secondary"
                    className={cn(
                      'text-[10px] mt-1',
                      product.stock <= 0
                        ? 'bg-red-100 text-red-700'
                        : product.stock <= 5
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-green-100 text-green-700'
                    )}
                  >
                    Stock: {product.stock}
                  </Badge>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
