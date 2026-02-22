'use client';

import ProductCard from './ProductCard';
import ProductSection, { ProductGrid, ProductGridItem } from './ProductSection';
import type { HomepageProduct } from '@/lib/homepage-types';

interface DealsUnderSectionProps {
  products: HomepageProduct[];
  amount: number;
}

export default function DealsUnderSection({ products, amount }: DealsUnderSectionProps) {
  if (!products.length) return null;

  return (
    <ProductSection
      title={`Deals Under ৳${amount.toLocaleString()}`}
      subtitle="Budget-friendly picks for you"
      viewAllLink={`/products?maxPrice=${amount}`}
    >
      <ProductGrid>
        {products.map((product) => (
          <ProductGridItem key={product.id}>
            <ProductCard product={product} />
          </ProductGridItem>
        ))}
      </ProductGrid>
    </ProductSection>
  );
}
