'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProductSectionProps {
  title: string;
  subtitle?: string;
  viewAllLink?: string;
  children: React.ReactNode;
  className?: string;
  headerRight?: React.ReactNode;
}

export default function ProductSection({
  title,
  subtitle,
  viewAllLink,
  children,
  className,
  headerRight,
}: ProductSectionProps) {
  return (
    <section className={cn('py-8 sm:py-10 lg:py-12', className)}>
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-end justify-between mb-6 sm:mb-8">
          <div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">{title}</h2>
            {subtitle && (
              <p className="text-sm sm:text-base text-gray-500 mt-1">{subtitle}</p>
            )}
          </div>
          <div className="flex items-center gap-4">
            {headerRight}
            {viewAllLink && (
              <Link
                href={viewAllLink}
                className="hidden sm:flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors whitespace-nowrap"
              >
                View All
                <ChevronRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>

        {/* Content */}
        {children}

        {/* Mobile View All */}
        {viewAllLink && (
          <div className="sm:hidden mt-6 text-center">
            <Link
              href={viewAllLink}
              className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              View All <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

/** Horizontal scroll container for mobile, grid for desktop */
export function ProductGrid({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        // Mobile: horizontal scroll
        'flex gap-3 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide',
        // Desktop: grid
        'sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 sm:gap-4 sm:overflow-visible sm:pb-0',
        className
      )}
    >
      {children}
    </div>
  );
}

/** Wrapper for cards inside ProductGrid to respect horizontal scroll */
export function ProductGridItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex-shrink-0 w-[200px] sm:w-auto snap-start', className)}>
      {children}
    </div>
  );
}
