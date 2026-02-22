import { Suspense } from 'react';
import {
  getFlashSaleProducts,
  getBestSellerProducts,
  getNewArrivalProducts,
  getTrendingProducts,
  getFeaturedBrands,
  getDealsUnderAmount,
  getHomepageReviews,
} from '@/lib/actions/homepage-actions';
import FlashSaleSection from './FlashSaleSection';
import BestSellers from './BestSellers';
import NewArrivals from './NewArrivals';
import TrendingProducts from './TrendingProducts';
import TopCategories from './TopCategories';
import FeaturedBrands from './FeaturedBrands';
import DealsUnderSection from './DealsUnderSection';
import ReviewSlider from './ReviewSlider';

// Skeletons
export function ProductGridSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div className="h-8 w-48 bg-gray-200 animate-pulse rounded" />
        <div className="h-8 w-24 bg-gray-200 animate-pulse rounded" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <div className="h-48 w-full bg-gray-200 animate-pulse rounded-xl" />
            <div className="h-4 w-3/4 bg-gray-200 animate-pulse rounded" />
            <div className="h-4 w-1/2 bg-gray-200 animate-pulse rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function BrandGridSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="h-8 w-48 bg-gray-200 animate-pulse rounded mb-6" />
      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-24 w-full bg-gray-200 animate-pulse rounded-xl" />
        ))}
      </div>
    </div>
  );
}

// Wrappers
export async function FlashSaleWrapper({ config }: { config: any }) {
  const products = await getFlashSaleProducts(12);
  if (!products.length) return null;
  return <FlashSaleSection products={products} config={config} />;
}

export async function BestSellersWrapper() {
  const products = await getBestSellerProducts(10);
  if (!products.length) return null;
  return <BestSellers products={products} />;
}

export async function NewArrivalsWrapper() {
  const products = await getNewArrivalProducts(10);
  if (!products.length) return null;
  return <NewArrivals products={products} />;
}

export async function TrendingWrapper() {
  const products = await getTrendingProducts(10);
  if (!products.length) return null;
  return <TrendingProducts products={products} />;
}

export async function FeaturedBrandsWrapper() {
  const brands = await getFeaturedBrands();
  if (!brands.length) return null;
  return <FeaturedBrands brands={brands} />;
}

export async function DealsUnderWrapper({ amount }: { amount: number }) {
  const products = await getDealsUnderAmount(amount, 10);
  if (!products.length) return null;
  return <DealsUnderSection products={products} amount={amount} />;
}

export async function ReviewsWrapper() {
  const reviews = await getHomepageReviews(10);
  if (!reviews.length) return null;
  return <ReviewSlider reviews={reviews} />;
}
