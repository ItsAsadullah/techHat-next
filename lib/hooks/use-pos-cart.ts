'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import type { CartItem, POSProduct } from '@/lib/actions/pos-actions';

export interface POSCartState {
  items: CartItem[];
  discount: number;
  discountType: 'fixed' | 'percent';
  tax: number;
  paymentMethod: 'CASH' | 'MOBILE_BANKING' | 'CARD' | 'MIXED';
  amountReceived: number;
  customerName: string;
  customerPhone: string;
  note: string;
  // Due & Guarantor
  paidAmount: number | null;
  guarantorName: string;
  guarantorPhone: string;
  guarantorRelation: string;
  guarantorAddress: string;
}

const emptyCart: POSCartState = {
  items: [],
  discount: 0,
  discountType: 'fixed',
  tax: 0,
  paymentMethod: 'CASH',
  amountReceived: 0,
  customerName: '',
  customerPhone: '',
  note: '',
  paidAmount: null,
  guarantorName: '',
  guarantorPhone: '',
  guarantorRelation: '',
  guarantorAddress: '',
};

export function usePOSCart() {
  const [cart, setCart] = useState<POSCartState>(emptyCart);
  const [heldOrders, setHeldOrders] = useState<POSCartState[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load from local storage on mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('techhat_pos_cart');
      const savedHeld = localStorage.getItem('techhat_pos_held_orders');
      if (savedCart) setCart(JSON.parse(savedCart));
      if (savedHeld) setHeldOrders(JSON.parse(savedHeld));
    } catch (e) {
      console.error('Failed to load POS state', e);
    }
    setIsInitialized(true);
  }, []);

  // Save to local storage whenever state changes
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem('techhat_pos_cart', JSON.stringify(cart));
      localStorage.setItem('techhat_pos_held_orders', JSON.stringify(heldOrders));
    }
  }, [cart, heldOrders, isInitialized]);

  const addItem = useCallback((product: POSProduct, variantId?: string) => {
    setCart((prev) => {
      const variant = variantId
        ? product.variants.find((v: any) => v.id === variantId)
        : null;

      const itemId = variantId || product.id;
      const existingIndex = prev.items.findIndex(
        (i) => (i.variantId || i.productId) === itemId
      );

      if (existingIndex >= 0) {
        const existing = prev.items[existingIndex];
        if (existing.quantity >= existing.maxStock) return prev;

        const newItems = [...prev.items];
        newItems[existingIndex] = {
          ...existing,
          quantity: existing.quantity + 1,
        };
        return { ...prev, items: newItems };
      }

      const effectivePrice = variant
        ? variant.offerPrice || variant.price
        : product.offerPrice || product.price;

      let maxStock = variant ? variant.stock : product.stock;
      
      // Fallback: if a single "Default" variant has 0 stock but the main product shows stock, use main product stock
      if (variant && product.variants.length === 1 && maxStock <= 0 && product.stock > 0) {
        maxStock = product.stock;
      }

      if (maxStock <= 0) {
        return prev;
      }

      const newItem: CartItem = {
        productId: product.id,
        variantId: variantId || null,
        name: product.name,
        variantName: variant?.name,
        price: effectivePrice,
        originalPrice: effectivePrice,
        costPrice: variant ? variant.costPrice : product.costPrice,
        quantity: 1,
        image: variant?.image || product.image,
        maxStock,
      };

      return { ...prev, items: [...prev.items, newItem] };
    });
  }, []);

  const updateQuantity = useCallback((index: number, quantity: number) => {
    setCart((prev) => {
      if (quantity <= 0) {
        return {
          ...prev,
          items: prev.items.filter((_, i) => i !== index),
        };
      }
      const item = prev.items[index];
      if (!item || quantity > item.maxStock) return prev;

      const newItems = [...prev.items];
      newItems[index] = { ...item, quantity };
      return { ...prev, items: newItems };
    });
  }, []);

  const removeItem = useCallback((index: number) => {
    setCart((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  }, []);

  const clearCart = useCallback(() => {
    setCart(emptyCart);
  }, []);

  const holdOrder = useCallback(() => {
    if (cart.items.length === 0) return;
    setHeldOrders((prev) => [...prev, cart]);
    setCart(emptyCart);
  }, [cart]);

  const resumeOrder = useCallback((index: number) => {
    const order = heldOrders[index];
    if (!order) return;
    setCart(order);
    setHeldOrders((prev) => prev.filter((_, i) => i !== index));
  }, [heldOrders]);

  const setDiscount = useCallback((amount: number, type: 'fixed' | 'percent') => {
    setCart((prev) => ({ ...prev, discount: amount, discountType: type }));
  }, []);

  const setPaymentMethod = useCallback((method: 'CASH' | 'MOBILE_BANKING' | 'CARD' | 'MIXED') => {
    setCart((prev) => ({ ...prev, paymentMethod: method }));
  }, []);

  const setAmountReceived = useCallback((amount: number) => {
    setCart((prev) => ({ ...prev, amountReceived: amount }));
  }, []);

  const setCustomerInfo = useCallback((name: string, phone: string) => {
    setCart((prev) => ({ ...prev, customerName: name, customerPhone: phone }));
  }, []);

  const setNote = useCallback((note: string) => {
    setCart((prev) => ({ ...prev, note }));
  }, []);

  const setPaidAmount = useCallback((amount: number | null) => {
    setCart((prev) => ({ ...prev, paidAmount: amount }));
  }, []);

  const setItemPrice = useCallback((index: number, price: number) => {
    setCart((prev) => {
      const item = prev.items[index];
      if (!item) return prev;
      const newItems = [...prev.items];
      newItems[index] = { ...item, price };
      return { ...prev, items: newItems };
    });
  }, []);

  const resetItemPrice = useCallback((index: number) => {
    setCart((prev) => {
      const item = prev.items[index];
      if (!item) return prev;
      const newItems = [...prev.items];
      newItems[index] = { ...item, price: item.originalPrice };
      return { ...prev, items: newItems };
    });
  }, []);

  const setGuarantorInfo = useCallback((name: string, phone: string, relation: string, address: string) => {
    setCart((prev) => ({ ...prev, guarantorName: name, guarantorPhone: phone, guarantorRelation: relation, guarantorAddress: address }));
  }, []);

  // PERF: Memoize computed values so they only recalculate when cart state
  // actually changes, preventing unnecessary re-renders in child components
  // that receive these as props (POSCartPanel, POSClient summary display).
  const subtotal = useMemo(
    () => cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart.items]
  );
  const discountAmount = useMemo(
    () =>
      cart.discountType === 'percent'
        ? (subtotal * cart.discount) / 100
        : cart.discount,
    [subtotal, cart.discount, cart.discountType]
  );
  const taxAmount = useMemo(
    () => (subtotal - discountAmount) * (cart.tax / 100),
    [subtotal, discountAmount, cart.tax]
  );
  const grandTotal = useMemo(
    () => subtotal - discountAmount + taxAmount,
    [subtotal, discountAmount, taxAmount]
  );
  const change = useMemo(
    () => Math.max(0, cart.amountReceived - grandTotal),
    [cart.amountReceived, grandTotal]
  );
  const totalItems = useMemo(
    () => cart.items.reduce((sum, item) => sum + item.quantity, 0),
    [cart.items]
  );

  return {
    cart,
    heldOrders,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    holdOrder,
    resumeOrder,
    setDiscount,
    setPaymentMethod,
    setAmountReceived,
    setCustomerInfo,
    setNote,
    setPaidAmount,
    setGuarantorInfo,
    setItemPrice,
    resetItemPrice,
    subtotal,
    discountAmount,
    taxAmount,
    grandTotal,
    change,
    totalItems,
  };
}
