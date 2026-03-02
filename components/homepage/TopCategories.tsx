import Image from 'next/image';
import Link from 'next/link';
import { isLucideIcon, ICON_MAP } from '@/lib/category-icon';
import type { HomepageCategory } from '@/lib/homepage-types';

const CATEGORY_GRADIENTS = [
  { bg: 'from-blue-500 to-indigo-600',     light: 'bg-blue-50',    ring: 'ring-blue-200'   },
  { bg: 'from-violet-500 to-purple-600',   light: 'bg-violet-50',  ring: 'ring-violet-200' },
  { bg: 'from-emerald-500 to-teal-600',    light: 'bg-emerald-50', ring: 'ring-emerald-200'},
  { bg: 'from-orange-500 to-amber-600',    light: 'bg-orange-50',  ring: 'ring-orange-200' },
  { bg: 'from-pink-500 to-rose-600',       light: 'bg-pink-50',    ring: 'ring-pink-200'   },
  { bg: 'from-cyan-500 to-sky-600',        light: 'bg-cyan-50',    ring: 'ring-cyan-200'   },
  { bg: 'from-indigo-500 to-blue-700',     light: 'bg-indigo-50',  ring: 'ring-indigo-200' },
  { bg: 'from-rose-500 to-pink-700',       light: 'bg-rose-50',    ring: 'ring-rose-200'   },
  { bg: 'from-teal-500 to-emerald-700',    light: 'bg-teal-50',    ring: 'ring-teal-200'   },
  { bg: 'from-amber-500 to-orange-700',    light: 'bg-amber-50',   ring: 'ring-amber-200'  },
  { bg: 'from-sky-500 to-cyan-700',        light: 'bg-sky-50',     ring: 'ring-sky-200'    },
  { bg: 'from-fuchsia-500 to-pink-700',    light: 'bg-fuchsia-50', ring: 'ring-fuchsia-200'},
];

export default function TopCategories({ categories }: { categories: HomepageCategory[] }) {
  if (!categories.length) return null;

  const visible = categories.slice(0, 12);

  return (
    <section className="py-8 sm:py-10 lg:py-12">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Top Categories</h2>
          <p className="text-sm sm:text-base text-gray-500 mt-1">Browse our most popular categories</p>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-6 gap-4 sm:gap-5">
          {visible.map((cat, i) => {
            const gradient = CATEGORY_GRADIENTS[i % CATEGORY_GRADIENTS.length];
            const isIcon = isLucideIcon(cat.image);
            const LucideIcon = isIcon && cat.image
              ? ICON_MAP[cat.image]
              : null;

            return (
              <Link
                key={cat.id}
                href={`/category/${cat.slug}`}
                className="group flex flex-col items-center text-center"
              >
                {/* Icon / Image Circle */}
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 mb-3 flex-shrink-0">
                  {/* Outer ring on hover */}
                  <div className={`absolute inset-0 rounded-2xl sm:rounded-2xl ring-2 ring-transparent group-hover:${gradient.ring} transition-all duration-300 scale-100 group-hover:scale-105`} />

                  {cat.image && !isIcon ? (
                    // Real image
                    <div className="w-full h-full rounded-2xl overflow-hidden border border-gray-100 shadow-sm group-hover:shadow-md transition-shadow">
                      <Image
                        src={cat.image}
                        alt={cat.name}
                        fill
                        sizes="80px"
                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    </div>
                  ) : (
                    // Icon or letter fallback
                    <div
                      className={`w-full h-full rounded-2xl bg-gradient-to-br ${gradient.bg} flex items-center justify-center shadow-sm group-hover:shadow-lg transition-all duration-300 group-hover:scale-105`}
                    >
                      {LucideIcon ? (
                        <LucideIcon className="w-7 h-7 sm:w-8 sm:h-8 text-white drop-shadow-sm" />
                      ) : (
                        <span className="text-2xl sm:text-3xl font-extrabold text-white/90">
                          {cat.name[0]}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Product count badge */}
                  {cat._count && cat._count.products > 0 && (
                    <span className="absolute -bottom-1.5 -right-1.5 px-1.5 py-0.5 bg-white border border-gray-100 rounded-full text-[9px] font-bold text-gray-600 shadow-sm">
                      {cat._count.products}
                    </span>
                  )}
                </div>

                {/* Name */}
                <h3 className="text-xs sm:text-sm font-semibold text-gray-700 group-hover:text-blue-600 transition-colors leading-tight">
                  {cat.name}
                </h3>
              </Link>
            );
          })}
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
