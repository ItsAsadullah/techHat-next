'use client';

import dynamic from 'next/dynamic';
import type {
  HomepageSectionConfig,
  HomepageProduct,
  HomepageCategory,
  HomepageBrand,
  HomepageReview,
  FlashSaleConfig,
  PromoBanner as PromoBannerType,
} from '@/lib/homepage-types';

// Lazy-loaded section components for optimal bundle splitting
const FlashSaleSection = dynamic(() => import('./FlashSaleSection'), { ssr: true });
const BestSellers = dynamic(() => import('./BestSellers'), { ssr: true });
const NewArrivals = dynamic(() => import('./NewArrivals'), { ssr: true });
const TrendingProducts = dynamic(() => import('./TrendingProducts'), { ssr: true });
const TopCategories = dynamic(() => import('./TopCategories'), { ssr: true });
const FeaturedBrands = dynamic(() => import('./FeaturedBrands'), { ssr: true });
const DealsUnderSection = dynamic(() => import('./DealsUnderSection'), { ssr: true });
const WhyChooseUs = dynamic(() => import('./WhyChooseUs'), { ssr: true });
const ReviewSlider = dynamic(() => import('./ReviewSlider'), { ssr: true });
const NewsletterSection = dynamic(() => import('./NewsletterSection'), { ssr: true });
const PromoBanner = dynamic(() => import('./PromoBanner'), { ssr: true });
const CampaignBanner = dynamic(() => import('./CampaignBanner'), { ssr: true });
// Client-only sections (use localStorage)
const RecentlyViewed = dynamic(() => import('./RecentlyViewed'), { ssr: false });
const RecommendedSection = dynamic(() => import('./RecommendedSection'), { ssr: false });

interface Campaign {
  id: string;
  title: string;
  subtitle?: string | null;
  bannerImage?: string | null;
  ctaLink?: string | null;
}

interface HomepageSectionsProps {
  sections: HomepageSectionConfig[];
  promoBanners: PromoBannerType[];
  data: {
    flashSaleProducts: HomepageProduct[];
    flashSaleConfig: FlashSaleConfig;
    bestSellers: HomepageProduct[];
    newArrivals: HomepageProduct[];
    trending: HomepageProduct[];
    categories: HomepageCategory[];
    brands: HomepageBrand[];
    dealsUnder: HomepageProduct[];
    reviews: HomepageReview[];
    dealsAmount: number;
    campaigns: Campaign[];
  };
}

export default function HomepageSections({ sections, promoBanners, data }: HomepageSectionsProps) {
  const visibleSections = sections.filter((s) => s.isVisible);

  const renderSection = (section: HomepageSectionConfig) => {
    switch (section.type) {
      case 'top-categories':
        return <TopCategories key={section.id} categories={data.categories} />;
      case 'flash-sale':
        return (
          <FlashSaleSection
            key={section.id}
            products={data.flashSaleProducts}
            config={data.flashSaleConfig}
          />
        );
      case 'best-sellers':
        return <BestSellers key={section.id} products={data.bestSellers} />;
      case 'new-arrivals':
        return <NewArrivals key={section.id} products={data.newArrivals} />;
      case 'trending':
        return <TrendingProducts key={section.id} products={data.trending} />;
      case 'featured-brands':
        return <FeaturedBrands key={section.id} brands={data.brands} />;
      case 'deals-under':
        return (
          <DealsUnderSection
            key={section.id}
            products={data.dealsUnder}
            amount={section.config?.amount || data.dealsAmount}
          />
        );
      case 'campaign-banner':
        return <CampaignBanner key={section.id} campaigns={data.campaigns} />;
      case 'recently-viewed':
        return <RecentlyViewed key={section.id} />;
      case 'recommended':
        return <RecommendedSection key={section.id} />;
      case 'why-choose-us':
        return <WhyChooseUs key={section.id} />;
      case 'reviews':
        return <ReviewSlider key={section.id} reviews={data.reviews} />;
      case 'newsletter':
        return <NewsletterSection key={section.id} />;
      default:
        return null;
    }
  };

  return (
    <>
      {visibleSections.map((section, index) => (
        <div key={section.id}>
          {renderSection(section)}
          {/* Render promotional banners after certain sections */}
          {promoBanners
            .filter((pb) => pb.isActive && pb.afterSection === section.order)
            .map((pb) => (
              <PromoBanner key={pb.id} banner={pb} />
            ))}
        </div>
      ))}
    </>
  );
}
