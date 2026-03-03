import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Suspense } from 'react';
import NavbarWrapper from '@/components/NavbarWrapper';
import { Toaster } from 'sonner';
import { ThemeProvider } from '@/components/theme-provider';
import { Providers } from '@/components/Providers';
import { BrandingProvider } from '@/lib/context/branding-context';
import { getBrandingSettings } from '@/lib/actions/invoice-settings-actions';
import { SpeedInsights } from '@vercel/speed-insights/next';
import Loading from './loading';

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
  const branding = await getBrandingSettings();
  const logoUrl = publicImageUrl(branding.siteLogo);

  return {
    title: 'TechHat - Premium Electronics Store',
    description: 'Your one-stop shop for premium electronics and gadgets.',
    icons: {
      icon: '/api/favicon',
      shortcut: '/api/favicon',
      apple: '/api/favicon',
    },
    openGraph: {
      title: 'TechHat - Premium Electronics Store',
      description: 'Your one-stop shop for premium electronics and gadgets.',
      url: SITE_URL,
      siteName: 'TechHat',
      ...(logoUrl ? { images: [{ url: logoUrl, width: 512, height: 512, alt: 'TechHat Logo' }] } : {}),
    },
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const brandingPromise = getBrandingSettings();
  const branding = await brandingPromise;
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
          <Suspense fallback={<Loading />}>
            <BrandingProvider value={branding}>
              <Providers>
                <Suspense fallback={<div className="h-16 bg-white border-b border-gray-100 animate-pulse" />}>
                  <NavbarWrapper />
                </Suspense>
                <main className="min-h-screen bg-background text-foreground pb-16 lg:pb-0">
                  {children}
                </main>
                <Toaster position="top-right" richColors offset={100} />
                <SpeedInsights />
              </Providers>
            </BrandingProvider>
          </Suspense>
        </ThemeProvider>
      </body>
    </html>
  );
}
