'use client';

import { useRef, useEffect, useCallback, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { X, ShoppingCart, Trash2, Plus, Minus, ShoppingBag, Heart, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '@/lib/context/cart-context';
import { useWishlist } from '@/lib/context/wishlist-context';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function CartDrawer() {
  const { items, count, total, isOpen, closeCart, removeFromCart, updateQuantity, addToCart } = useCart();
  const { items: wishlistItems, removeFromWishlist } = useWishlist();
  const firstFocusRef = useRef<HTMLButtonElement | null>(null);
  const carouselRef = useRef<HTMLDivElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = carouselRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  const scrollCarousel = useCallback((dir: 'left' | 'right') => {
    const el = carouselRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === 'left' ? -150 : 150, behavior: 'smooth' });
  }, []);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setTimeout(() => firstFocusRef.current?.focus(), 50);
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeCart(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [closeCart]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="cart-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] backdrop-blur-sm"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
            onClick={closeCart}
            aria-hidden="true"
          />

          {/* Drawer */}
          <motion.aside
            key="cart-drawer"
            role="dialog"
            aria-label="Shopping Cart"
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
                <ShoppingCart className="h-5 w-5 text-primary" />
                <h2 className="text-base font-semibold">Shopping Cart</h2>
                {count > 0 && (
                  <span className="bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded-full">
                    {count}
                  </span>
                )}
              </div>
              <button
                ref={firstFocusRef}
                onClick={closeCart}
                className="p-1.5 rounded-full hover:bg-muted transition-colors"
                aria-label="Close cart"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 py-16 text-center">
                  <div className="bg-muted/50 rounded-full p-6">
                    <ShoppingBag className="h-10 w-10 text-muted-foreground/40" />
                  </div>
                  <div>
                    <p className="font-medium">Your cart is empty</p>
                    <p className="text-sm text-muted-foreground mt-1">Add some products to get started</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={closeCart} asChild>
                    <Link href="/">Continue Shopping</Link>
                  </Button>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {items.map((item) => (
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
                        onClick={closeCart}
                        className="relative w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0"
                      >
                        {item.image ? (
                          <Image src={item.image} alt={item.name} fill className="object-cover" sizes="64px" />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <ShoppingCart className="h-6 w-6 text-muted-foreground/30" />
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
                          onClick={closeCart}
                          className="text-sm font-medium line-clamp-2 hover:text-primary transition-colors leading-snug"
                        >
                          {item.name}
                        </Link>

                        <div className="flex items-center justify-between mt-2">
                          {/* Qty control */}
                          <div className="flex items-center gap-1 border rounded-lg overflow-hidden">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="p-1 hover:bg-muted transition-colors"
                              aria-label="Decrease quantity"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="w-7 text-center text-sm font-medium">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              disabled={item.quantity >= item.stock}
                              className="p-1 hover:bg-muted transition-colors disabled:opacity-40"
                              aria-label="Increase quantity"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>

                          {/* Price */}
                          <span className="font-semibold text-sm">
                            ৳{((item.offerPrice ?? item.price) * item.quantity).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {/* Remove */}
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="self-start p-1 text-muted-foreground hover:text-destructive transition-colors mt-0.5"
                        aria-label={`Remove ${item.name}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>

            {/* Wishlist Carousel */}
            {isOpen && wishlistItems.length > 0 && (
              <div className="border-t bg-muted/20 pb-3">
                {/* Header */}
                <div className="px-5 pt-3 pb-2 flex items-center gap-2">
                  <Heart className="h-3.5 w-3.5 text-rose-500 fill-rose-500" />
                  <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Saved for Later</span>
                  <span className="ml-auto text-[10px] text-muted-foreground">{wishlistItems.length} item{wishlistItems.length > 1 ? 's' : ''}</span>
                </div>

                {/* Carousel wrapper */}
                <div className="relative px-2">
                  {/* Left arrow */}
                  <button
                    onClick={() => scrollCarousel('left')}
                    className={cn(
                      'absolute left-2 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-white border border-gray-200 shadow-md flex items-center justify-center text-gray-500 hover:text-gray-800 hover:shadow-lg transition-all duration-150',
                      !canScrollLeft && 'opacity-0 pointer-events-none'
                    )}
                    aria-label="Scroll left"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </button>

                  {/* Scrollable row */}
                  <div
                    ref={(el) => {
                      carouselRef.current = el;
                      if (el) {
                        // initial check
                        setTimeout(updateScrollState, 0);
                      }
                    }}
                    onScroll={updateScrollState}
                    className="flex gap-2.5 overflow-x-auto scroll-smooth px-6 pb-1 pt-0.5"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                  >
                    {wishlistItems.map((wItem) => {
                      const displayPrice = wItem.offerPrice ?? wItem.price;
                      const isOutOfStock = wItem.stock === 0;
                      const alreadyInCart = items.some((i) => i.id === wItem.id);
                      return (
                        <div
                          key={wItem.id}
                          className="flex-shrink-0 w-[120px] flex flex-col bg-white rounded-xl border border-border/60 hover:border-blue-200 hover:shadow-md transition-all duration-200 overflow-hidden"
                        >
                          {/* Product image */}
                          <Link
                            href={`/products/${wItem.slug}`}
                            onClick={closeCart}
                            className="relative w-full h-[80px] bg-muted/40 flex-shrink-0"
                          >
                            {wItem.image ? (
                              <Image src={wItem.image} alt={wItem.name} fill className="object-contain p-1.5" sizes="120px" />
                            ) : (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <ShoppingBag className="h-6 w-6 text-muted-foreground/20" />
                              </div>
                            )}
                            {isOutOfStock && (
                              <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                                <span className="text-[9px] font-bold text-gray-500 bg-white px-1.5 py-0.5 rounded-full border">Out of Stock</span>
                              </div>
                            )}
                          </Link>

                          {/* Info + button */}
                          <div className="p-2 flex flex-col gap-1.5 flex-1">
                            <p className="text-[10px] font-semibold text-gray-700 line-clamp-2 leading-tight">{wItem.name}</p>
                            <p className="text-[11px] font-bold text-gray-900">৳{displayPrice.toLocaleString()}</p>
                            <button
                              disabled={isOutOfStock || alreadyInCart}
                              onClick={() => {
                                if (isOutOfStock || alreadyInCart) return;
                                addToCart({
                                  id: wItem.id,
                                  name: wItem.name,
                                  slug: wItem.slug,
                                  price: wItem.price,
                                  offerPrice: wItem.offerPrice,
                                  image: wItem.image,
                                  brand: wItem.brand,
                                  stock: wItem.stock,
                                  warrantyMonths: null,
                                });
                                removeFromWishlist(wItem.id);
                              }}
                              className={cn(
                                'w-full h-7 rounded-lg text-[10px] font-semibold flex items-center justify-center gap-1 transition-all duration-200 mt-auto',
                                isOutOfStock
                                  ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                                  : alreadyInCart
                                  ? 'bg-emerald-50 text-emerald-600 cursor-not-allowed border border-emerald-100'
                                  : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95'
                              )}
                            >
                              {alreadyInCart ? (
                                <><CheckCircle2 className="h-3 w-3" /> Added</>
                              ) : (
                                <><ShoppingCart className="h-3 w-3" /> Add</>
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Right arrow */}
                  <button
                    onClick={() => scrollCarousel('right')}
                    className={cn(
                      'absolute right-2 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-white border border-gray-200 shadow-md flex items-center justify-center text-gray-500 hover:text-gray-800 hover:shadow-lg transition-all duration-150',
                      !canScrollRight && 'opacity-0 pointer-events-none'
                    )}
                    aria-label="Scroll right"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t px-5 py-4 space-y-3 bg-background">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal ({count} items)</span>
                  <span className="font-bold text-base">৳{total.toLocaleString()}</span>
                </div>
                <p className="text-xs text-muted-foreground">Shipping calculated at checkout</p>
                <Button className="w-full gap-2" size="lg" asChild onClick={closeCart}>
                  <Link href="/checkout">
                    <ShoppingBag className="h-4 w-4" />
                    Proceed to Checkout
                  </Link>
                </Button>
                <Button variant="outline" className="w-full" size="sm" onClick={closeCart} asChild>
                  <Link href="/">Continue Shopping</Link>
                </Button>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
