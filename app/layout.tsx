import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import NavbarWrapper from '@/components/NavbarWrapper';
import { Toaster } from 'sonner';
import { ThemeProvider } from '@/components/theme-provider';
import { Providers } from '@/components/Providers';
import { BrandingProvider } from '@/lib/context/branding-context';
import { getBrandingSettings } from '@/lib/actions/invoice-settings-actions';

export const dynamic = 'force-dynamic';

const inter = Inter({ subsets: ['latin'] });

export async function generateMetadata(): Promise<Metadata> {
  try {
    const { getBrandingSettings } = await import('@/lib/actions/invoice-settings-actions');
    const { siteFavicon } = await getBrandingSettings();
    return {
      title: 'TechHat - Premium Electronics Store',
      description: 'Your one-stop shop for premium electronics and gadgets.',
      ...(siteFavicon ? { icons: { icon: siteFavicon } } : {}),
    };
  } catch {
    return {
      title: 'TechHat - Premium Electronics Store',
      description: 'Your one-stop shop for premium electronics and gadgets.',
    };
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const branding = await getBrandingSettings();
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <BrandingProvider value={branding}>
            <Providers>
              <NavbarWrapper />
              <main className="min-h-screen bg-background text-foreground">
                {children}
              </main>
              <Toaster position="top-right" richColors offset={100} />
            </Providers>
          </BrandingProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
