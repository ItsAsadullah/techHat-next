'use client';

import ProductCard from './ProductCard';
import ProductSection, { ProductGrid, ProductGridItem } from './ProductSection';
import type { HomepageProduct } from '@/lib/homepage-types';

export default function TrendingProducts({ products }: { products: HomepageProduct[] }) {
  if (!products.length) return null;

  return (
    <ProductSection
      title="Trending Now"
      subtitle="Hot picks this week"
      viewAllLink="/products?sort=trending"
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
