'use client';

import { createContext, useContext } from 'react';
import type { StoreSettings } from '@/lib/actions/invoice-settings-actions';

const defaults: StoreSettings = {
  storeName: 'TechHat',
  tagline: '',
  phone: '',
  altPhone: '',
  email: '',
  website: '',
  address: '',
  city: '',
  country: 'Bangladesh',
  currency: 'BDT',
  currencySymbol: '?',
  timezone: 'Asia/Dhaka',
  whatsappNumber: '',
  callNumber: '',
};

const StoreContext = createContext<StoreSettings>(defaults);

export function StoreProvider({
  value,
  children,
}: {
  value: StoreSettings;
  children: React.ReactNode;
}) {
  return (
    <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
  );
}

export function useStore() {
  return useContext(StoreContext);
}
