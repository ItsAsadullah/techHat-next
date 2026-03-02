'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { isLucideIcon, ICON_MAP } from '@/lib/category-icon';
import type { HomepageCategory } from '@/lib/homepage-types';

const NAV_GRADIENTS = [
  'from-blue-500 to-indigo-600',
  'from-violet-500 to-purple-600',
  'from-emerald-500 to-teal-600',
  'from-orange-500 to-amber-600',
  'from-pink-500 to-rose-600',
  'from-cyan-500 to-sky-600',
  'from-indigo-500 to-blue-700',
  'from-rose-500 to-pink-700',
  'from-teal-500 to-emerald-700',
  'from-amber-500 to-orange-700',
  'from-sky-500 to-cyan-700',
  'from-fuchsia-500 to-pink-700',
];

export default function MegaCategoryNav({ categories }: { categories: HomepageCategory[] }) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleEnter = (id: string) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setActiveId(id);
  };

  const handleLeave = () => {
    timeoutRef.current = setTimeout(() => setActiveId(null), 150);
  };

  const activeCategory = categories.find((c) => c.id === activeId);
  const activeCatIndex = categories.findIndex((c) => c.id === activeId);

  const renderCatThumb = (cat: HomepageCategory, idx: number, size: 'sm' | 'md' = 'sm') => {
    const gradient = NAV_GRADIENTS[idx % NAV_GRADIENTS.length];
    const isIcon = isLucideIcon(cat.image);
    const LucideIcon = isIcon && cat.image
      ? ICON_MAP[cat.image]
      : null;

    const dim = size === 'sm' ? 'w-6 h-6' : 'w-10 h-10';
    const iconSize = size === 'sm' ? 'w-3.5 h-3.5' : 'w-5 h-5';
    const rounded = size === 'sm' ? 'rounded' : 'rounded-lg';

    if (cat.image && !isIcon) {
      return (
        <Image
          src={cat.image}
          alt={cat.name}
          width={size === 'sm' ? 24 : 40}
          height={size === 'sm' ? 24 : 40}
          className={`${dim} object-cover ${rounded} border border-gray-100`}
        />
      );
    }
    return (
      <span className={`${dim} bg-gradient-to-br ${gradient} ${rounded} flex items-center justify-center flex-shrink-0`}>
        {LucideIcon
          ? <LucideIcon className={`${iconSize} text-white`} />
          : <span className="text-white font-bold" style={{ fontSize: size === 'sm' ? 10 : 13 }}>{cat.name[0]}</span>
        }
      </span>
    );
  };

  return (
    <div
      className="hidden lg:block relative"
      onMouseLeave={handleLeave}
    >
      {/* Category List */}
      <div className="w-[260px] bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
        <div className="px-4 py-2.5 bg-gray-900 text-white font-semibold text-sm rounded-t-xl">
          All Categories
        </div>
        <ul className="py-1">
          {categories.slice(0, 12).map((cat, idx) => (
            <li
              key={cat.id}
              onMouseEnter={() => handleEnter(cat.id)}
              className={cn(
                'relative group',
                activeId === cat.id && 'bg-blue-50'
              )}
            >
              <Link
                href={`/category/${cat.slug}`}
                className="flex items-center justify-between px-4 py-2.5 text-sm text-gray-700 hover:text-blue-600 hover:bg-blue-50/60 transition-colors"
              >
                <span className="flex items-center gap-3">
                  {renderCatThumb(cat, idx, 'sm')}
                  <span className="font-medium">{cat.name}</span>
                </span>
                {cat.children.length > 0 && (
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-500" />
                )}
              </Link>
            </li>
          ))}
          {categories.length > 12 && (
            <li>
              <Link
                href="/categories"
                className="block text-center text-sm text-blue-600 font-medium py-2.5 hover:bg-blue-50 transition-colors border-t border-gray-50"
              >
                View All Categories
              </Link>
            </li>
          )}
        </ul>
      </div>

      {/* Mega Dropdown */}
      {activeCategory && activeCategory.children.length > 0 && (
        <div
          className="absolute left-[260px] top-0 w-[600px] min-h-full bg-white border border-gray-100 rounded-xl shadow-xl z-50 p-6"
          onMouseEnter={() => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
          }}
          onMouseLeave={handleLeave}
        >
          <h3 className="text-lg font-bold text-gray-900 mb-4">{activeCategory.name}</h3>
          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            {activeCategory.children.map((sub, subIdx) => (
              <div key={sub.id}>
                <Link
                  href={`/category/${sub.slug}`}
                  className="flex items-center gap-3 group mb-2"
                >
                  {renderCatThumb(sub, activeCatIndex + subIdx + 1, 'md')}
                  <div>
                    <span className="text-sm font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">
                      {sub.name}
                    </span>
                    {sub._count && (
                      <span className="block text-xs text-gray-400">
                        {sub._count.products} products
                      </span>
                    )}
                  </div>
                </Link>
                {sub.children?.length > 0 && (
                  <div className="ml-[52px] space-y-1">
                    {sub.children.slice(0, 4).map((gc) => (
                      <Link
                        key={gc.id}
                        href={`/category/${gc.slug}`}
                        className="block text-xs text-gray-500 hover:text-blue-600 transition-colors py-0.5"
                      >
                        {gc.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
          <Link
            href={`/category/${activeCategory.slug}`}
            className="block mt-6 text-sm text-blue-600 font-medium hover:text-blue-700"
          >
            Browse all {activeCategory.name} →
          </Link>
        </div>
      )}
    </div>
  );
}
