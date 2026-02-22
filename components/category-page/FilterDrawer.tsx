'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';
import FilterSidebar from './FilterSidebar';
import type { FilterOptions, FilterParams } from '@/lib/types/category-page';
import { cn } from '@/lib/utils';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterParams;
  filterOptions: FilterOptions;
}

export default function FilterDrawer({ isOpen, onClose, filters, filterOptions }: Props) {
  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 bg-black/50 z-40 transition-opacity lg:hidden',
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
        aria-hidden
      />

      {/* Drawer panel */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-[85vw] max-w-sm bg-background shadow-2xl transition-transform duration-300 lg:hidden flex flex-col',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        role="dialog"
        aria-modal
        aria-label="Filters"
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
          <h2 className="font-semibold text-base">Filter Products</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-accent transition-colors"
            aria-label="Close filters"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable filter content */}
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          <FilterSidebar
            filters={filters}
            filterOptions={filterOptions}
            isMobile
            onClose={onClose}
          />
        </div>
      </div>
    </>
  );
}
