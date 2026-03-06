/**
 * Meta (Facebook) Pixel — helper functions
 *
 * Usage:
 *   import { fbq } from '@/lib/pixel';
 *   fbq('track', 'AddToCart', { content_name: 'K10 Watch', value: 1200, currency: 'BDT' });
 *
 * The base pixel script is injected once in <MetaPixel /> (app/layout.tsx).
 * These helpers are safe to call from any client component.
 */

declare global {
  interface Window {
    fbq: (...args: unknown[]) => void;
    _fbq: unknown;
  }
}

/** Fire any standard or custom Meta Pixel event */
export function fbq(
  type: 'track' | 'trackCustom' | 'init',
  event: string,
  params?: Record<string, unknown>
): void {
  if (typeof window === 'undefined' || typeof window.fbq !== 'function') return;
  window.fbq(type, event, params);
}

// ── Standard event helpers ─────────────────────────────────────────────────

/** Product detail page view */
export function pixelViewContent(params: {
  content_name: string;
  content_ids: string[];
  value: number;
  currency?: string;
}) {
  fbq('track', 'ViewContent', { ...params, currency: params.currency ?? 'BDT' });
}

/** Add to cart */
export function pixelAddToCart(params: {
  content_name: string;
  content_ids: string[];
  value: number;
  quantity: number;
  currency?: string;
}) {
  fbq('track', 'AddToCart', { ...params, currency: params.currency ?? 'BDT' });
}

/** Checkout started (step 1 → step 2) */
export function pixelInitiateCheckout(params: {
  value: number;
  num_items: number;
  currency?: string;
}) {
  fbq('track', 'InitiateCheckout', { ...params, currency: params.currency ?? 'BDT' });
}

/** Order placed successfully */
export function pixelPurchase(params: {
  value: number;
  order_id?: string;
  currency?: string;
}) {
  fbq('track', 'Purchase', { ...params, currency: params.currency ?? 'BDT' });
}

/** Search event */
export function pixelSearch(query: string) {
  fbq('track', 'Search', { search_string: query });
}
