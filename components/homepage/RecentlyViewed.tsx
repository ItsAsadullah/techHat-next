'use client';

import { useState, useEffect } from 'react';
import ProductCard from './ProductCard';
import ProductSection, { ProductGrid, ProductGridItem } from './ProductSection';
import type { HomepageProduct } from '@/lib/homepage-types';

export default function RecentlyViewed() {
  const [products, setProducts] = useState<HomepageProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const stored = localStorage.getItem('recently_viewed');
        if (!stored) {
          setLoading(false);
          return;
        }
        const ids: string[] = JSON.parse(stored);
        if (!ids.length) {
          setLoading(false);
          return;
        }
        // Fetch from API
        const res = await fetch(`/api/products/by-ids?ids=${ids.slice(0, 10).join(',')}`);
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
      title="Recently Viewed"
      subtitle="Continue where you left off"
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
