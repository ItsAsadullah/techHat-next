'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { HomepageCategory } from '@/lib/homepage-types';

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
          {categories.slice(0, 12).map((cat) => (
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
                  {cat.image ? (
                    <Image
                      src={cat.image}
                      alt={cat.name}
                      width={24}
                      height={24}
                      className="w-6 h-6 object-cover rounded"
                    />
                  ) : (
                    <span className="w-6 h-6 bg-gray-100 rounded flex items-center justify-center text-xs font-bold text-gray-400">
                      {cat.name[0]}
                    </span>
                  )}
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
            {activeCategory.children.map((sub) => (
              <div key={sub.id}>
                <Link
                  href={`/category/${sub.slug}`}
                  className="flex items-center gap-3 group mb-2"
                >
                  {sub.image ? (
                    <Image
                      src={sub.image}
                      alt={sub.name}
                      width={40}
                      height={40}
                      className="w-10 h-10 rounded-lg object-cover border border-gray-100 group-hover:border-blue-200 transition-colors"
                    />
                  ) : (
                    <span className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center text-sm font-bold text-blue-600">
                      {sub.name[0]}
                    </span>
                  )}
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
