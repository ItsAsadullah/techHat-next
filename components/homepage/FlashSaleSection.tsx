'use client';

import ProductCard from './ProductCard';
import ProductSection, { ProductGrid, ProductGridItem } from './ProductSection';
import CountdownTimer from './CountdownTimer';
import type { HomepageProduct, FlashSaleConfig } from '@/lib/homepage-types';

interface FlashSaleSectionProps {
  products: HomepageProduct[];
  config: FlashSaleConfig;
}

export default function FlashSaleSection({ products, config }: FlashSaleSectionProps) {
  if (!products.length || !config.isActive) return null;

  // Use the earliest flashSaleEndTime from products, or fallback to global config
  const endTime = products.reduce((earliest, p) => {
    if (p.flashSaleEndTime) {
      const t = new Date(p.flashSaleEndTime).getTime();
      return t < earliest ? t : earliest;
    }
    return earliest;
  }, new Date(config.endTime).getTime());

  const endTimeStr = new Date(endTime).toISOString();

  // If flash sale has expired, hide section
  if (endTime <= Date.now()) return null;

  return (
    <section className="py-8 sm:py-10 lg:py-12">
      <div className="container mx-auto px-4">
        {/* Header with countdown */}
        <div className="bg-gradient-to-r from-red-500 via-orange-500 to-amber-500 rounded-2xl p-5 sm:p-6 mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white flex items-center gap-2">
                ⚡ Flash Sale
              </h2>
              <p className="text-white/80 text-sm mt-1">Grab the best deals before they&apos;re gone!</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-white/80 text-sm font-medium hidden sm:block">Ends in:</span>
              <CountdownTimer targetDate={endTimeStr} />
            </div>
          </div>
        </div>

        {/* Products */}
        <ProductGrid>
          {products.map((product) => (
            <ProductGridItem key={product.id}>
              <ProductCard product={product} showStock />
            </ProductGridItem>
          ))}
        </ProductGrid>
      </div>
    </section>
  );
}
