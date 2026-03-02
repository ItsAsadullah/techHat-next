'use client';

import { useRef, useState, memo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, ShoppingCart, Star, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { HomepageProduct } from '@/lib/homepage-types';
import { useCart } from '@/lib/context/cart-context';
import { useWishlist } from '@/lib/context/wishlist-context';
import QuickViewModal from '@/components/category-page/QuickViewModal';
import type { CategoryProduct } from '@/lib/types/category-page';

interface ProductCardProps {
  product: HomepageProduct;
  showStock?: boolean;
  className?: string;
}

function ProductCard({ product, showStock, className }: ProductCardProps) {
  const { addToCart } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();

  const cardRef = useRef<HTMLDivElement>(null);
  const cartBtnRef = useRef<HTMLButtonElement>(null);
  const [quickViewProduct, setQuickViewProduct] = useState<CategoryProduct | null>(null);

  const discount = product.discountPercentage
    ? Math.round(product.discountPercentage)
    : product.offerPrice
      ? Math.round(((product.price - product.offerPrice) / product.price) * 100)
      : 0;

  const displayPrice = product.offerPrice || product.price;
  const imageUrl = product.thumbnailUrl || product.images?.[0] || '';
  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;
  const wishlisted = isWishlisted(product.id);

  // Stock progress for flash sale
  const maxStock = 50;
  const stockPercent = showStock ? Math.min((product.stock / maxStock) * 100, 100) : 0;

  const handleAddRecentlyViewed = () => {
    try {
      const stored = localStorage.getItem('recently_viewed') || '[]';
      const ids: string[] = JSON.parse(stored);
      const updated = [product.id, ...ids.filter((id) => id !== product.id)].slice(0, 20);
      localStorage.setItem('recently_viewed', JSON.stringify(updated));
    } catch { /* ignore */ }
  };

  const openQuickView = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const imgUrl = product.thumbnailUrl || product.images?.[0] || '';
    setQuickViewProduct({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      offerPrice: product.offerPrice,
      discountPercentage: product.discountPercentage,
      stock: product.stock,
      minStock: 0,
      isFeatured: product.isFeatured,
      isFlashSale: product.isFlashSale,
      isBestSeller: product.isBestSeller,
      soldCount: product.soldCount,
      viewCount: product.viewCount,
      shortDesc: null,
      images: product.images?.length ? product.images : (imgUrl ? [imgUrl] : []),
      primaryImage: imgUrl || null,
      hoverImage: product.images?.[1] ?? null,
      brand: product.brandName ? { id: '', name: product.brandName, slug: '' } : null,
      avgRating: product.rating,
      reviewCount: product.reviewCount,
      warrantyMonths: null,
      warrantyType: null,
      specifications: null,
    });
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;
    addToCart(
      {
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        offerPrice: product.offerPrice,
        image: imageUrl || null,
        brand: product.brandName ?? null,
        stock: product.stock,
        warrantyMonths: null,
      },
      cartBtnRef.current
    );
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const sourceEl = (e.currentTarget as HTMLElement);
    toggleWishlist(
      {
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        offerPrice: product.offerPrice,
        image: imageUrl || null,
        brand: product.brandName ?? null,
        discountPercentage: product.discountPercentage,
        stock: product.stock,
      },
      sourceEl
    );
  };

  return (
    <div
      ref={cardRef}
      className={cn(
        'group relative bg-white rounded-xl border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-gray-200/50 hover:-translate-y-1',
        isOutOfStock && 'opacity-75',
        className
      )}
    >
    <Link
      href={`/products/${product.slug}`}
      onClick={handleAddRecentlyViewed}
      className="block"
    >
      {/* Image */}
      <div className="relative aspect-square bg-gray-50 overflow-hidden">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-contain p-3 group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <ShoppingCart className="w-10 h-10" />
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {discount > 0 && (
            <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-md">
              -{discount}%
            </span>
          )}
          {product.isFlashSale && (
            <span className="px-2 py-0.5 bg-orange-500 text-white text-xs font-bold rounded-md">
              ⚡ Flash
            </span>
          )}
          {isOutOfStock && (
            <span className="px-2 py-0.5 bg-gray-800 text-white text-xs font-bold rounded-md">
              Out of Stock
            </span>
          )}
          {!isOutOfStock && isLowStock && (
            <span className="px-2 py-0.5 bg-yellow-500 text-white text-xs font-bold rounded-md">
              Low Stock
            </span>
          )}
        </div>

        {/* Quick Actions — outside <Link> to avoid nested <a> */}
        <div className="absolute top-2 right-2 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <button
            onClick={handleWishlist}
            className={cn(
              'w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center transition-all duration-200',
              wishlisted
                ? 'text-red-500 bg-red-50 shadow-red-100'
                : 'hover:bg-red-50 hover:text-red-500'
            )}
            aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <Heart className={cn('w-4 h-4', wishlisted && 'fill-red-500')} />
          </button>
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleAddRecentlyViewed(); openQuickView(e); }}
            className="w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-blue-50 hover:text-blue-500 transition-colors"
            aria-label="Quick view"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="p-3 sm:p-4 space-y-2">
        {/* Category */}
        <span className="text-[11px] text-blue-600 font-medium uppercase tracking-wide">
          {product.categoryName}
        </span>

        {/* Name */}
        <h3 className="text-sm font-semibold text-gray-800 line-clamp-2 leading-snug group-hover:text-blue-600 transition-colors min-h-[2.5rem]">
          {product.name}
        </h3>

        {/* Rating */}
        {product.reviewCount > 0 && (
          <div className="flex items-center gap-1">
            <div className="flex items-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={cn(
                    'w-3 h-3',
                    star <= Math.round(product.rating)
                      ? 'text-amber-400 fill-amber-400'
                      : 'text-gray-200 fill-gray-200'
                  )}
                />
              ))}
            </div>
            <span className="text-xs text-gray-400">({product.reviewCount})</span>
          </div>
        )}

        {/* Price */}
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-bold text-gray-900">
            ৳{displayPrice.toLocaleString()}
          </span>
          {product.offerPrice && (
            <span className="text-sm text-gray-400 line-through">
              ৳{product.price.toLocaleString()}
            </span>
          )}
        </div>

        {/* Sold count indicator */}
        {product.soldCount > 0 && !showStock && (
          <p className="text-[11px] text-gray-400">{product.soldCount} sold</p>
        )}

        {/* Add to Cart button */}
        <button
          ref={cartBtnRef}
          onClick={handleAddToCart}
          disabled={isOutOfStock}
          className={cn(
            'w-full h-8 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all duration-200 mt-1',
            isOutOfStock
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-sm active:scale-95'
          )}
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
        </button>

        {/* Stock Indicator */}
        {showStock && product.stock > 0 && (
          <div className="space-y-1">
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  stockPercent < 30 ? 'bg-red-500' : stockPercent < 60 ? 'bg-orange-500' : 'bg-green-500'
                )}
                style={{ width: `${stockPercent}%` }}
              />
            </div>
            <p className="text-[11px] text-gray-500">
              {product.stock < 10 ? (
                <span className="text-red-500 font-medium">Only {product.stock} left!</span>
              ) : (
                `${product.stock} available`
              )}
            </p>
          </div>
        )}
      </div>
    </Link>

    <QuickViewModal
      product={quickViewProduct}
      onClose={() => setQuickViewProduct(null)}
    />
    </div>
  );
}

export default memo(ProductCard);
