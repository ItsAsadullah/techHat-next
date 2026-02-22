'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath, revalidateTag, unstable_cache } from 'next/cache';

export async function getInvoiceSettings() {
  const settings = await prisma.setting.findMany({
    where: { category: 'invoice' },
  });

  const settingsMap = settings.reduce((acc, setting) => {
    acc[setting.key] = setting.value;
    return acc;
  }, {} as Record<string, string>);

  return {
    invoiceLogo: settingsMap['invoiceLogo'] || '',
    invoiceBackground: settingsMap['invoiceBackground'] || '',
    invoiceCompanyName: settingsMap['invoiceCompanyName'] || 'TechHat',
    invoiceCompanyAddress: settingsMap['invoiceCompanyAddress'] || '',
    invoiceCompanyPhone: settingsMap['invoiceCompanyPhone'] || '',
    invoiceCompanyEmail: settingsMap['invoiceCompanyEmail'] || '',
    invoiceFooterText: settingsMap['invoiceFooterText'] || 'Thank you for shopping with us!',
    showLogo: settingsMap['showLogo'] === 'true',
    showBackground: settingsMap['showBackground'] === 'true',
    invoiceLayout: settingsMap['invoiceLayout'] || '[]',
    // Enhanced fields
    invoicePrefix: settingsMap['invoicePrefix'] || 'INV-',
    nextInvoiceNumber: settingsMap['nextInvoiceNumber'] || '1001',
    showTax: settingsMap['showTax'] !== 'false',
    termsAndConditions: settingsMap['termsAndConditions'] || '',
    receiptWidth: settingsMap['receiptWidth'] || '80',
  };
}

export type InvoiceSettings = Awaited<ReturnType<typeof getInvoiceSettings>>;

export async function updateInvoiceSettings(input: {
  invoiceLogo?: string;
  invoiceBackground?: string;
  invoiceCompanyName: string;
  invoiceCompanyAddress: string;
  invoiceCompanyPhone?: string;
  invoiceCompanyEmail?: string;
  invoiceFooterText: string;
  showLogo: boolean;
  showBackground: boolean;
  invoiceLayout?: string;
  // Enhanced
  invoicePrefix?: string;
  nextInvoiceNumber?: string;
  showTax?: boolean;
  termsAndConditions?: string;
  receiptWidth?: string;
}) {
  try {
    const upserts = [
      prisma.setting.upsert({
        where: { key: 'invoiceLogo' },
        update: { value: input.invoiceLogo || '', category: 'invoice' },
        create: { key: 'invoiceLogo', value: input.invoiceLogo || '', category: 'invoice' },
      }),
      prisma.setting.upsert({
        where: { key: 'invoiceBackground' },
        update: { value: input.invoiceBackground || '', category: 'invoice' },
        create: { key: 'invoiceBackground', value: input.invoiceBackground || '', category: 'invoice' },
      }),
      prisma.setting.upsert({
        where: { key: 'invoiceCompanyName' },
        update: { value: input.invoiceCompanyName, category: 'invoice' },
        create: { key: 'invoiceCompanyName', value: input.invoiceCompanyName, category: 'invoice' },
      }),
      prisma.setting.upsert({
        where: { key: 'invoiceCompanyAddress' },
        update: { value: input.invoiceCompanyAddress, category: 'invoice' },
        create: { key: 'invoiceCompanyAddress', value: input.invoiceCompanyAddress, category: 'invoice' },
      }),
      prisma.setting.upsert({
        where: { key: 'invoiceCompanyPhone' },
        update: { value: input.invoiceCompanyPhone || '', category: 'invoice' },
        create: { key: 'invoiceCompanyPhone', value: input.invoiceCompanyPhone || '', category: 'invoice' },
      }),
      prisma.setting.upsert({
        where: { key: 'invoiceCompanyEmail' },
        update: { value: input.invoiceCompanyEmail || '', category: 'invoice' },
        create: { key: 'invoiceCompanyEmail', value: input.invoiceCompanyEmail || '', category: 'invoice' },
      }),
      prisma.setting.upsert({
        where: { key: 'invoiceLayout' },
        update: { value: input.invoiceLayout || '[]', category: 'invoice' },
        create: { key: 'invoiceLayout', value: input.invoiceLayout || '[]', category: 'invoice' },
      }),
      prisma.setting.upsert({
        where: { key: 'invoiceFooterText' },
        update: { value: input.invoiceFooterText, category: 'invoice' },
        create: { key: 'invoiceFooterText', value: input.invoiceFooterText, category: 'invoice' },
      }),
      prisma.setting.upsert({
        where: { key: 'showLogo' },
        update: { value: String(input.showLogo), category: 'invoice' },
        create: { key: 'showLogo', value: String(input.showLogo), category: 'invoice' },
      }),
      prisma.setting.upsert({
        where: { key: 'showBackground' },
        update: { value: String(input.showBackground), category: 'invoice' },
        create: { key: 'showBackground', value: String(input.showBackground), category: 'invoice' },
      }),
      // Enhanced fields
      prisma.setting.upsert({
        where: { key: 'invoicePrefix' },
        update: { value: input.invoicePrefix ?? 'INV-', category: 'invoice' },
        create: { key: 'invoicePrefix', value: input.invoicePrefix ?? 'INV-', category: 'invoice' },
      }),
      prisma.setting.upsert({
        where: { key: 'nextInvoiceNumber' },
        update: { value: input.nextInvoiceNumber ?? '1001', category: 'invoice' },
        create: { key: 'nextInvoiceNumber', value: input.nextInvoiceNumber ?? '1001', category: 'invoice' },
      }),
      prisma.setting.upsert({
        where: { key: 'showTax' },
        update: { value: String(input.showTax !== false), category: 'invoice' },
        create: { key: 'showTax', value: String(input.showTax !== false), category: 'invoice' },
      }),
      prisma.setting.upsert({
        where: { key: 'termsAndConditions' },
        update: { value: input.termsAndConditions ?? '', category: 'invoice' },
        create: { key: 'termsAndConditions', value: input.termsAndConditions ?? '', category: 'invoice' },
      }),
      prisma.setting.upsert({
        where: { key: 'receiptWidth' },
        update: { value: input.receiptWidth ?? '80', category: 'invoice' },
        create: { key: 'receiptWidth', value: input.receiptWidth ?? '80', category: 'invoice' },
      }),
    ];

    await prisma.$transaction(upserts);
    revalidatePath('/admin/settings/invoice');
    return { success: true };
  } catch (error: any) {
    console.error(error);
    return { success: false, error: error.message };
  }
}

// ─────────────────────────────────────────────
// STORE SETTINGS
// ─────────────────────────────────────────────

const STORE_KEYS = [
  'storeName', 'tagline', 'phone', 'altPhone', 'email',
  'website', 'address', 'city', 'country', 'currency',
  'currencySymbol', 'timezone',
] as const;

export type StoreSettings = {
  storeName: string; tagline: string; phone: string; altPhone: string;
  email: string; website: string; address: string; city: string;
  country: string; currency: string; currencySymbol: string; timezone: string;
};

export async function getStoreSettings(): Promise<StoreSettings> {
  const rows = await prisma.setting.findMany({ where: { category: 'store' } });
  const map = rows.reduce((acc, r) => { acc[r.key] = r.value; return acc; }, {} as Record<string, string>);
  return {
    storeName: map.storeName || 'TechHat',
    tagline: map.tagline || '',
    phone: map.phone || '',
    altPhone: map.altPhone || '',
    email: map.email || '',
    website: map.website || '',
    address: map.address || '',
    city: map.city || '',
    country: map.country || 'Bangladesh',
    currency: map.currency || 'BDT',
    currencySymbol: map.currencySymbol || '৳',
    timezone: map.timezone || 'Asia/Dhaka',
  };
}

export async function updateStoreSettings(data: StoreSettings) {
  try {
    await prisma.$transaction(
      STORE_KEYS.map((key) =>
        prisma.setting.upsert({
          where: { key },
          update: { value: data[key] ?? '', category: 'store' },
          create: { key, value: data[key] ?? '', category: 'store' },
        })
      )
    );
    revalidatePath('/admin/settings/store');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ─────────────────────────────────────────────
// PAYMENT METHOD SETTINGS
// ─────────────────────────────────────────────

export type PaymentMethodSettings = {
  enabled: Record<string, boolean>;
  numbers: Record<string, string>;
  bankDetails: { name: string; account: string; branch: string; routing: string };
};

const DEFAULT_PAYMENT: PaymentMethodSettings = {
  enabled: { cash: true, card: true, bkash: true, nagad: true, rocket: false, bank: false },
  numbers: { bkash: '', nagad: '', rocket: '' },
  bankDetails: { name: '', account: '', branch: '', routing: '' },
};

export async function getPaymentMethodSettings(): Promise<PaymentMethodSettings> {
  const rows = await prisma.setting.findMany({ where: { category: 'payments' } });
  const map = rows.reduce((acc, r) => { acc[r.key] = r.value; return acc; }, {} as Record<string, string>);
  try {
    return {
      enabled: map.paymentEnabled ? JSON.parse(map.paymentEnabled) : DEFAULT_PAYMENT.enabled,
      numbers: map.paymentNumbers ? JSON.parse(map.paymentNumbers) : DEFAULT_PAYMENT.numbers,
      bankDetails: map.bankDetails ? JSON.parse(map.bankDetails) : DEFAULT_PAYMENT.bankDetails,
    };
  } catch {
    return DEFAULT_PAYMENT;
  }
}

export async function updatePaymentMethodSettings(data: PaymentMethodSettings) {
  try {
    await prisma.$transaction([
      prisma.setting.upsert({
        where: { key: 'paymentEnabled' },
        update: { value: JSON.stringify(data.enabled), category: 'payments' },
        create: { key: 'paymentEnabled', value: JSON.stringify(data.enabled), category: 'payments' },
      }),
      prisma.setting.upsert({
        where: { key: 'paymentNumbers' },
        update: { value: JSON.stringify(data.numbers), category: 'payments' },
        create: { key: 'paymentNumbers', value: JSON.stringify(data.numbers), category: 'payments' },
      }),
      prisma.setting.upsert({
        where: { key: 'bankDetails' },
        update: { value: JSON.stringify(data.bankDetails), category: 'payments' },
        create: { key: 'bankDetails', value: JSON.stringify(data.bankDetails), category: 'payments' },
      }),
    ]);
    revalidatePath('/admin/settings/payments');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ─── BRANDING SETTINGS ────────────────────────────────────────────────────────

export const getBrandingSettings = unstable_cache(
  async () => {
    const rows = await prisma.setting.findMany({ where: { category: 'branding' } });
    const m = Object.fromEntries(rows.map(r => [r.key, r.value]));
    return {
      siteLogo:           m['site_logo']          ?? '',
      siteFavicon:        m['site_favicon']       ?? '',
      topbarHotline:      m['topbar_hotline']     ?? '01700-000000',
      topbarDelivery:     m['topbar_delivery']    ?? 'Free Delivery on Orders Over ৳2,000',
      topbarShowDelivery: m['topbar_show_delivery'] !== 'false',
    };
  },
  ['branding-settings'],
  { revalidate: 300, tags: ['branding'] }
);

export type BrandingSettings = Awaited<ReturnType<typeof getBrandingSettings>>;

export async function updateBrandingSettings(data: BrandingSettings) {
  try {
    const pairs: Array<[string, string]> = [
      ['site_logo',            data.siteLogo],
      ['site_favicon',         data.siteFavicon],
      ['topbar_hotline',       data.topbarHotline],
      ['topbar_delivery',      data.topbarDelivery],
      ['topbar_show_delivery', String(data.topbarShowDelivery)],
    ];
    await Promise.all(
      pairs.map(([key, value]) =>
        prisma.setting.upsert({
          where: { key },
          update:  { value, category: 'branding' },
          create:  { key, value, category: 'branding' },
        })
      )
    );
    // @ts-ignore - Next.js 16 requires a second argument for revalidateTag
    revalidateTag('branding');
    revalidatePath('/');
    revalidatePath('/admin/settings/branding');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
