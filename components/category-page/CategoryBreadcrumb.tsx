'use client';

import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import type { CategoryBreadcrumb } from '@/lib/types/category-page';

interface Props {
  breadcrumbs: CategoryBreadcrumb[];
}

export default function CategoryBreadcrumb({ breadcrumbs }: Props) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center flex-wrap gap-1 text-sm text-muted-foreground">
      <Link
        href="/"
        className="flex items-center gap-1 hover:text-foreground transition-colors"
      >
        <Home className="h-3.5 w-3.5" />
        <span className="sr-only">Home</span>
      </Link>

      {breadcrumbs.map((crumb, index) => {
        const isLast = index === breadcrumbs.length - 1;
        return (
          <span key={crumb.id} className="flex items-center gap-1">
            <ChevronRight className="h-3.5 w-3.5 flex-shrink-0" />
            {isLast ? (
              <span className="font-medium text-foreground truncate max-w-[200px]">
                {crumb.name}
              </span>
            ) : (
              <Link
                href={`/category/${crumb.slug}`}
                className="hover:text-foreground transition-colors truncate max-w-[150px]"
              >
                {crumb.name}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
