'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { X, Star, ShoppingCart, Heart, CheckCircle2, Zap, ExternalLink } from 'lucide-react';
import type { CategoryProduct } from '@/lib/types/category-page';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useCart } from '@/lib/context/cart-context';
import { useWishlist } from '@/lib/context/wishlist-context';
import { toast } from 'sonner';

interface Props {
  product: CategoryProduct | null;
  onClose: () => void;
}

export default function QuickViewModal({ product, onClose }: Props) {
  const [selectedImg, setSelectedImg] = useState(0);
  const cartBtnRef = useRef<HTMLButtonElement | null>(null);
  const wishlistBtnRef = useRef<HTMLButtonElement | null>(null);

  const { addToCart } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();
  const wishlisted = product ? isWishlisted(product.id) : false;

  if (!product) return null;

  const images = [
    ...(product.primaryImage ? [product.primaryImage] : []),
    ...(product.hoverImage && product.hoverImage !== product.primaryImage ? [product.hoverImage] : []),
    ...product.images.filter(
      (img) => img !== product.primaryImage && img !== product.hoverImage
    ),
  ].slice(0, 5);

  const displayImages = images.length ? images : [product.images[0]].filter(Boolean);
  const displayPrice = product.offerPrice ?? product.price;
  const hasDiscount = product.discountPercentage != null && product.discountPercentage > 0;
  const isOutOfStock = product.stock === 0;

  return (
    <Dialog open={!!product} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl p-0 gap-0 overflow-hidden max-h-[90vh]">
        <div className="flex flex-col sm:flex-row h-full max-h-[90vh]">
          <DialogTitle className="sr-only">{product.name}</DialogTitle>
          {/* Image section */}
          <div className="sm:w-[45%] bg-muted/20 flex flex-col">
            <div className="relative aspect-square flex-1">
              {displayImages[selectedImg] ? (
                <Image
                  src={displayImages[selectedImg]}
                  alt={product.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, 45vw"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/20">
                  <ShoppingCart className="w-16 h-16" />
                </div>
              )}
              {hasDiscount && (
                <Badge className="absolute top-2 left-2 bg-red-500 text-white font-bold">
                  -{Math.round(product.discountPercentage!)}%
                </Badge>
              )}
            </div>
            {/* Thumbnails */}
            {displayImages.length > 1 && (
              <div className="flex gap-2 p-3 overflow-x-auto">
                {displayImages.map((src, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImg(i)}
                    className={cn(
                      'relative w-12 h-12 rounded border-2 overflow-hidden flex-shrink-0 transition-colors',
                      selectedImg === i ? 'border-primary' : 'border-transparent hover:border-muted-foreground/30'
                    )}
                  >
                    <Image src={src} alt="" fill className="object-cover" sizes="48px" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info section */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-5 space-y-4">
              {/* Brand + name */}
              {product.brand && (
                <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium">
                  {product.brand.name}
                </p>
              )}
              <h2 className="text-base font-semibold leading-snug">{product.name}</h2>

              {/* Rating */}
              {product.reviewCount > 0 && (
                <div className="flex items-center gap-1.5">
                  <div className="flex">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          'h-4 w-4',
                          i < Math.floor(product.avgRating)
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-muted-foreground/30'
                        )}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-medium">{product.avgRating.toFixed(1)}</span>
                  <span className="text-xs text-muted-foreground">({product.reviewCount} reviews)</span>
                </div>
              )}

              {/* Price */}
              <div className="flex items-baseline gap-3">
                <span className="text-2xl font-bold">
                  ৳{displayPrice.toLocaleString()}
                </span>
                {product.offerPrice != null && product.price > product.offerPrice && (
                  <>
                    <span className="text-sm text-muted-foreground line-through">
                      ৳{product.price.toLocaleString()}
                    </span>
                    {hasDiscount && (
                      <Badge className="bg-red-100 text-red-600 text-xs">
                        Save {Math.round(product.discountPercentage!)}%
                      </Badge>
                    )}
                  </>
                )}
              </div>

              {/* Short description */}
              {product.shortDesc && (
                <p className="text-sm text-muted-foreground">{product.shortDesc}</p>
              )}

              {/* Key specs */}
              {product.specifications && (
                <div className="grid grid-cols-2 gap-1.5 text-xs">
                  {Object.entries(product.specifications).slice(0, 6).map(([key, value]) => (
                    <div key={key} className="flex flex-col gap-0.5 bg-muted/40 rounded-lg p-2">
                      <span className="text-muted-foreground">{key}</span>
                      <span className="font-medium truncate">{value}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Stock + warranty */}
              <div className="flex items-center gap-3 flex-wrap">
                {isOutOfStock ? (
                  <Badge variant="outline" className="text-destructive border-destructive/20">
                    Out of Stock
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-green-600 border-green-200">
                    {product.stock} in stock
                  </Badge>
                )}
                {product.warrantyMonths != null && product.warrantyMonths > 0 && (
                  <span className="text-xs text-green-600 flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {product.warrantyMonths >= 12
                      ? `${product.warrantyMonths / 12} year ${product.warrantyType ?? ''} warranty`
                      : `${product.warrantyMonths} month warranty`}
                  </span>
                )}
                {product.isFlashSale && (
                  <Badge className="bg-orange-500 text-white text-xs flex items-center gap-1">
                    <Zap className="h-3 w-3" />
                    Flash Sale
                  </Badge>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <Button
                  ref={cartBtnRef}
                  className="flex-1 gap-2"
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
                    toast.success('Added to cart');
                  }}
                >
                  <ShoppingCart className="h-4 w-4" />
                  {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
                </Button>
                <Button
                  ref={wishlistBtnRef}
                  variant="outline"
                  size="icon"
                  onClick={() => {
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
                      wishlistBtnRef.current
                    );
                    if (!wishlisted) toast.success('Added to Wishlist');
                  }}
                  className={cn(wishlisted && 'text-red-500 border-red-200')}
                >
                  <Heart className={cn('h-4 w-4', wishlisted && 'fill-red-500')} />
                </Button>
              </div>

              {/* Full details link */}
              <Link
                href={`/products/${product.slug}`}
                onClick={onClose}
                className="text-xs text-primary hover:underline flex items-center gap-1 w-fit"
              >
                View full details
                <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
