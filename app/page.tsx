import { Suspense } from 'react';
import type { Metadata } from 'next';
import {
  getHomepageData,
  getFlashSaleProducts,
  getBestSellerProducts,
  getNewArrivalProducts,
  getTrendingProducts,
  getFeaturedBrands,
  getDealsUnderAmount,
  getHomepageReviews,
} from '@/lib/actions/homepage-actions';
import HeroBanner from '@/components/homepage/HeroBanner';
import MegaCategoryNav from '@/components/homepage/MegaCategoryNav';
import HomepageSections from '@/components/homepage/HomepageSections';
import EnterpriseFooter from '@/components/homepage/EnterpriseFooter';

// ─── ISR: Revalidate every 60 seconds ──────────────────────
export const revalidate = 60;

// ─── SEO Metadata ──────────────────────────────────────────
export const metadata: Metadata = {
  title: 'TechHat - Premium Electronics Store | Best Deals on Gadgets & Tech',
  description:
    'Shop the latest electronics, smartphones, laptops, gaming gear, and smart devices at TechHat. Free delivery, genuine products, and unbeatable prices. Bangladesh\'s trusted tech store.',
  keywords: [
    'electronics store bangladesh',
    'buy electronics online',
    'smartphones',
    'laptops',
    'gaming accessories',
    'tech gadgets',
    'techhat',
    'best price electronics',
  ],
  openGraph: {
    title: 'TechHat - Premium Electronics Store',
    description: 'Your one-stop shop for premium electronics and gadgets. Free delivery on orders over ৳2,000.',
    type: 'website',
    locale: 'en_US',
    url: 'https://techhat.com',
    siteName: 'TechHat',
    images: [
      {
        url: 'https://techhat.com/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'TechHat - Premium Electronics Store',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TechHat - Premium Electronics Store',
    description: 'Shop the latest electronics at unbeatable prices.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: 'https://techhat.com',
  },
};

// ─── Schema.org Structured Data ─────────────────────────────
function WebsiteSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'TechHat',
    url: 'https://techhat.com',
    description: 'Premium electronics store in Bangladesh',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://techhat.com/products?search={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

function OrganizationSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'TechHat',
    url: 'https://techhat.com',
    logo: 'https://techhat.com/logo.png',
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+880-1700-000000',
      contactType: 'customer service',
      areaServed: 'BD',
      availableLanguage: ['English', 'Bengali'],
    },
    sameAs: [
      'https://facebook.com/techhat',
      'https://twitter.com/techhat',
      'https://instagram.com/techhat',
      'https://youtube.com/techhat',
    ],
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'House #12, Road #5, Dhanmondi',
      addressLocality: 'Dhaka',
      postalCode: '1205',
      addressCountry: 'BD',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// ─── Main Homepage ─────────────────────────────────────────
export default async function HomePage() {
  // Parallel data fetching for optimal performance
  const [
    homepageData,
    flashSaleProducts,
    bestSellers,
    newArrivals,
    trending,
    brands,
    reviews,
  ] = await Promise.all([
    getHomepageData(),
    getFlashSaleProducts(12),
    getBestSellerProducts(10),
    getNewArrivalProducts(10),
    getTrendingProducts(10),
    getFeaturedBrands(),
    getHomepageReviews(10),
  ]);

  // Get deals amount from section config
  const dealsSection = homepageData.sections.find((s) => s.type === 'deals-under');
  const dealsAmount = dealsSection?.config?.amount || 5000;
  const dealsUnder = await getDealsUnderAmount(dealsAmount, 10);

  return (
    <>
      <WebsiteSchema />
      <OrganizationSchema />

      <main className="min-h-screen bg-white">
        {/* Hero Section with Mega Category Nav */}
        <section className="bg-gray-50/50 py-4 lg:py-6">
          <div className="container mx-auto px-4">
            <div className="flex gap-5">
              {/* Left: Mega Category Navigation (Desktop only) */}
              <MegaCategoryNav categories={homepageData.categories} />

              {/* Right: Hero Banner */}
              <div className="flex-1 min-w-0">
                <HeroBanner banners={homepageData.banners} />
              </div>
            </div>
          </div>
        </section>

        {/* Dynamic Sections */}
        <HomepageSections
          sections={homepageData.sections}
          promoBanners={homepageData.promoBanners}
          data={{
            flashSaleProducts,
            flashSaleConfig: homepageData.flashSaleConfig,
            bestSellers,
            newArrivals,
            trending,
            categories: homepageData.categories,
            brands,
            dealsUnder,
            reviews,
            dealsAmount,
            campaigns: homepageData.campaigns,
          }}
        />
      </main>

      {/* Enterprise Footer */}
      <EnterpriseFooter />
    </>
  );
}
