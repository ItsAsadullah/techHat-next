import { prisma } from '@/lib/prisma';
import ProductForm from './product-form';
import { getAttributes } from '@/lib/actions/attribute-actions';
import { getCachedCategories, getCachedBrands } from '@/lib/cache/cached-data';

export default async function NewProductPage() {
  // Use cached data for categories and brands
  const [categories, brands, attributesResult] = await Promise.all([
    getCachedCategories(),
    getCachedBrands(),
    getAttributes(),
  ]);

  // Filter root categories
  const rootCategories = categories.filter(c => c.parentId === null);

  return (
    <div className="p-8 min-h-screen bg-gray-50/50 dark:bg-gray-950">
      <div className="max-w-6xl mx-auto">
        <ProductForm 
          categories={rootCategories} 
          brands={brands} 
          attributesList={attributesResult.success && attributesResult.attributes ? attributesResult.attributes : []}
        />
      </div>
    </div>
  );
}
