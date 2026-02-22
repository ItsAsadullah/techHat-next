'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { X, Heart, Trash2, ShoppingCart, HeartOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWishlist } from '@/lib/context/wishlist-context';
import { useCart } from '@/lib/context/cart-context';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function WishlistDrawer() {
  const { items, count, isOpen, closeWishlist, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();
  const firstFocusRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setTimeout(() => firstFocusRef.current?.focus(), 50);
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeWishlist(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [closeWishlist]);

  const handleMoveToCart = (item: typeof items[number]) => {
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
    toast.success(`${item.name.slice(0, 30)}... moved to cart`);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="wishlist-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] backdrop-blur-sm"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
            onClick={closeWishlist}
            aria-hidden="true"
          />

          {/* Drawer */}
          <motion.aside
            key="wishlist-drawer"
            role="dialog"
            aria-label="Wishlist"
            aria-modal="true"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 35 }}
            className="fixed inset-y-0 right-0 z-[101] flex flex-col w-full max-w-[420px] shadow-2xl"
            style={{ backgroundColor: '#ffffff' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <div className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-red-500" />
                <h2 className="text-base font-semibold">Wishlist</h2>
                {count > 0 && (
                  <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {count}
                  </span>
                )}
              </div>
              <button
                ref={firstFocusRef}
                onClick={closeWishlist}
                className="p-1.5 rounded-full hover:bg-muted transition-colors"
                aria-label="Close wishlist"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 py-16 text-center">
                  <div className="bg-muted/50 rounded-full p-6">
                    <HeartOff className="h-10 w-10 text-muted-foreground/40" />
                  </div>
                  <div>
                    <p className="font-medium">Your wishlist is empty</p>
                    <p className="text-sm text-muted-foreground mt-1">Save items you love for later</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={closeWishlist} asChild>
                    <Link href="/">Browse Products</Link>
                  </Button>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {items.map((item) => {
                    const displayPrice = item.offerPrice ?? item.price;
                    const hasDiscount = item.discountPercentage != null && item.discountPercentage > 0;
                    const isOutOfStock = item.stock === 0;

                    return (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: 40, scale: 0.9 }}
                        transition={{ duration: 0.22 }}
                        className="flex gap-3 p-3 rounded-xl border"
                        style={{ backgroundColor: 'rgba(241,245,249,0.3)', borderColor: 'rgba(226,232,240,0.5)' }}
                      >
                        {/* Image */}
                        <Link
                          href={`/products/${item.slug}`}
                          onClick={closeWishlist}
                          className="relative w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0"
                        >
                          {item.image ? (
                            <Image src={item.image} alt={item.name} fill className="object-cover" sizes="64px" />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Heart className="h-6 w-6 text-muted-foreground/30" />
                            </div>
                          )}
                        </Link>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          {item.brand && (
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">{item.brand}</p>
                          )}
                          <Link
                            href={`/products/${item.slug}`}
                            onClick={closeWishlist}
                            className="text-sm font-medium line-clamp-2 hover:text-primary transition-colors leading-snug"
                          >
                            {item.name}
                          </Link>

                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            <span className="font-bold text-sm">৳{displayPrice.toLocaleString()}</span>
                            {hasDiscount && (
                              <Badge className="bg-red-100 text-red-600 text-[10px] px-1.5 py-0">
                                -{Math.round(item.discountPercentage!)}%
                              </Badge>
                            )}
                          </div>

                          <Button
                            size="sm"
                            variant="outline"
                            className={cn(
                              'h-6 text-xs gap-1 mt-2',
                              isOutOfStock && 'opacity-50 cursor-not-allowed'
                            )}
                            disabled={isOutOfStock}
                            onClick={() => handleMoveToCart(item)}
                          >
                            <ShoppingCart className="h-3 w-3" />
                            {isOutOfStock ? 'Out of Stock' : 'Move to Cart'}
                          </Button>
                        </div>

                        {/* Remove */}
                        <button
                          onClick={() => removeFromWishlist(item.id)}
                          className="self-start p-1 text-muted-foreground hover:text-destructive transition-colors mt-0.5"
                          aria-label={`Remove ${item.name} from wishlist`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t px-5 py-4 bg-background flex flex-col gap-2">
                <Button className="w-full gap-2" onClick={closeWishlist} asChild>
                  <Link href="/wishlist">View Full Wishlist</Link>
                </Button>
                <Button className="w-full gap-2" variant="outline" onClick={closeWishlist} asChild>
                  <Link href="/">Continue Browsing</Link>
                </Button>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
