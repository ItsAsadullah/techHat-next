'use client';

import ProductCard from './ProductCard';
import ProductSection, { ProductGrid, ProductGridItem } from './ProductSection';
import type { HomepageProduct } from '@/lib/homepage-types';

export default function NewArrivals({ products }: { products: HomepageProduct[] }) {
  if (!products.length) return null;

  return (
    <ProductSection
      title="New Arrivals"
      subtitle="Just landed in store"
      viewAllLink="/products?sort=newest"
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
