'use client';

import { useState, useEffect } from 'react';
import ProductCard from './ProductCard';
import ProductSection, { ProductGrid, ProductGridItem } from './ProductSection';
import type { HomepageProduct } from '@/lib/homepage-types';

export default function RecommendedSection() {
  const [products, setProducts] = useState<HomepageProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        // Get browsing history categories from recent views
        const stored = localStorage.getItem('recently_viewed');
        const ids: string[] = stored ? JSON.parse(stored) : [];
        // Fetch recommendations based on browsing behavior
        const res = await fetch(`/api/products/recommended?viewed=${ids.slice(0, 5).join(',')}`);
        if (res.ok) {
          const data = await res.json();
          setProducts(data.products || []);
        }
      } catch {
        // ignore
      }
      setLoading(false);
    }
    load();
  }, []);

  if (loading || !products.length) return null;

  return (
    <ProductSection
      title="Recommended For You"
      subtitle="Based on your browsing history"
      viewAllLink="/products"
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
