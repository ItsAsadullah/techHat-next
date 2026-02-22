'use client';

import React, { createContext, useContext, useReducer, useEffect, useRef, useCallback } from 'react';
import type { WishlistItem, WishlistContextType, WishlistState } from '@/lib/types/cart-wishlist';
import { flyToTarget } from '@/lib/utils/fly-animation';

// ─── Reducer ─────────────────────────────────────────────────────────────────

type Action =
  | { type: 'ADD'; item: WishlistItem }
  | { type: 'REMOVE'; id: string }
  | { type: 'OPEN' }
  | { type: 'CLOSE' }
  | { type: 'HYDRATE'; items: WishlistItem[] };

function wishlistReducer(state: WishlistState, action: Action): WishlistState {
  switch (action.type) {
    case 'HYDRATE':
      return { ...state, items: action.items, count: action.items.length };
    case 'ADD': {
      if (state.items.find((i) => i.id === action.item.id)) return state;
      const items = [...state.items, action.item];
      return { ...state, items, count: items.length };
    }
    case 'REMOVE': {
      const items = state.items.filter((i) => i.id !== action.id);
      return { ...state, items, count: items.length };
    }
    case 'OPEN':
      return { ...state, isOpen: true };
    case 'CLOSE':
      return { ...state, isOpen: false };
    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

const WishlistContext = createContext<WishlistContextType | null>(null);
export { WishlistContext };

const INITIAL: WishlistState = { items: [], count: 0, isOpen: false };

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(wishlistReducer, INITIAL);
  const wishlistIconRef = useRef<HTMLButtonElement | null>(null);
  const hydrated = useRef(false);

  // Hydrate from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem('th_wishlist');
      if (raw) {
        const parsed: WishlistItem[] = JSON.parse(raw);
        if (Array.isArray(parsed)) dispatch({ type: 'HYDRATE', items: parsed });
      }
    } catch { /* ignore */ }
    hydrated.current = true;
  }, []);

  // Persist
  useEffect(() => {
    if (!hydrated.current) return;
    try {
      localStorage.setItem('th_wishlist', JSON.stringify(state.items));
    } catch { /* ignore */ }
  }, [state.items]);

  const addToWishlist = useCallback(
    (item: WishlistItem, sourceEl?: HTMLElement | null) => {
      dispatch({ type: 'ADD', item });

      if (sourceEl && wishlistIconRef.current) {
        flyToTarget({
          sourceEl,
          targetEl: wishlistIconRef.current,
          cloneType: 'heart',
          onComplete: () => {
            wishlistIconRef.current?.classList.add('wishlist-pulse');
            setTimeout(() => wishlistIconRef.current?.classList.remove('wishlist-pulse'), 600);
          },
        });
      }
    },
    []
  );

  const removeFromWishlist = useCallback((id: string) => {
    dispatch({ type: 'REMOVE', id });
    // Shake icon on remove
    wishlistIconRef.current?.classList.add('wishlist-shake');
    setTimeout(() => wishlistIconRef.current?.classList.remove('wishlist-shake'), 500);
  }, []);

  const toggleWishlist = useCallback(
    (item: WishlistItem, sourceEl?: HTMLElement | null) => {
      const exists = state.items.find((i) => i.id === item.id);
      if (exists) {
        dispatch({ type: 'REMOVE', id: item.id });
        wishlistIconRef.current?.classList.add('wishlist-shake');
        setTimeout(() => wishlistIconRef.current?.classList.remove('wishlist-shake'), 500);
      } else {
        dispatch({ type: 'ADD', item });
        if (sourceEl && wishlistIconRef.current) {
          flyToTarget({
            sourceEl,
            targetEl: wishlistIconRef.current,
            cloneType: 'heart',
            onComplete: () => {
              wishlistIconRef.current?.classList.add('wishlist-pulse');
              setTimeout(() => wishlistIconRef.current?.classList.remove('wishlist-pulse'), 600);
            },
          });
        }
      }
    },
    [state.items]
  );

  const isWishlisted = useCallback((id: string) => state.items.some((i) => i.id === id), [state.items]);
  const openWishlist = useCallback(() => dispatch({ type: 'OPEN' }), []);
  const closeWishlist = useCallback(() => dispatch({ type: 'CLOSE' }), []);

  return (
    <WishlistContext.Provider
      value={{ ...state, addToWishlist, removeFromWishlist, toggleWishlist, isWishlisted, openWishlist, closeWishlist, wishlistIconRef }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used inside WishlistProvider');
  return ctx;
}

/** Null-safe version — returns null when rendered outside WishlistProvider */
export function useWishlistSafe() {
  return useContext(WishlistContext);
}
