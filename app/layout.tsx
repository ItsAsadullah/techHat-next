import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Suspense } from 'react';
import NavbarWrapper from '@/components/NavbarWrapper';
import { Toaster } from 'sonner';
import { ThemeProvider } from '@/components/theme-provider';
import { Providers } from '@/components/Providers';
import { BrandingProvider } from '@/lib/context/branding-context';
import { StoreProvider } from '@/lib/context/store-context';
import { getStoreSettings } from '@/lib/actions/invoice-settings-actions';
import { getBrandingSettings, getAnalyticsSettings } from '@/lib/actions/invoice-settings-actions';
import { SpeedInsights } from '@vercel/speed-insights/next';
import MetaPixel from '@/components/MetaPixel';
import NextTopLoader from 'nextjs-toploader';
import { BengaliNumberConverter } from '@/components/BengaliNumberConverter';

export const revalidate = 600;

const inter = Inter({ subsets: ['latin'] });

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://techhat.shop';

/** Convert any stored image URL to a publicly accessible absolute URL */
function publicImageUrl(url: string | undefined | null): string | null {
  if (!url) return null;
  // Already a public absolute URL (Cloudinary, etc.)
  if (url.startsWith('http') && !url.includes('localhost') && !url.includes('127.0.0.1')) {
    return url;
  }
  // Local backend image — route through our proxy
  if (url.includes('/techhat/')) {
    const relativePath = url.split('/techhat/')[1];
    return `${SITE_URL}/api/proxy?path=${encodeURIComponent(relativePath)}`;
  }
  if (url.startsWith('/')) return `${SITE_URL}${url}`;
  return `${SITE_URL}/api/proxy?path=${encodeURIComponent(url)}`;
}

export async function generateMetadata(): Promise<Metadata> {
  let branding = { siteLogo: '', siteFavicon: '' };
  let store = { storeName: 'TechHat', tagline: 'Your one-stop shop for premium electronics and gadgets.' };
  
  try { 
    branding = await getBrandingSettings(); 
    const storeSettings = await getStoreSettings();
    if (storeSettings) {
      store.storeName = storeSettings.storeName || 'TechHat';
      store.tagline = storeSettings.tagline || 'Your one-stop shop for premium electronics and gadgets.';
    }
  } catch {}
  
  const logoUrl = publicImageUrl(branding.siteLogo);

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: store.storeName,
      template: `%s | ${store.storeName}`,
    },
    description: store.tagline,
    icons: {
      icon: '/api/favicon',
      shortcut: '/api/favicon',
      apple: '/api/favicon',
    },
    openGraph: {
      title: {
        default: store.storeName,
        template: `%s | ${store.storeName}`,
      },
      description: store.tagline,
      url: SITE_URL,
      siteName: store.storeName,
      type: 'website',
      // We purposefully DO NOT set openGraph.images here so that 
      // Next.js automatically uses our opengraph-image.tsx routes!
    },
    twitter: {
      card: 'summary_large_image',
      title: store.storeName,
      description: store.tagline,
    },
    verification: {
      google: 'ZPYxZN1XQs1qJIp1W7Q80GbcbZIuZYPexmEg6m1k5gg',
    },
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const brandingDefaults = { siteLogo: '', siteFavicon: '', topbarHotline: '', topbarDelivery: '', topbarShowDelivery: true };
  const storeSettingsDefaults = {
    storeName: 'TechHat', tagline: '', phone: '', altPhone: '',
    email: '', website: '', address: '', city: '', country: '',
    currency: 'BDT', currencySymbol: '৳', timezone: '',
    whatsappNumber: '', callNumber: ''
  };
  const analyticsDefaults = { metaPixelId: '', googleAnalyticsId: '', googleTagManagerId: '', tiktokPixelId: '' };

  // Next.js Turbopack dev server has a known bug where running multiple unstable_cache functions 
  // concurrently via Promise.all or Promise.allSettled can cause the server to hang indefinitely.
  // We fetch them sequentially to bypass this deadlock.
  
  const branding = await getBrandingSettings().catch(() => brandingDefaults);
  const storeSettings = await getStoreSettings().catch(() => storeSettingsDefaults);
  const analytics = await getAnalyticsSettings().catch(() => analyticsDefaults);

  const logoUrl = publicImageUrl(branding.siteLogo);

  // JSON-LD Organization schema so Google indexes the logo
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'TechHat',
    url: SITE_URL,
    ...(logoUrl ? { logo: logoUrl } : {}),
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        {/* Meta Pixel + Analytics — fires PageView on every page/navigation */}
        <MetaPixel
          pixelId={analytics.metaPixelId || undefined}
          googleAnalyticsId={analytics.googleAnalyticsId || undefined}
          googleTagManagerId={analytics.googleTagManagerId || undefined}
          tiktokPixelId={analytics.tiktokPixelId || undefined}
        />
        
        {/* Globally convert Bengali numbers to English numbers */}
        <BengaliNumberConverter />

        {/* JSON-LD for Google rich results / logo */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <NextTopLoader color="#2563eb" showSpinner={false} />
          <Suspense fallback={null}>
            <StoreProvider value={storeSettings}>
              <BrandingProvider value={branding}>
                <Providers>
                  <Suspense fallback={<div className="h-16 bg-white border-b border-gray-100 animate-pulse" />}>
                    <NavbarWrapper />
                  </Suspense>
                  <main className="min-h-screen bg-background text-foreground pb-16 lg:pb-0">
                    {children}
                  </main>
                  <Toaster position="top-center" richColors offset={100} />
                  <SpeedInsights />
                </Providers>
              </BrandingProvider>
            </StoreProvider>
          </Suspense>
        </ThemeProvider>
      </body>
    </html>
  );
}
