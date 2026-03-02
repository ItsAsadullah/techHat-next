// ─────────────────────────────────────────────────────────────
// HOMEPAGE TYPES & DEFAULTS
// ─────────────────────────────────────────────────────────────

export interface HomepageBanner {
  id: string;
  title: string;
  subtitle?: string;
  image: string;
  video?: string;
  youtubeUrl?: string;
  mobileImage?: string;
  link?: string;
  ctaText?: string;
  ctaLink?: string;
  secondaryCtaText?: string;
  secondaryCtaLink?: string;
  badge?: string;
  isActive: boolean;
  order: number;
  /** Which panel this banner belongs to on the homepage grid */
  slot?: 'main' | 'right-top' | 'right-bottom';
}

export interface HomepageSectionConfig {
  id: string;
  type: SectionType;
  title: string;
  subtitle?: string;
  isVisible: boolean;
  order: number;
  config?: Record<string, any>;
}

export type SectionType =
  | 'top-categories'
  | 'flash-sale'
  | 'best-sellers'
  | 'new-arrivals'
  | 'trending'
  | 'featured-brands'
  | 'deals-under'
  | 'campaign-banner'
  | 'recently-viewed'
  | 'recommended'
  | 'why-choose-us'
  | 'reviews'
  | 'newsletter'
  | 'promo-banner';

export interface PromoBanner {
  id: string;
  title: string;
  subtitle?: string;
  image: string;
  link?: string;
  bgColor?: string;
  isActive: boolean;
  afterSection: number; // render after this section order index
}

export interface FlashSaleConfig {
  endTime: string;
  isActive: boolean;
}

export interface HomepageProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  offerPrice: number | null;
  costPrice: number;
  stock: number;
  images: string[];
  thumbnailUrl?: string;
  categoryName: string;
  categorySlug: string;
  brandName?: string | null;
  rating: number;
  reviewCount: number;
  isFeatured: boolean;
  isFlashSale: boolean;
  isBestSeller: boolean;
  viewCount: number;
  soldCount: number;
  discountPercentage: number | null;
  flashSaleEndTime: string | null;
  createdAt: string;
  _soldCount?: number;
}

export interface HomepageCategory {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  children: HomepageCategory[];
  _count?: { products: number };
}

export interface HomepageBrand {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  _count?: { products: number };
}

export interface HomepageReview {
  id: string;
  name: string;
  rating: number;
  reviewText: string;
  isVerified: boolean;
  createdAt: string;
  productName: string;
  productSlug: string;
}

// ─── DEFAULTS ──────────────────────────────────────────────

export const DEFAULT_HOMEPAGE_SECTIONS: HomepageSectionConfig[] = [
  { id: '1', type: 'top-categories', title: 'Top Categories', subtitle: 'Shop by category', isVisible: true, order: 1 },
  { id: '2', type: 'flash-sale', title: '⚡ Flash Sale', subtitle: 'Hurry! Deal ends soon', isVisible: true, order: 2 },
  { id: '3', type: 'best-sellers', title: 'Best Sellers', subtitle: 'Most popular this month', isVisible: true, order: 3 },
  { id: '4', type: 'new-arrivals', title: 'New Arrivals', subtitle: 'Just landed in store', isVisible: true, order: 4 },
  { id: '5', type: 'trending', title: 'Trending Now', subtitle: 'Hot picks this week', isVisible: true, order: 5 },
  { id: '6', type: 'campaign-banner', title: 'Campaign Banners', subtitle: 'Active campaigns', isVisible: true, order: 6 },
  { id: '7', type: 'featured-brands', title: 'Featured Brands', subtitle: 'Shop by brand', isVisible: true, order: 7 },
  { id: '8', type: 'deals-under', title: 'Deals Under ৳5,000', subtitle: 'Budget-friendly picks', isVisible: true, order: 8, config: { amount: 5000 } },
  { id: '9', type: 'recently-viewed', title: 'Recently Viewed', subtitle: 'Continue where you left off', isVisible: true, order: 9 },
  { id: '10', type: 'recommended', title: 'Recommended For You', subtitle: 'Based on your browsing', isVisible: true, order: 10 },
  { id: '11', type: 'why-choose-us', title: 'Why Choose TechHat', isVisible: true, order: 11 },
  { id: '12', type: 'reviews', title: 'Customer Reviews', subtitle: 'Hear from our happy customers', isVisible: true, order: 12 },
  { id: '13', type: 'newsletter', title: 'Stay Updated', subtitle: 'Get exclusive deals & offers', isVisible: true, order: 13 },
];

export const DEFAULT_BANNERS: HomepageBanner[] = [
  {
    id: '1',
    title: 'Latest Tech at Unbeatable Prices',
    subtitle: 'Up to 40% off on premium electronics & gadgets',
    image: 'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=1600&h=600&fit=crop&q=80',
    ctaText: 'Shop Now',
    ctaLink: '/products',
    secondaryCtaText: 'View Offers',
    secondaryCtaLink: '/offers',
    badge: 'New Season',
    isActive: true,
    order: 1,
  },
  {
    id: '2',
    title: 'Smart Home Revolution',
    subtitle: 'Transform your home with intelligent devices',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=1600&h=600&fit=crop&q=80',
    ctaText: 'Explore',
    ctaLink: '/category/smart-devices',
    badge: 'Trending',
    isActive: true,
    order: 2,
  },
  {
    id: '3',
    title: 'Gaming Gear Sale',
    subtitle: 'Level up your experience with top gaming peripherals',
    image: 'https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=1600&h=600&fit=crop&q=80',
    ctaText: 'View Deals',
    ctaLink: '/category/gaming',
    badge: 'Limited Offer',
    isActive: true,
    order: 3,
  },
];

export const DEFAULT_PROMO_BANNERS: PromoBanner[] = [
  {
    id: '1',
    title: 'Free Delivery on Orders Over ৳2,000',
    subtitle: 'Shop more, save more on shipping',
    image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&h=300&fit=crop&q=80',
    bgColor: 'from-blue-600 to-indigo-700',
    isActive: true,
    afterSection: 3,
  },
  {
    id: '2',
    title: 'Exclusive Member Deals',
    subtitle: 'Sign up for up to 25% extra discount',
    image: 'https://images.unsplash.com/photo-1607082349566-187342175e2f?w=1200&h=300&fit=crop&q=80',
    bgColor: 'from-purple-600 to-pink-600',
    isActive: true,
    afterSection: 6,
  },
];
