'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { HomepageBanner } from '@/lib/homepage-types';

export default function HeroBanner({ banners }: { banners: HomepageBanner[] }) {
  const [current, setCurrent] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const next = useCallback(() => {
    setCurrent((c) => (c + 1) % banners.length);
  }, [banners.length]);

  const prev = useCallback(() => {
    setCurrent((c) => (c - 1 + banners.length) % banners.length);
  }, [banners.length]);

  // Auto-slide
  useEffect(() => {
    if (isHovered || banners.length <= 1) return;
    const interval = setInterval(next, 5000);
    return () => clearInterval(interval);
  }, [next, isHovered, banners.length]);

  if (!banners.length) return null;

  return (
    <div
      className="relative w-full overflow-hidden rounded-xl lg:rounded-2xl"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Slides */}
      <div className="relative aspect-[16/7] sm:aspect-[16/6] lg:aspect-[16/5]">
        {banners.map((banner, i) => (
          <div
            key={banner.id}
            className={cn(
              'absolute inset-0 transition-all duration-700 ease-in-out',
              i === current ? 'opacity-100 scale-100' : 'opacity-0 scale-105 pointer-events-none'
            )}
          >
            {/* Background Image */}
            <Image
              src={banner.image}
              alt={banner.title}
              fill
              sizes="100vw"
              className="object-cover"
              priority={i === 0}
              quality={85}
            />
            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />

            {/* Content */}
            <div className="absolute inset-0 flex items-center">
              <div className="container mx-auto px-4 lg:px-6">
                <div className="max-w-lg space-y-4">
                  {banner.badge && (
                    <span className="inline-block px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-full uppercase tracking-wide animate-pulse">
                      {banner.badge}
                    </span>
                  )}
                  <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-extrabold text-white leading-tight">
                    {banner.title}
                  </h2>
                  {banner.subtitle && (
                    <p className="text-sm sm:text-base lg:text-lg text-white/80 max-w-md">
                      {banner.subtitle}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-3 pt-2">
                    {banner.ctaText && banner.ctaLink && (
                      <Link
                        href={banner.ctaLink}
                        className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-full transition-all shadow-lg shadow-blue-600/30 hover:shadow-blue-600/50 hover:-translate-y-0.5"
                      >
                        {banner.ctaText}
                      </Link>
                    )}
                    {banner.secondaryCtaText && banner.secondaryCtaLink && (
                      <Link
                        href={banner.secondaryCtaLink}
                        className="inline-flex items-center px-6 py-3 bg-white/15 hover:bg-white/25 backdrop-blur text-white text-sm font-semibold rounded-full transition-all border border-white/30"
                      >
                        {banner.secondaryCtaText}
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      {banners.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/40 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 hover:opacity-100 focus:opacity-100"
            style={{ opacity: isHovered ? 1 : 0 }}
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <button
            onClick={next}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/40 flex items-center justify-center transition-all"
            style={{ opacity: isHovered ? 1 : 0 }}
          >
            <ChevronRight className="w-5 h-5 text-white" />
          </button>
        </>
      )}

      {/* Dots */}
      {banners.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
          {banners.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={cn(
                'rounded-full transition-all',
                i === current
                  ? 'w-8 h-2.5 bg-white'
                  : 'w-2.5 h-2.5 bg-white/40 hover:bg-white/60'
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
