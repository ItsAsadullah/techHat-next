'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCart, Heart, Eye, Star, Zap, Award, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CategoryProduct } from '@/lib/types/category-page';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useCart } from '@/lib/context/cart-context';
import { useWishlist } from '@/lib/context/wishlist-context';
import { toast } from 'sonner';

interface Props {
  product: CategoryProduct;
  onQuickView: (product: CategoryProduct) => void;
}

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

export default function CategoryProductCard({ product, onQuickView }: Props) {
  const [imgError, setImgError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [heartAnimating, setHeartAnimating] = useState(false);

  const cartBtnRef = useRef<HTMLButtonElement | null>(null);
  const heartBtnRef = useRef<HTMLButtonElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  const { addToCart } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();
  const wishlisted = isWishlisted(product.id);

  const displayPrice = product.offerPrice ?? product.price;
  const hasDiscount = product.discountPercentage != null && product.discountPercentage > 0;
  const isLowStock = product.stock > 0 && product.stock <= (product.minStock ?? 5);
  const isOutOfStock = product.stock === 0;

  const primarySrc = product.primaryImage ?? product.images?.[0];
  const hoverSrc = product.hoverImage ?? product.images?.[1];
  const showHover = isHovered && !!hoverSrc && hoverSrc !== primarySrc;

  return (
    <div
      className={cn(
        'group relative bg-background border rounded-xl overflow-hidden transition-all duration-200',
        'hover:shadow-lg hover:border-primary/20 hover:-translate-y-0.5',
        isOutOfStock && 'opacity-75'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image area */}
      <div className="relative aspect-square overflow-hidden bg-muted/30">
        <Link href={`/products/${product.slug}`} aria-label={product.name}>
          {primarySrc && !imgError ? (
            <>
              <Image
                src={primarySrc}
                alt={product.name}
                fill
                className={cn(
                  'object-cover transition-all duration-500',
                  showHover ? 'opacity-0 scale-105' : 'opacity-100 scale-100 group-hover:scale-105'
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
                    'object-cover transition-all duration-500',
                    showHover ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
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
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {hasDiscount && (
            <Badge className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 font-bold shadow-sm">
              -{Math.round(product.discountPercentage!)}%
            </Badge>
          )}
          {product.isFlashSale && (
            <Badge className="bg-orange-500 text-white text-[10px] px-1.5 py-0.5 flex items-center gap-0.5 shadow-sm">
              <Zap className="h-2.5 w-2.5" />
              Flash
            </Badge>
          )}
          {product.isBestSeller && !product.isFlashSale && (
            <Badge className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 flex items-center gap-0.5 shadow-sm">
              <Award className="h-2.5 w-2.5" />
              Best
            </Badge>
          )}
        </div>

        {/* Stock badge */}
        <div className="absolute top-2 right-2">
          {isOutOfStock ? (
            <Badge variant="outline" className="bg-background/80 text-destructive border-destructive/20 text-[10px]">
              Out of Stock
            </Badge>
          ) : isLowStock ? (
            <Badge variant="outline" className="bg-background/80 text-amber-600 border-amber-200 text-[10px]">
              Only {product.stock} left
            </Badge>
          ) : null}
        </div>

        {/* Action buttons */}
        <div className={cn(
          'absolute inset-x-0 bottom-0 flex items-center justify-around p-2 bg-gradient-to-t from-background/95 to-transparent',
          'translate-y-full group-hover:translate-y-0 transition-transform duration-200'
        )}>
          <button
            ref={heartBtnRef}
            onClick={() => {
              setHeartAnimating(true);
              setTimeout(() => setHeartAnimating(false), 600);
              toggleWishlist(
                {
                  id: product.id,
                  name: product.name,
                  slug: product.slug,
                  price: product.price,
                  offerPrice: product.offerPrice,
                  image: product.primaryImage ?? product.images?.[0] ?? null,
                  brand: product.brand?.name ?? null,
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
            onClick={() => {
              if (isOutOfStock) return;
              addToCart(
                {
                  id: product.id,
                  name: product.name,
                  slug: product.slug,
                  price: product.price,
                  offerPrice: product.offerPrice,
                  image: product.primaryImage ?? product.images?.[0] ?? null,
                  brand: product.brand?.name ?? null,
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
            onClick={() => onQuickView(product)}
            className="p-1.5 rounded-full bg-background shadow border hover:text-primary hover:border-primary/20 transition-colors"
            aria-label="Quick view"
          >
            <Eye className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Product info */}
      <div className="p-3 space-y-1.5">
        {/* Brand */}
        {product.brand && (
          <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide truncate">
            {product.brand.name}
          </p>
        )}

        {/* Name */}
        <Link href={`/products/${product.slug}`}>
          <h3 className="text-sm font-medium leading-snug line-clamp-2 hover:text-primary transition-colors">
            {product.name}
          </h3>
        </Link>

        {/* Rating */}
        {product.reviewCount > 0 && (
          <StarRating rating={product.avgRating} count={product.reviewCount} />
        )}

        {/* Price */}
        <div className="flex items-baseline gap-2 flex-wrap">
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
        <div className="flex items-center justify-between">
          {product.soldCount > 0 && (
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
      </div>
    </div>
  );
}
