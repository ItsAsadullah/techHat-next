import ProductForm from './product-form';
import { getAttributes } from '@/lib/actions/attribute-actions';
import { getCachedCategories, getCachedBrands } from '@/lib/cache/cached-data';

export default async function NewProductPage() {
  const [categories, brands, attributesResult] = await Promise.all([
    getCachedCategories(),
    getCachedBrands(),
    getAttributes(),
  ]);

  const rootCategories = categories.filter(c => c.parentId === null);

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-950">
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-4 md:py-6">
        <ProductForm
          categories={rootCategories}
          brands={brands}
          attributesList={attributesResult.success && attributesResult.attributes ? attributesResult.attributes : []}
        />
      </div>
    </div>
  );
}
