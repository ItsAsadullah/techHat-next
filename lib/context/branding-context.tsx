'use client';

import { createContext, useContext, use } from 'react';
import type { BrandingSettings } from '@/lib/actions/invoice-settings-actions';

const defaults: BrandingSettings = {
  siteLogo: '',
  siteFavicon: '',
  topbarHotline: '01700-000000',
  topbarDelivery: 'Free Delivery on Orders Over ৳2,000',
  topbarShowDelivery: true,
};

const BrandingContext = createContext<BrandingSettings>(defaults);

export function BrandingProvider({
  valuePromise,
  children,
}: {
  valuePromise: Promise<BrandingSettings>;
  children: React.ReactNode;
}) {
  const value = use(valuePromise);
  return (
    <BrandingContext.Provider value={value}>{children}</BrandingContext.Provider>
  );
}

export function useBranding() {
  return useContext(BrandingContext);
}
