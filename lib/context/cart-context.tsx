'use client';

import React, { createContext, useContext, useReducer, useEffect, useRef, useCallback } from 'react';
import type { CartItem, CartContextType, CartState } from '@/lib/types/cart-wishlist';
import { flyToTarget } from '@/lib/utils/fly-animation';

// ─── Reducer ─────────────────────────────────────────────────────────────────

type Action =
  | { type: 'ADD'; item: CartItem }
  | { type: 'REMOVE'; id: string }
  | { type: 'UPDATE_QTY'; id: string; quantity: number }
  | { type: 'CLEAR' }
  | { type: 'REMOVE_SELECTED' }
  | { type: 'TOGGLE_SELECT'; id: string }
  | { type: 'TOGGLE_SELECT_ALL'; selected: boolean }
  | { type: 'OPEN' }
  | { type: 'CLOSE' }
  | { type: 'HYDRATE'; items: CartItem[] };

function cartReducer(state: CartState, action: Action): CartState {
  switch (action.type) {
    case 'HYDRATE':
      return recalc({ ...state, items: action.items });
    case 'ADD': {
      const existing = state.items.find((i) => i.id === action.item.id);
      const items = existing
        ? state.items.map((i) =>
            i.id === action.item.id
              ? { 
                  ...i, 
                  ...action.item, // Sync latest stock, price, etc.
                  quantity: Math.min(i.quantity + action.item.quantity, action.item.stock), 
                  isSelected: true 
                }
              : i
          )
        : [...state.items, { ...action.item, isSelected: true }];
      return recalc({ ...state, items });
    }
    case 'REMOVE':
      return recalc({ ...state, items: state.items.filter((i) => i.id !== action.id) });
    case 'UPDATE_QTY': {
      const items =
        action.quantity <= 0
          ? state.items.filter((i) => i.id !== action.id)
          : state.items.map((i) =>
              i.id === action.id ? { ...i, quantity: Math.min(action.quantity, i.stock) } : i
            );
      return recalc({ ...state, items });
    }
    case 'CLEAR':
      return recalc({ ...state, items: [] });
    case 'REMOVE_SELECTED':
      return recalc({ ...state, items: state.items.filter(i => i.isSelected === false) });
    case 'TOGGLE_SELECT':
      return recalc({
        ...state,
        items: state.items.map(i => i.id === action.id ? { ...i, isSelected: i.isSelected === false ? true : false } : i)
      });
    case 'TOGGLE_SELECT_ALL':
      return recalc({
        ...state,
        items: state.items.map(i => ({ ...i, isSelected: action.selected }))
      });
    case 'OPEN':
      return { ...state, isOpen: true };
    case 'CLOSE':
      return { ...state, isOpen: false };
    default:
      return state;
  }
}

function recalc(state: CartState): CartState {
  const count = state.items.reduce((s, i) => s + i.quantity, 0);
  const total = state.items.reduce((s, i) => s + (i.offerPrice ?? i.price) * i.quantity, 0);
  
  const selectedItems = state.items.filter(i => i.isSelected !== false);
  const selectedCount = selectedItems.reduce((s, i) => s + i.quantity, 0);
  const selectedTotal = selectedItems.reduce((s, i) => s + (i.offerPrice ?? i.price) * i.quantity, 0);

  return { ...state, count, total, selectedCount, selectedTotal };
}

// ─── Context ──────────────────────────────────────────────────────────────────

const CartContext = createContext<CartContextType | null>(null);
export { CartContext };

const INITIAL: CartState = { items: [], count: 0, total: 0, selectedCount: 0, selectedTotal: 0, isOpen: false };

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, INITIAL);
  const cartIconRef = useRef<HTMLButtonElement | null>(null);
  const hydrated = useRef(false);

  // Hydrate from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem('th_cart');
      if (raw) {
        const parsed: CartItem[] = JSON.parse(raw);
        if (Array.isArray(parsed)) dispatch({ type: 'HYDRATE', items: parsed });
      }
    } catch { /* ignore */ }
    hydrated.current = true;
  }, []);

  // Persist to localStorage
  useEffect(() => {
    if (!hydrated.current) return;
    try {
      localStorage.setItem('th_cart', JSON.stringify(state.items));
    } catch { /* ignore */ }
  }, [state.items]);

  const addToCart = useCallback(
    (item: Omit<CartItem, 'quantity'> & { quantity?: number }, sourceEl?: HTMLElement | null) => {
      dispatch({ type: 'ADD', item: { ...item, quantity: item.quantity ?? 1 } });

      // Fly animation
      if (sourceEl) {
        let targetEl = cartIconRef.current;
        
        // Find visible cart target btn fallback
        const cartBtns = Array.from(document.querySelectorAll('.cart-target-btn')) as HTMLElement[];
        const visibleBtn = cartBtns.find(btn => btn.offsetParent !== null);
        if (visibleBtn) targetEl = visibleBtn as HTMLButtonElement;

        if (targetEl) {
          flyToTarget({
            sourceEl,
            targetEl,
            cloneType: 'image',
            imageSrc: item.image ?? undefined,
            onComplete: () => {
              targetEl?.classList.add('cart-bounce');
              setTimeout(() => targetEl?.classList.remove('cart-bounce'), 600);
            },
          });
        }
      }
    },
    []
  );

  const removeFromCart = useCallback((id: string) => dispatch({ type: 'REMOVE', id }), []);
  const updateQuantity = useCallback((id: string, quantity: number) => dispatch({ type: 'UPDATE_QTY', id, quantity }), []);
  const toggleSelection = useCallback((id: string) => dispatch({ type: 'TOGGLE_SELECT', id }), []);
  const toggleAllSelection = useCallback((selected: boolean) => dispatch({ type: 'TOGGLE_SELECT_ALL', selected }), []);
  const clearCart = useCallback(() => dispatch({ type: 'CLEAR' }), []);
  const removeSelectedFromCart = useCallback(() => dispatch({ type: 'REMOVE_SELECTED' }), []);
  const openCart = useCallback(() => dispatch({ type: 'OPEN' }), []);
  const closeCart = useCallback(() => dispatch({ type: 'CLOSE' }), []);

  return (
    <CartContext.Provider
      value={{ ...state, addToCart, removeFromCart, updateQuantity, toggleSelection, toggleAllSelection, clearCart, removeSelectedFromCart, openCart, closeCart, cartIconRef }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}

/** Null-safe version — returns null when rendered outside CartProvider (e.g. SSR edge cases) */
export function useCartSafe() {
  return useContext(CartContext);
}
