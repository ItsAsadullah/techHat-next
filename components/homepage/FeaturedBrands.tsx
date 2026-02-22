'use client';

import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { HomepageBrand } from '@/lib/homepage-types';
import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function FeaturedBrands({ brands }: { brands: HomepageBrand[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  if (!brands.length) return null;

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const amount = 200;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -amount : amount,
      behavior: 'smooth',
    });
  };

  return (
    <section className="py-8 sm:py-10 lg:py-12 bg-gray-50/50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Featured Brands</h2>
          <p className="text-sm sm:text-base text-gray-500 mt-1">Shop from top brands you trust</p>
        </div>

        <div className="relative">
          {/* Scroll Buttons */}
          <button
            onClick={() => scroll('left')}
            className="absolute -left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white shadow-lg rounded-full flex items-center justify-center z-10 hover:bg-gray-50 transition-colors hidden lg:flex"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="absolute -right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white shadow-lg rounded-full flex items-center justify-center z-10 hover:bg-gray-50 transition-colors hidden lg:flex"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>

          {/* Brand Carousel */}
          <div
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide sm:gap-5"
          >
            {brands.map((brand) => (
              <Link
                key={brand.id}
                href={`/products?brand=${brand.slug}`}
                className="flex-shrink-0 snap-start group"
              >
                <div className="w-32 h-32 sm:w-36 sm:h-36 bg-white border border-gray-100 rounded-2xl flex items-center justify-center p-4 transition-all duration-300 group-hover:shadow-lg group-hover:border-blue-100 group-hover:-translate-y-1">
                  {brand.logo ? (
                    <Image
                      src={brand.logo}
                      alt={brand.name}
                      width={100}
                      height={100}
                      className="object-contain max-w-full max-h-full grayscale group-hover:grayscale-0 transition-all duration-300"
                      loading="lazy"
                    />
                  ) : (
                    <span className="text-lg font-bold text-gray-400 group-hover:text-blue-600 transition-colors">
                      {brand.name}
                    </span>
                  )}
                </div>
                <p className="text-center text-xs font-medium text-gray-600 mt-2 group-hover:text-blue-600 transition-colors">
                  {brand.name}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
