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

export const revalidate = 600;

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'TechHat - Premium Electronics Store',
  description: 'Your one-stop shop for premium electronics and gadgets.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const brandingPromise = getBrandingSettings();
  
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
            <BrandingProvider valuePromise={brandingPromise}>
              <Providers>
                <NavbarWrapper />
                <main className="min-h-screen bg-background text-foreground">
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
