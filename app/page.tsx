import { Suspense } from 'react';
import Image from 'next/image';
import type { Metadata } from 'next';
import { getHomepageData } from '@/lib/actions/homepage-actions';
import HeroBanner from '@/components/homepage/HeroBanner';
import EnterpriseFooter from '@/components/homepage/EnterpriseFooter';
import WhyChooseUs from '@/components/homepage/WhyChooseUs';
import NewsletterSection from '@/components/homepage/NewsletterSection';
import PromoBanner from '@/components/homepage/PromoBanner';
import CampaignBanner from '@/components/homepage/CampaignBanner';
import RecentlyViewed from '@/components/homepage/RecentlyViewed';
import RecommendedSection from '@/components/homepage/RecommendedSection';
import {
  FlashSaleWrapper,
  BestSellersWrapper,
  NewArrivalsWrapper,
  TrendingWrapper,
  FeaturedBrandsWrapper,
  DealsUnderWrapper,
  ReviewsWrapper,
  ProductGridSkeleton,
  BrandGridSkeleton,
  MegaCategoryNavWrapper,
  TopCategoriesWrapper,
  CategoryNavSkeleton
} from '@/components/homepage/SectionWrappers';

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
  // Fetch only the lightweight configuration data to unblock the initial render
  const homepageData = await getHomepageData();

  // Get deals amount from section config
  const dealsSection = homepageData.sections.find((s) => s.type === 'deals-under');
  const dealsAmount = dealsSection?.config?.amount || 5000;

  const visibleSections = homepageData.sections.filter((s) => s.isVisible);

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
              <Suspense fallback={<CategoryNavSkeleton />}>
                <MegaCategoryNavWrapper />
              </Suspense>

              {/* Right: Hero Banner */}
              <div className="flex-1 min-w-0">
                <HeroBanner banners={homepageData.banners} />

                {homepageData.heroGifUrl ? (
                  <div className="mt-4 rounded-xl overflow-hidden border border-gray-200 bg-white">
                    <Image
                      src={homepageData.heroGifUrl}
                      alt="Promotional banner"
                      width={800}
                      height={300}
                      unoptimized
                      priority={false}
                      loading="lazy"
                      className="w-full h-auto"
                    />
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </section>

        {/* Dynamic Sections */}
        {visibleSections.map((section) => {
          let sectionContent = null;
          switch (section.type) {
            case 'top-categories':
              sectionContent = (
                <Suspense key={section.id} fallback={<BrandGridSkeleton />}>
                  <TopCategoriesWrapper />
                </Suspense>
              );
              break;
            case 'flash-sale':
              sectionContent = (
                <Suspense key={section.id} fallback={<ProductGridSkeleton />}>
                  <FlashSaleWrapper config={homepageData.flashSaleConfig} />
                </Suspense>
              );
              break;
            case 'best-sellers':
              sectionContent = (
                <Suspense key={section.id} fallback={<ProductGridSkeleton />}>
                  <BestSellersWrapper />
                </Suspense>
              );
              break;
            case 'new-arrivals':
              sectionContent = (
                <Suspense key={section.id} fallback={<ProductGridSkeleton />}>
                  <NewArrivalsWrapper />
                </Suspense>
              );
              break;
            case 'trending':
              sectionContent = (
                <Suspense key={section.id} fallback={<ProductGridSkeleton />}>
                  <TrendingWrapper />
                </Suspense>
              );
              break;
            case 'featured-brands':
              sectionContent = (
                <Suspense key={section.id} fallback={<BrandGridSkeleton />}>
                  <FeaturedBrandsWrapper />
                </Suspense>
              );
              break;
            case 'deals-under':
              sectionContent = (
                <Suspense key={section.id} fallback={<ProductGridSkeleton />}>
                  <DealsUnderWrapper amount={section.config?.amount || dealsAmount} />
                </Suspense>
              );
              break;
            case 'campaign-banner':
              sectionContent = <CampaignBanner key={section.id} campaigns={homepageData.campaigns} />;
              break;
            case 'recently-viewed':
              sectionContent = <RecentlyViewed key={section.id} />;
              break;
            case 'recommended':
              sectionContent = <RecommendedSection key={section.id} />;
              break;
            case 'why-choose-us':
              sectionContent = <WhyChooseUs key={section.id} />;
              break;
            case 'reviews':
              sectionContent = (
                <Suspense key={section.id} fallback={<div className="h-64 bg-gray-100 animate-pulse rounded-xl my-8" />}>
                  <ReviewsWrapper />
                </Suspense>
              );
              break;
            case 'newsletter':
              sectionContent = <NewsletterSection key={section.id} />;
              break;
          }

          return (
            <div key={section.id}>
              {sectionContent}
              {/* Render promotional banners after certain sections */}
              {homepageData.promoBanners
                .filter((pb) => pb.isActive && pb.afterSection === section.order)
                .map((pb) => (
                  <PromoBanner key={pb.id} banner={pb} />
                ))}
            </div>
          );
        })}
      </main>

      {/* Enterprise Footer */}
      <EnterpriseFooter />
    </>
  );
}
