'use client';

import { useState } from 'react';
import { Package } from 'lucide-react';
import type { CategoryProduct } from '@/lib/types/category-page';
import CategoryProductCard from './CategoryProductCard';
import QuickViewModal from './QuickViewModal';

interface Props {
  products: CategoryProduct[];
}

export default function ProductGrid({ products }: Props) {
  const [quickViewProduct, setQuickViewProduct] = useState<CategoryProduct | null>(null);

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
        <div className="bg-muted/50 rounded-full p-6">
          <Package className="h-12 w-12 text-muted-foreground/50" />
        </div>
        <div>
          <h3 className="font-semibold text-lg mb-1">No products found</h3>
          <p className="text-sm text-muted-foreground max-w-xs">
            Try adjusting your filters or clearing them to see more results.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
        {products.map((product) => (
          <CategoryProductCard
            key={product.id}
            product={product}
            onQuickView={setQuickViewProduct}
          />
        ))}
      </div>

      <QuickViewModal
        product={quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
      />
    </>
  );
}
