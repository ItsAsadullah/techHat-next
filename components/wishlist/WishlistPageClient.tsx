'use client';

import { useState, useMemo, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  HeartOff,
  ShoppingCart,
  Trash2,
  Share2,
  Search,
  SlidersHorizontal,
  LayoutGrid,
  List,
  ArrowRight,
  Package,
  CheckCircle2,
  XCircle,
  ChevronDown,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { useWishlist } from '@/lib/context/wishlist-context';
import { useCart } from '@/lib/context/cart-context';
import type { WishlistItem } from '@/lib/types/cart-wishlist';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

type SortKey = 'default' | 'name-asc' | 'name-desc' | 'price-asc' | 'price-desc' | 'discount-desc';
type FilterKey = 'all' | 'in-stock' | 'discounted';
type ViewMode = 'grid' | 'list';

const SORT_LABELS: Record<SortKey, string> = {
  default: 'Date Added',
  'name-asc': 'Name (A → Z)',
  'name-desc': 'Name (Z → A)',
  'price-asc': 'Price: Low to High',
  'price-desc': 'Price: High to Low',
  'discount-desc': 'Biggest Discount',
};

const FILTER_LABELS: Record<FilterKey, string> = {
  all: 'All Items',
  'in-stock': 'In Stock Only',
  discounted: 'On Sale',
};

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyWishlist() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center py-24 px-6 text-center"
    >
      <div className="relative mb-8">
        <div className="w-32 h-32 rounded-full bg-gradient-to-br from-rose-50 to-pink-100 flex items-center justify-center shadow-inner">
          <HeartOff className="w-14 h-14 text-rose-300" strokeWidth={1.4} />
        </div>
        <motion.div
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-1 -right-1 w-8 h-8 bg-rose-500 rounded-full flex items-center justify-center shadow-lg"
        >
          <Heart className="w-4 h-4 text-white fill-white" />
        </motion.div>
      </div>

      <h2 className="text-2xl font-bold text-gray-900 mb-2">Your wishlist is empty</h2>
      <p className="text-gray-500 max-w-sm mb-8 leading-relaxed">
        Save products you love by clicking the heart icon. Come back anytime to view or purchase them.
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button asChild size="lg" className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-200">
          <Link href="/">
            Browse Products
            <ArrowRight className="w-4 h-4" />
          </Link>
        </Button>
        <Button asChild variant="outline" size="lg" className="gap-2">
          <Link href="/category/smartphones">
            <Package className="w-4 h-4" />
            View Categories
          </Link>
        </Button>
      </div>
    </motion.div>
  );
}

// ─── Product Card — Grid View ─────────────────────────────────────────────────

function WishlistGridCard({
  item,
  onRemove,
  onAddToCart,
}: {
  item: WishlistItem;
  onRemove: (id: string) => void;
  onAddToCart: (item: WishlistItem) => void;
}) {
  const displayPrice = item.offerPrice ?? item.price;
  const hasDiscount = item.discountPercentage != null && item.discountPercentage > 0;
  const isOutOfStock = item.stock === 0;
  const savings = hasDiscount ? item.price - displayPrice : 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.18 } }}
      transition={{ duration: 0.25 }}
      className="group relative bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-blue-100 transition-all duration-300 overflow-hidden flex flex-col"
    >
      {/* Badges */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5">
        {hasDiscount && (
          <span className="bg-gradient-to-r from-rose-500 to-pink-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
            -{Math.round(item.discountPercentage!)}% OFF
          </span>
        )}
        {isOutOfStock && (
          <span className="bg-gray-900 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
            Out of Stock
          </span>
        )}
      </div>

      {/* Remove button */}
      <button
        onClick={() => onRemove(item.id)}
        className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm border border-gray-200 flex items-center justify-center text-gray-400 hover:text-rose-500 hover:border-rose-200 hover:bg-rose-50 transition-all duration-200 shadow-sm opacity-0 group-hover:opacity-100"
        aria-label={`Remove ${item.name} from wishlist`}
      >
        <X className="w-3.5 h-3.5" />
      </button>

      {/* Image */}
      <Link href={`/products/${item.slug}`} className="relative block overflow-hidden bg-gray-50 aspect-square">
        {item.image ? (
          <Image
            src={item.image}
            alt={item.name}
            fill
            className="object-contain p-4 group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Package className="w-12 h-12 text-gray-200" />
          </div>
        )}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px]" />
        )}
      </Link>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4">
        {item.brand && (
          <p className="text-[11px] text-blue-600 font-semibold uppercase tracking-widest mb-1">{item.brand}</p>
        )}
        <Link
          href={`/products/${item.slug}`}
          className="text-sm font-semibold text-gray-800 line-clamp-2 hover:text-blue-600 transition-colors leading-snug mb-3 flex-1"
        >
          {item.name}
        </Link>

        {/* Price */}
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-lg font-bold text-gray-900">৳{displayPrice.toLocaleString()}</span>
          {hasDiscount && (
            <span className="text-sm text-gray-400 line-through">৳{item.price.toLocaleString()}</span>
          )}
        </div>
        {savings > 0 && (
          <p className="text-xs text-emerald-600 font-medium mb-3">You save ৳{savings.toLocaleString()}</p>
        )}

        {/* Stock indicator */}
        <div className={cn('flex items-center gap-1.5 text-xs mb-4', isOutOfStock ? 'text-rose-500' : 'text-emerald-600')}>
          {isOutOfStock ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
          <span>{isOutOfStock ? 'Currently out of stock' : `In Stock (${item.stock} left)`}</span>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-auto">
          <Button
            size="sm"
            className={cn(
              'flex-1 gap-1.5 text-xs h-9 font-semibold transition-all',
              isOutOfStock
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed hover:bg-gray-100'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-sm shadow-blue-200'
            )}
            disabled={isOutOfStock}
            onClick={() => onAddToCart(item)}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            Add to Cart
          </Button>
          <button
            onClick={() => onRemove(item.id)}
            className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:text-rose-500 hover:border-rose-200 hover:bg-rose-50 transition-all duration-200 flex-shrink-0"
            aria-label="Remove from wishlist"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Product Card — List View ─────────────────────────────────────────────────

function WishlistListCard({
  item,
  onRemove,
  onAddToCart,
}: {
  item: WishlistItem;
  onRemove: (id: string) => void;
  onAddToCart: (item: WishlistItem) => void;
}) {
  const displayPrice = item.offerPrice ?? item.price;
  const hasDiscount = item.discountPercentage != null && item.discountPercentage > 0;
  const isOutOfStock = item.stock === 0;
  const savings = hasDiscount ? item.price - displayPrice : 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40, transition: { duration: 0.18 } }}
      transition={{ duration: 0.25 }}
      className="group flex gap-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:border-blue-100 transition-all duration-300 p-4 items-start"
    >
      {/* Image */}
      <Link href={`/products/${item.slug}`} className="relative w-24 h-24 flex-shrink-0 rounded-xl bg-gray-50 overflow-hidden">
        {item.image ? (
          <Image
            src={item.image}
            alt={item.name}
            fill
            className="object-contain p-2 group-hover:scale-105 transition-transform duration-500"
            sizes="96px"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Package className="w-8 h-8 text-gray-200" />
          </div>
        )}
        {isOutOfStock && <div className="absolute inset-0 bg-white/50" />}
      </Link>

      {/* Info */}
      <div className="flex-1 min-w-0">
        {item.brand && (
          <p className="text-[10px] text-blue-600 font-semibold uppercase tracking-widest mb-0.5">{item.brand}</p>
        )}
        <Link
          href={`/products/${item.slug}`}
          className="text-sm font-semibold text-gray-800 hover:text-blue-600 transition-colors line-clamp-2 leading-snug"
        >
          {item.name}
        </Link>

        <div className="flex items-baseline gap-2 mt-2">
          <span className="text-base font-bold text-gray-900">৳{displayPrice.toLocaleString()}</span>
          {hasDiscount && (
            <>
              <span className="text-sm text-gray-400 line-through">৳{item.price.toLocaleString()}</span>
              <Badge className="bg-rose-50 text-rose-600 border-rose-100 text-[10px] font-bold px-1.5">
                -{Math.round(item.discountPercentage!)}%
              </Badge>
            </>
          )}
        </div>
        {savings > 0 && <p className="text-xs text-emerald-600 font-medium mt-0.5">Save ৳{savings.toLocaleString()}</p>}

        <div className={cn('flex items-center gap-1 text-xs mt-1.5', isOutOfStock ? 'text-rose-500' : 'text-emerald-600')}>
          {isOutOfStock ? <XCircle className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
          <span>{isOutOfStock ? 'Out of Stock' : `In Stock (${item.stock})`}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex-shrink-0 flex flex-col gap-2 items-end">
        <button
          onClick={() => onRemove(item.id)}
          className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:text-rose-500 hover:border-rose-200 hover:bg-rose-50 transition-all duration-200"
          aria-label="Remove"
        >
          <X className="w-3.5 h-3.5" />
        </button>
        <Button
          size="sm"
          className={cn(
            'gap-1.5 text-xs h-9 font-semibold whitespace-nowrap',
            isOutOfStock
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed hover:bg-gray-100'
              : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-sm shadow-blue-200'
          )}
          disabled={isOutOfStock}
          onClick={() => onAddToCart(item)}
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          Add to Cart
        </Button>
      </div>
    </motion.div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function WishlistPageClient() {
  const { items, count, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();

  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortKey>('default');
  const [filter, setFilter] = useState<FilterKey>('all');
  const [view, setView] = useState<ViewMode>('grid');

  // ── Derived filtered+sorted items ──────────────────────────────────────
  const displayItems = useMemo(() => {
    let result = [...items];

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          (i.brand?.toLowerCase() ?? '').includes(q)
      );
    }

    // Filter
    if (filter === 'in-stock') result = result.filter((i) => i.stock > 0);
    if (filter === 'discounted')
      result = result.filter((i) => i.discountPercentage != null && i.discountPercentage > 0);

    // Sort
    switch (sort) {
      case 'name-asc':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-desc':
        result.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'price-asc':
        result.sort((a, b) => (a.offerPrice ?? a.price) - (b.offerPrice ?? b.price));
        break;
      case 'price-desc':
        result.sort((a, b) => (b.offerPrice ?? b.price) - (a.offerPrice ?? a.price));
        break;
      case 'discount-desc':
        result.sort((a, b) => (b.discountPercentage ?? 0) - (a.discountPercentage ?? 0));
        break;
    }

    return result;
  }, [items, search, sort, filter]);

  // ── Stats ───────────────────────────────────────────────────────────────
  const totalSavings = useMemo(
    () =>
      items.reduce((sum, i) =>
        sum + (i.offerPrice != null ? i.price - i.offerPrice : 0), 0),
    [items]
  );
  const inStockCount = useMemo(() => items.filter((i) => i.stock > 0).length, [items]);
  const onSaleCount = useMemo(() => items.filter((i) => (i.discountPercentage ?? 0) > 0).length, [items]);

  // ── Handlers ────────────────────────────────────────────────────────────
  const handleRemove = useCallback(
    (id: string) => {
      const item = items.find((i) => i.id === id);
      removeFromWishlist(id);
      toast.success(`Removed from wishlist`, { description: item?.name?.slice(0, 50) });
    },
    [items, removeFromWishlist]
  );

  const handleAddToCart = useCallback(
    (item: WishlistItem) => {
      addToCart({
        id: item.id,
        name: item.name,
        slug: item.slug,
        price: item.price,
        offerPrice: item.offerPrice,
        image: item.image,
        brand: item.brand,
        stock: item.stock,
        warrantyMonths: null,
      });
      removeFromWishlist(item.id);
      toast.success('Moved to cart!', { description: item.name.slice(0, 50) });
    },
    [addToCart, removeFromWishlist]
  );

  const handleMoveAllToCart = useCallback(() => {
    const inStock = items.filter((i) => i.stock > 0);
    if (inStock.length === 0) {
      toast.error('No in-stock items to add.');
      return;
    }
    inStock.forEach((item) => {
      addToCart({
        id: item.id,
        name: item.name,
        slug: item.slug,
        price: item.price,
        offerPrice: item.offerPrice,
        image: item.image,
        brand: item.brand,
        stock: item.stock,
        warrantyMonths: null,
      });
      removeFromWishlist(item.id);
    });
    toast.success(`${inStock.length} item${inStock.length > 1 ? 's' : ''} added to cart!`);
  }, [items, addToCart, removeFromWishlist]);

  const handleClearAll = useCallback(() => {
    items.forEach((i) => removeFromWishlist(i.id));
    toast.success('Wishlist cleared');
  }, [items, removeFromWishlist]);

  const handleShare = useCallback(() => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      toast.success('Link copied!', { description: 'Share your wishlist with anyone.' });
    }).catch(() => {
      toast.error('Could not copy link.');
    });
  }, []);

  // ── Empty state ─────────────────────────────────────────────────────────
  if (count === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4 pt-10 pb-24">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs text-gray-400 mb-8">
            <Link href="/" className="hover:text-gray-600 transition-colors">Home</Link>
            <span>/</span>
            <span className="text-gray-700 font-medium">Wishlist</span>
          </nav>
          <EmptyWishlist />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50/80 to-white">
      <div className="container mx-auto px-4 pt-8 pb-24">
        {/* ── Breadcrumb ── */}
        <nav className="flex items-center gap-2 text-xs text-gray-400 mb-6">
          <Link href="/" className="hover:text-gray-600 transition-colors">Home</Link>
          <span>/</span>
          <span className="text-gray-700 font-medium">Wishlist</span>
        </nav>

        {/* ── Page Title & Actions ── */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shadow-lg shadow-rose-200">
                <Heart className="w-5 h-5 text-white fill-white" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Wishlist</h1>
              <span className="px-3 py-1 bg-rose-50 text-rose-600 text-sm font-semibold rounded-full border border-rose-100">
                {count} {count === 1 ? 'item' : 'items'}
              </span>
            </div>
            <p className="text-sm text-gray-500 ml-[52px]">
              {inStockCount} in stock · {onSaleCount} on sale
              {totalSavings > 0 && ` · Save up to ৳${totalSavings.toLocaleString()}`}
            </p>
          </div>

          {/* Header actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs h-8 border-gray-200 text-gray-600 hover:text-blue-600 hover:border-blue-200"
              onClick={handleShare}
            >
              <Share2 className="w-3.5 h-3.5" />
              Share
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs h-8 border-gray-200 text-gray-600 hover:text-rose-600 hover:border-rose-200"
              onClick={handleClearAll}
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear All
            </Button>
            <Button
              size="sm"
              className="gap-1.5 text-xs h-8 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-sm shadow-blue-200 font-semibold"
              onClick={handleMoveAllToCart}
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              Add All to Cart
            </Button>
          </div>
        </div>

        {/* ── Stats Banner ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {[
            { label: 'Total Items', value: count.toString(), color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'In Stock', value: inStockCount.toString(), color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'On Sale', value: onSaleCount.toString(), color: 'text-rose-600', bg: 'bg-rose-50' },
            { label: 'Total Savings', value: totalSavings > 0 ? `৳${totalSavings.toLocaleString()}` : '—', color: 'text-amber-600', bg: 'bg-amber-50' },
          ].map((stat) => (
            <div key={stat.label} className={cn('rounded-xl px-4 py-3 border border-transparent', stat.bg)}>
              <p className="text-xs text-gray-500 mb-0.5">{stat.label}</p>
              <p className={cn('text-xl font-bold', stat.color)}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* ── Toolbar ── */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center mb-6">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search in wishlist…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 bg-white border-gray-200 text-sm focus:border-blue-400 focus:ring-blue-100"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex gap-2 items-center">
            {/* Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-10 gap-1.5 text-xs border-gray-200 bg-white">
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  {FILTER_LABELS[filter]}
                  <ChevronDown className="w-3 h-3 text-gray-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuLabel className="text-xs text-gray-500">Filter By</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup value={filter} onValueChange={(v) => setFilter(v as FilterKey)}>
                  {(Object.keys(FILTER_LABELS) as FilterKey[]).map((key) => (
                    <DropdownMenuRadioItem key={key} value={key} className="text-sm cursor-pointer">
                      {FILTER_LABELS[key]}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Sort */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-10 gap-1.5 text-xs border-gray-200 bg-white">
                  {SORT_LABELS[sort]}
                  <ChevronDown className="w-3 h-3 text-gray-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel className="text-xs text-gray-500">Sort By</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup value={sort} onValueChange={(v) => setSort(v as SortKey)}>
                  {(Object.keys(SORT_LABELS) as SortKey[]).map((key) => (
                    <DropdownMenuRadioItem key={key} value={key} className="text-sm cursor-pointer">
                      {SORT_LABELS[key]}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* View Toggle */}
            <div className="flex items-center bg-white border border-gray-200 rounded-lg h-10 p-1 gap-0.5">
              <button
                onClick={() => setView('grid')}
                className={cn(
                  'p-1.5 rounded-md transition-all duration-150',
                  view === 'grid' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'
                )}
                aria-label="Grid view"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setView('list')}
                className={cn(
                  'p-1.5 rounded-md transition-all duration-150',
                  view === 'list' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'
                )}
                aria-label="List view"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* ── Results count ── */}
        {(search || filter !== 'all') && (
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">
              Showing <span className="font-semibold text-gray-800">{displayItems.length}</span> of {count} items
            </p>
            {(search || filter !== 'all') && (
              <button
                onClick={() => { setSearch(''); setFilter('all'); setSort('default'); }}
                className="text-xs text-blue-600 hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>
        )}

        {/* ── Items Grid / List ── */}
        <AnimatePresence mode="popLayout">
          {displayItems.length === 0 ? (
            <motion.div
              key="no-results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-20"
            >
              <Search className="w-12 h-12 text-gray-200 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">No items match your search.</p>
              <button onClick={() => { setSearch(''); setFilter('all'); }} className="text-sm text-blue-600 hover:underline mt-2">
                Reset filters
              </button>
            </motion.div>
          ) : view === 'grid' ? (
            <motion.div
              key="grid"
              layout
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
            >
              <AnimatePresence mode="popLayout">
                {displayItems.map((item) => (
                  <WishlistGridCard
                    key={item.id}
                    item={item}
                    onRemove={handleRemove}
                    onAddToCart={handleAddToCart}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          ) : (
            <motion.div
              key="list"
              layout
              className="flex flex-col gap-3"
            >
              <AnimatePresence mode="popLayout">
                {displayItems.map((item) => (
                  <WishlistListCard
                    key={item.id}
                    item={item}
                    onRemove={handleRemove}
                    onAddToCart={handleAddToCart}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Sticky Bottom CTA (mobile) ── */}
        {count > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 sm:hidden">
            <motion.div
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="backdrop-blur-md border border-gray-200 rounded-2xl shadow-2xl px-5 py-3 flex items-center gap-3"
              style={{ backgroundColor: 'rgba(255,255,255,0.95)' }}
            >
              <div className="text-xs text-gray-500">{inStockCount} items available</div>
              <Button
                size="sm"
                className="gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow-sm shadow-blue-200 text-xs h-8"
                onClick={handleMoveAllToCart}
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                Add All to Cart
              </Button>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
