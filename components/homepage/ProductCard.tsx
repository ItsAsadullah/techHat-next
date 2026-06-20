'use client';

import { useState, useRef, memo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCart, Heart, Eye, Star, Zap, Award, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useCart } from '@/lib/context/cart-context';
import { useWishlist } from '@/lib/context/wishlist-context';
import { toast } from 'sonner';
import QuickViewModal from '@/components/category-page/QuickViewModal';

function StarRating({ rating, count }: { rating: number; count: number }) {
  return (
    <div className="flex items-center gap-1">
      <div className="flex">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={cn(
              'h-3 w-3',
              i < Math.floor(rating)
                ? 'fill-amber-400 text-amber-400'
                : i < rating
                ? 'fill-amber-200 text-amber-400'
                : 'text-muted-foreground/30'
            )}
          />
        ))}
      </div>
      {count > 0 && <span className="text-[11px] text-muted-foreground">({count})</span>}
    </div>
  );
}

interface ProductCardProps {
  product: any;
  showStock?: boolean;
  className?: string;
  onQuickView?: (product: any) => void;
}

function ProductCard({ product, showStock, className, onQuickView }: ProductCardProps) {
  const [imgError, setImgError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [heartAnimating, setHeartAnimating] = useState(false);
  const [internalQuickView, setInternalQuickView] = useState<any | null>(null);

  const cartBtnRef = useRef<HTMLButtonElement | null>(null);
  const heartBtnRef = useRef<HTMLButtonElement | null>(null);

  const { addToCart } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();
  const wishlisted = isWishlisted(product.id);

  const displayPrice = product.offerPrice ?? product.price;
  const hasDiscount = product.discountPercentage != null && product.discountPercentage > 0;
  const isLowStock = product.stock > 0 && product.stock <= (product.minStock ?? 5);
  const isOutOfStock = product.stock <= 0;

  const primarySrc = product.primaryImage ?? product.thumbnailUrl ?? product.images?.[0] ?? '';
  const hoverSrc = product.hoverImage ?? product.images?.[1] ?? primarySrc;
  const showHover = isHovered && !!hoverSrc && hoverSrc !== primarySrc;
  
  const brandName = product.brand?.name ?? product.brandName;
  const ratingValue = product.avgRating ?? product.rating ?? 0;
  const reviewCount = product.reviewCount ?? 0;

  // Stock progress for flash sale
  const maxStock = 50;
  const stockPercent = showStock ? Math.min((product.stock / maxStock) * 100, 100) : 0;

  const handleAddRecentlyViewed = () => {
    try {
      const stored = localStorage.getItem('recently_viewed') || '[]';
      const ids: string[] = JSON.parse(stored);
      const updated = [product.id, ...ids.filter((id: string) => id !== product.id)].slice(0, 20);
      localStorage.setItem('recently_viewed', JSON.stringify(updated));
    } catch { /* ignore */ }
  };

  const handleQuickView = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleAddRecentlyViewed();
    if (onQuickView) {
      onQuickView(product);
    } else {
      setInternalQuickView({
        ...product,
        images: product.images?.length ? product.images : (primarySrc ? [primarySrc] : []),
        primaryImage: primarySrc || null,
        hoverImage: hoverSrc || null,
        avgRating: ratingValue,
        brand: brandName ? { id: '', name: brandName, slug: '' } : null,
      });
    }
  };

  return (
    <div
      className={cn(
        'group relative bg-background border rounded-xl overflow-hidden transition-all duration-200',
        'hover:shadow-lg hover:border-primary/20 hover:-translate-y-0.5 flex flex-col h-full',
        isOutOfStock && 'opacity-75',
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image area */}
      <div className="relative aspect-square overflow-hidden bg-muted/30">
        <Link href={`/products/${product.slug}`} aria-label={product.name} onClick={handleAddRecentlyViewed}>
          {primarySrc && !imgError ? (
            <>
              <Image
                src={primarySrc}
                alt={product.name}
                fill
                className={cn(
                  'object-cover transition-all duration-700 ease-in-out',
                  showHover ? 'opacity-0' : 'opacity-100 group-hover:scale-105'
                )}
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                onError={() => setImgError(true)}
              />
              {hoverSrc && hoverSrc !== primarySrc && (
                <Image
                  src={hoverSrc}
                  alt={`${product.name} alternate view`}
                  fill
                  className={cn(
                    'object-cover transition-all duration-700 ease-in-out',
                    showHover ? 'opacity-100 scale-105' : 'opacity-0 scale-100'
                  )}
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                />
              )}
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/30">
              <ShoppingCart className="w-12 h-12" />
            </div>
          )}
        </Link>

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
          {hasDiscount && (
            <Badge className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 font-bold shadow-sm border-0 rounded-md">
              -{Math.round(product.discountPercentage!)}%
            </Badge>
          )}
          {product.isFlashSale && (
            <Badge className="bg-orange-500 text-white text-[10px] px-1.5 py-0.5 flex items-center gap-0.5 shadow-sm border-0 rounded-md">
              <Zap className="h-2.5 w-2.5" />
              Flash
            </Badge>
          )}
          {product.isBestSeller && !product.isFlashSale && (
            <Badge className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 flex items-center gap-0.5 shadow-sm border-0 rounded-md">
              <Award className="h-2.5 w-2.5" />
              Best
            </Badge>
          )}
        </div>

        {/* Stock badge */}
        <div className="absolute top-2 right-2 z-10">
          {isOutOfStock ? (
            <Badge variant="outline" className="bg-background/80 text-destructive border-destructive/20 text-[10px] rounded-md">
              Out of Stock
            </Badge>
          ) : isLowStock && !showStock ? (
            <Badge variant="outline" className="bg-background/80 text-amber-600 border-amber-200 text-[10px] rounded-md">
              Only {product.stock} left
            </Badge>
          ) : null}
        </div>

        {/* Action buttons */}
        <div className={cn(
          'absolute inset-x-0 bottom-0 flex items-center justify-around p-2 bg-gradient-to-t from-background/95 to-transparent',
          'translate-y-full group-hover:translate-y-0 transition-transform duration-200 z-10'
        )}>
          <button
            ref={heartBtnRef}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setHeartAnimating(true);
              setTimeout(() => setHeartAnimating(false), 600);
              toggleWishlist(
                {
                  id: product.id,
                  name: product.name,
                  slug: product.slug,
                  price: product.price,
                  offerPrice: product.offerPrice,
                  image: primarySrc ?? null,
                  brand: brandName ?? null,
                  discountPercentage: product.discountPercentage,
                  stock: product.stock,
                },
                heartBtnRef.current
              );
              if (!wishlisted) toast.success('Added to Wishlist');
            }}
            className={cn(
              'p-1.5 rounded-full bg-background shadow border transition-all duration-200',
              wishlisted ? 'text-red-500 border-red-200' : 'hover:text-red-500 hover:border-red-200',
              heartAnimating && (wishlisted ? 'scale-90' : 'scale-125')
            )}
            aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <Heart className={cn('h-3.5 w-3.5 transition-transform', wishlisted && 'fill-red-500')} />
          </button>

          <Button
            ref={cartBtnRef}
            size="sm"
            className="flex-1 mx-2 h-7 text-xs gap-1"
            disabled={isOutOfStock}
            onClick={(e) => {
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
                  image: primarySrc ?? null,
                  brand: brandName ?? null,
                  stock: product.stock,
                  warrantyMonths: product.warrantyMonths,
                },
                cartBtnRef.current
              );
              toast.success(`${product.name.slice(0, 25)}... added to cart`);
            }}
          >
            <ShoppingCart className="h-3 w-3" />
            {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
          </Button>

          <button
            onClick={handleQuickView}
            className="p-1.5 rounded-full bg-background shadow border hover:text-primary hover:border-primary/20 transition-colors"
            aria-label="Quick view"
          >
            <Eye className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Product info */}
      <div className="p-3 sm:p-4 space-y-1.5 flex flex-col flex-grow">
        {/* Brand / Category */}
        <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide truncate">
          {brandName || product.categoryName}
        </p>

        {/* Name */}
        <Link href={`/products/${product.slug}`} onClick={handleAddRecentlyViewed}>
          <h3 className="text-sm font-medium leading-snug line-clamp-2 hover:text-primary transition-colors min-h-[2.5rem]">
            {product.name}
          </h3>
        </Link>

        {/* Key Features (Specs) */}
        {product.specs && product.specs.length > 0 && (
          <ul className="text-[11px] text-muted-foreground space-y-1 my-2 list-none">
            {product.specs.slice(0, 4).map((spec: any, i: number) => (
              <li key={i} className="flex items-start gap-1">
                <span className="text-muted-foreground/70 mt-0.5 leading-none">•</span>
                <span className="line-clamp-1 leading-tight"><span className="text-foreground/80 font-medium">{spec.name}:</span> {spec.value}</span>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-auto">
          {/* Rating */}
          {reviewCount > 0 && (
            <div className="mb-1.5">
              <StarRating rating={ratingValue} count={reviewCount} />
            </div>
          )}

          {/* Price */}
          <div className="flex items-baseline gap-2 flex-wrap mb-1">
            <span className="font-bold text-base">
              ৳{displayPrice.toLocaleString()}
            </span>
            {product.offerPrice != null && product.price > product.offerPrice && (
              <span className="text-xs text-muted-foreground line-through">
                ৳{product.price.toLocaleString()}
              </span>
            )}
          </div>

          {/* Sold count / warranty */}
          <div className="flex items-center justify-between mt-1 min-h-[1.25rem]">
            {product.soldCount > 0 && !showStock && (
              <span className="text-[11px] text-muted-foreground">
                {product.soldCount.toLocaleString()} sold
              </span>
            )}
            {product.warrantyMonths != null && product.warrantyMonths > 0 && (
              <span className="text-[11px] text-green-600 flex items-center gap-0.5 ml-auto">
                <CheckCircle2 className="h-3 w-3" />
                {product.warrantyMonths >= 12
                  ? `${product.warrantyMonths / 12}yr warranty`
                  : `${product.warrantyMonths}mo warranty`}
              </span>
            )}
          </div>

          {/* Stock Indicator */}
          {showStock && product.stock > 0 && (
            <div className="space-y-1 mt-2">
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
      </div>
      
      {!onQuickView && (
        <QuickViewModal
          product={internalQuickView}
          onClose={() => setInternalQuickView(null)}
        />
      )}
    </div>
  );
}

export default memo(ProductCard);
