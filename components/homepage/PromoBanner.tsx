'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { PromoBanner as PromoBannerType } from '@/lib/homepage-types';

export default function PromoBanner({ banner }: { banner: PromoBannerType }) {
  if (!banner.isActive) return null;

  const content = (
    <div className={`relative w-full overflow-hidden rounded-2xl bg-gradient-to-r ${banner.bgColor || 'from-blue-600 to-indigo-700'}`}>
      <div className="relative flex items-center min-h-[140px] sm:min-h-[180px]">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-1/2 -translate-x-1/2" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between w-full px-6 sm:px-10 py-6 gap-4">
          <div className="text-center sm:text-left">
            <h3 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white">
              {banner.title}
            </h3>
            {banner.subtitle && (
              <p className="text-white/80 text-sm sm:text-base mt-1">{banner.subtitle}</p>
            )}
          </div>
          {banner.link && (
            <span className="inline-flex items-center px-6 py-3 bg-white text-gray-900 text-sm font-semibold rounded-full hover:shadow-lg transition-all hover:-translate-y-0.5 whitespace-nowrap">
              Shop Now →
            </span>
          )}
        </div>

        {/* Optional Image */}
        {banner.image && (
          <div className="absolute right-0 top-0 bottom-0 w-1/3 hidden lg:block">
            <Image
              src={banner.image}
              alt={banner.title}
              fill
              className="object-cover opacity-20"
              loading="lazy"
            />
          </div>
        )}
      </div>
    </div>
  );

  if (banner.link) {
    return (
      <div className="container mx-auto px-4 py-4">
        <Link href={banner.link} className="block hover:shadow-xl transition-shadow rounded-2xl">
          {content}
        </Link>
      </div>
    );
  }

  return <div className="container mx-auto px-4 py-4">{content}</div>;
}
