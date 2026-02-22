'use client';

import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { HomepageCategory } from '@/lib/homepage-types';

// Icons for fallback categories
const CATEGORY_COLORS = [
  'from-blue-500 to-blue-600',
  'from-purple-500 to-purple-600',
  'from-emerald-500 to-emerald-600',
  'from-orange-500 to-orange-600',
  'from-pink-500 to-pink-600',
  'from-cyan-500 to-cyan-600',
  'from-indigo-500 to-indigo-600',
  'from-rose-500 to-rose-600',
];

export default function TopCategories({ categories }: { categories: HomepageCategory[] }) {
  if (!categories.length) return null;

  return (
    <section className="py-8 sm:py-10 lg:py-12">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Top Categories</h2>
          <p className="text-sm sm:text-base text-gray-500 mt-1">Browse our most popular categories</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-5">
          {categories.slice(0, 12).map((cat, i) => (
            <Link
              key={cat.id}
              href={`/category/${cat.slug}`}
              className="group text-center"
            >
              <div
                className={cn(
                  'relative w-full aspect-square rounded-2xl overflow-hidden mb-3 transition-all duration-300',
                  'group-hover:shadow-xl group-hover:-translate-y-1',
                  'bg-gradient-to-br',
                  !cat.image && CATEGORY_COLORS[i % CATEGORY_COLORS.length]
                )}
              >
                {cat.image ? (
                  <>
                    <Image
                      src={cat.image}
                      alt={cat.name}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
                      className="object-cover group-hover:scale-110 transition-transform duration-500"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-4xl font-extrabold text-white/80">
                      {cat.name[0]}
                    </span>
                  </div>
                )}
                {cat._count && cat._count.products > 0 && (
                  <span className="absolute bottom-2 right-2 px-2 py-0.5 bg-white/90 backdrop-blur-sm rounded-full text-[10px] font-semibold text-gray-700">
                    {cat._count.products} items
                  </span>
                )}
              </div>
              <h3 className="text-sm font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">
                {cat.name}
              </h3>
            </Link>
          ))}
        </div>

        {categories.length > 12 && (
          <div className="text-center mt-8">
            <Link
              href="/categories"
              className="inline-flex items-center px-6 py-2.5 border border-gray-200 rounded-full text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all"
            >
              View All Categories
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
