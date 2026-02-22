'use client';

import ProductCard from './ProductCard';
import ProductSection, { ProductGrid, ProductGridItem } from './ProductSection';
import type { HomepageProduct } from '@/lib/homepage-types';

export default function BestSellers({ products }: { products: HomepageProduct[] }) {
  if (!products.length) return null;

  return (
    <ProductSection
      title="Best Sellers"
      subtitle="Most popular products this month"
      viewAllLink="/products?sort=best-selling"
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
