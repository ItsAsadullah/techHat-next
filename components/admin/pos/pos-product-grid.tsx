'use client';

import { useState, useEffect, useRef, useCallback, memo } from 'react';
import { Search, Barcode, Package, Grid3X3, List, Loader2, Eye, ScanLine, X, ExternalLink } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { searchPOSProducts, findProductByBarcode, type POSProduct } from '@/lib/actions/pos-actions';
import { useDebouncedCallback } from 'use-debounce';
import Image from 'next/image';
import { useGlobalScanner } from '@/components/admin/global-scanner-provider';

interface POSProductGridProps {
  categories: { id: string; name: string }[];
  onProductSelect: (product: POSProduct, variantId?: string) => void;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
  initialProducts?: POSProduct[];
}

export function POSProductGrid({ categories, onProductSelect, searchInputRef, initialProducts = [] }: POSProductGridProps) {
  const [products, setProducts] = useState<POSProduct[]>(initialProducts);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const [barcodeBuffer, setBarcodeBuffer] = useState('');
  const [showScannerModal, setShowScannerModal] = useState(false);

    // -- Mobile scanner integration ------------------------------------------------
  // Use lastScanEvent (not lastScannedCode) so the same barcode scanned twice
  // still triggers a new product lookup (t = Date.now() always differs).
  const { lastScanEvent, scannerUrl } = useGlobalScanner();
  const processedScanRef = useRef<number>(0);

  useEffect(() => {
    if (!lastScanEvent || lastScanEvent.t === processedScanRef.current) return;
    processedScanRef.current = lastScanEvent.t;
    const { code } = lastScanEvent;
    findProductByBarcode(code).then((product) => {
      if (product) {
        onProductSelect(product, product.variants[0]?.id);
        setShowScannerModal(false); // Auto-close after scan
      } else {
        searchPOSProducts(code).then((results) => {
          if (results.length === 1) {
            onProductSelect(results[0], results[0].variants[0]?.id);
            setShowScannerModal(false); // Auto-close after scan
          }
        });
      }
    });
  }, [lastScanEvent, onProductSelect]);

  // Initial load is now handled via server-side props (initialProducts)
  // We only need to fetch if the search query or category changes.
  // The component mounts with the pre-fetched products, avoiding the loading spinner!

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

  // PERF: Increased debounce from 150ms → 300ms to reduce API calls during
  // rapid typing. 150ms was too aggressive — users type faster than that,
  // causing unnecessary intermediate searches that get discarded.
  const debouncedSearch = useDebouncedCallback((query: string) => {
    loadProducts(query, selectedCategory);
  }, 300);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    
    // INSTANT FEEDBACK: Filter the initial products locally for zero-latency search
    // This makes the UI feel instantly responsive while the debounced server request
    // runs in the background to fetch the complete results.
    if (!selectedCategory) {
      if (value.trim().length > 0) {
        const q = value.toLowerCase();
        
        const getScore = (p: POSProduct) => {
          let score = 0;
          const name = p.name.toLowerCase();
          const sku = p.sku?.toLowerCase() || '';
          const model = p.model?.toLowerCase() || '';
          const barcode = p.barcode?.toLowerCase() || '';
          
          // Product Model gets highest priority
          if (model === q) score += 1000;
          else if (model.startsWith(q)) score += 500;
          else if (model.includes(q)) score += 100;
          
          // Product Title gets second highest priority
          if (name === q) score += 800;
          else if (name.startsWith(q)) score += 400;
          else if (name.includes(q)) score += 50;

          // SKU/Barcode gets third priority
          if (sku === q || barcode === q) score += 600;
          else if (sku.startsWith(q) || barcode.startsWith(q)) score += 300;
          else if (sku.includes(q) || barcode.includes(q)) score += 30;
          
          for (const v of p.variants) {
             const vsku = v.sku?.toLowerCase() || '';
             if (vsku === q) score += 600;
             else if (vsku.startsWith(q)) score += 300;
             else if (vsku.includes(q)) score += 30;
          }

          return score;
        };

        const localMatches = initialProducts
          .map(p => ({ product: p, score: getScore(p) }))
          .filter(x => x.score > 0)
          .sort((a, b) => b.score - a.score)
          .map(x => x.product);

        // Only set local matches if we found some, otherwise wait for server
        if (localMatches.length > 0) {
          setProducts(localMatches);
        }
      } else {
        setProducts(initialProducts);
      }
    }
    
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

  const handleProductClick = useCallback((product: POSProduct) => {
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
  }, [onProductSelect]);

  return (
    <div className="flex flex-col h-full">
      {/* Search Bar */}
      <div className="px-3 py-2 sm:px-4 sm:py-3 space-y-2 border-b border-gray-100 bg-white">
        <div className="flex items-center gap-2">
          {/* Search + Scanner button */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <input
              ref={searchInputRef}
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-9 pr-10 h-9 sm:h-10 text-sm bg-gray-50 border border-gray-200 focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 rounded-lg font-medium"
            />
            {/* Scanner trigger button inside search box */}
            <button
              onClick={() => setShowScannerModal(true)}
              title="Scan barcode"
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-blue-600 transition-colors"
            >
              <ScanLine className="h-4 w-4" />
            </button>
          </div>
          {/* View Toggle */}
          <div className="flex border border-gray-200 rounded-lg overflow-hidden shrink-0">
            <button
              onClick={() => setViewMode('grid')}
              className={cn('p-2 transition-colors flex items-center justify-center', viewMode === 'grid' ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:bg-gray-50')}
            >
              <Grid3X3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn('p-2 transition-colors flex items-center justify-center', viewMode === 'list' ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:bg-gray-50')}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Category Filters — compact */}
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide">
          <button
            onClick={() => handleCategorySelect(undefined)}
            className={cn(
              'px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all border shrink-0',
              !selectedCategory
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            )}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategorySelect(cat.id === selectedCategory ? undefined : cat.id)}
              className={cn(
                'px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all border shrink-0',
                selectedCategory === cat.id
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              )}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Product Grid */}
      <div className="flex-1 overflow-y-auto p-2 sm:p-4 bg-gray-50/50">
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
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3">
            {products.map((product) => (
              <ProductGridCard
                key={product.id}
                product={product}
                onClick={handleProductClick}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {products.map((product) => (
              <ProductListItem
                key={product.id}
                product={product}
                onClick={handleProductClick}
              />
            ))}
          </div>
        )}
      </div>

      {/* Scanner Modal Popup */}
      {showScannerModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <ScanLine className="h-4 w-4 text-blue-600" />
                </div>
                <h3 className="font-bold text-gray-900">Scan Barcode</h3>
              </div>
              <button
                onClick={() => setShowScannerModal(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {scannerUrl ? (
              <>
                <p className="text-xs text-gray-500 mb-3 text-center">Open this URL on your phone camera to scan:</p>
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-xs font-mono text-blue-600 break-all mb-2">{scannerUrl}</p>
                  <a
                    href={scannerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
                  >
                    Open Scanner <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                <p className="text-xs text-center text-gray-400 mt-3">This popup will close automatically when a product is scanned.</p>
              </>
            ) : (
              <>
                <p className="text-xs text-gray-500 mb-3">Or type/paste a barcode manually:</p>
                <form onSubmit={handleBarcodeSubmit}>
                  <div className="relative">
                    <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      ref={barcodeInputRef}
                      autoFocus
                      placeholder="Scan or type barcode..."
                      value={barcodeBuffer}
                      onChange={(e) => setBarcodeBuffer(e.target.value)}
                      className="w-full pl-9 pr-4 h-10 bg-gray-50 border border-gray-200 focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 rounded-xl font-mono text-sm"
                    />
                  </div>
                  <button type="submit" className="w-full mt-3 h-10 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition-colors">
                    Lookup Product
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// PERF: Extracted memoized product card components. React.memo prevents
// re-rendering a card when sibling cards change or parent re-renders
// due to search/filter state updates. Only the card whose props changed
// will re-render — saving ~80% of render work in a 30-card grid.
// ═══════════════════════════════════════════════════════════════════════

interface ProductCardProps {
  product: POSProduct;
  onClick: (product: POSProduct) => void;
}

const ProductGridCard = memo(function ProductGridCard({ product, onClick }: ProductCardProps) {
  const salePrice = product.offerPrice || product.price;
  const costPrice = product.costPrice || 0;
  const profit = salePrice - costPrice;

  return (
    <div
      onClick={() => {
        if (product.stock > 0) onClick(product);
      }}
      className={cn(
        'relative flex flex-col bg-white rounded-xl border p-2 text-left transition-all duration-150 group',
        product.stock > 0
          ? 'border-gray-200 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-100 active:scale-[0.98] cursor-pointer'
          : 'border-gray-100 opacity-50 cursor-not-allowed'
      )}
    >
      {/* Eye Icon for Price Details */}
      <div className="absolute top-1.5 left-1.5 z-10" onClick={(e) => e.stopPropagation()}>
        <Popover>
          <PopoverTrigger asChild>
            <button className="p-1 bg-white/90 backdrop-blur-md hover:bg-blue-50 rounded-md shadow-sm border border-gray-200 text-gray-500 hover:text-blue-600 transition-colors">
              <Eye className="w-3 h-3" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-3 shadow-xl" side="right" align="start">
            <p className="text-xs font-bold text-gray-900 mb-2 border-b border-gray-100 pb-1">Price Details</p>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Buy Price:</span>
                <span className="font-semibold text-rose-600">৳{costPrice.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Sale Price:</span>
                <span className="font-semibold text-emerald-600">৳{salePrice.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center pt-1.5 mt-1.5 border-t border-gray-100">
                <span className="font-bold text-gray-700">Profit:</span>
                <span className="font-black text-blue-600">৳{profit.toLocaleString()}</span>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Image — compact on mobile */}
      <div className="relative aspect-[4/3] sm:aspect-square rounded-lg overflow-hidden bg-gray-100 mb-2">
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
            <Package className="h-6 w-6 text-gray-300" />
          </div>
        )}

        {/* Stock Badge */}
        <div className="absolute top-1 right-1">
          <Badge
            variant="secondary"
            className={cn(
              'text-[9px] font-bold px-1 py-0 shadow-sm leading-4',
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
              ? `Low: ${product.stock}` 
              : product.stock}
          </Badge>
        </div>

        {/* Variants indicator */}
        {product.variants.length > 1 && (
          <div className="absolute bottom-1 left-1">
            <Badge variant="secondary" className="text-[9px] bg-purple-100 text-purple-700 px-1 py-0 leading-4">
              {product.variants.length}v
            </Badge>
          </div>
        )}
      </div>

      {/* Info */}
      <p className="text-[10px] font-bold text-gray-900 line-clamp-2 leading-tight mb-1 min-h-[2rem]">
        {product.name}
      </p>
      <div className="flex items-baseline justify-between">
        <span className="text-xs font-black text-blue-600">
          ৳{(product.offerPrice || product.price).toLocaleString()}
        </span>
        {product.offerPrice && product.offerPrice < product.price && (
          <span className="text-[9px] text-gray-400 line-through">
            ৳{product.price.toLocaleString()}
          </span>
        )}
      </div>
      {product.sku && (
        <p className="text-[9px] text-gray-400 font-mono mt-0.5 truncate">{product.sku}</p>
      )}
    </div>
  );
});

const ProductListItem = memo(function ProductListItem({ product, onClick }: ProductCardProps) {
  const salePrice = product.offerPrice || product.price;
  const costPrice = product.costPrice || 0;
  const profit = salePrice - costPrice;

  return (
    <div
      onClick={() => {
        if (product.stock > 0) onClick(product);
      }}
      className={cn(
        'w-full flex items-center gap-2 sm:gap-4 bg-white rounded-xl border p-2 sm:p-3 text-left transition-all duration-150 relative group',
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
      
      {/* Eye Icon for Price Details */}
      <div className="shrink-0 ml-2" onClick={(e) => e.stopPropagation()}>
        <Popover>
          <PopoverTrigger asChild>
            <button className="p-2 bg-gray-50 hover:bg-blue-50 rounded-lg border border-gray-200 text-gray-400 hover:text-blue-600 transition-colors">
              <Eye className="w-4 h-4" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-3 shadow-xl" side="left" align="center">
            <p className="text-xs font-bold text-gray-900 mb-2 border-b border-gray-100 pb-1">Price Details</p>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Buy Price:</span>
                <span className="font-semibold text-rose-600">৳{costPrice.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Sale Price:</span>
                <span className="font-semibold text-emerald-600">৳{salePrice.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center pt-1.5 mt-1.5 border-t border-gray-100">
                <span className="font-bold text-gray-700">Profit:</span>
                <span className="font-black text-blue-600">৳{profit.toLocaleString()}</span>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
});
