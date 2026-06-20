import ProductForm from './product-form';
import { getAttributes } from '@/lib/actions/attribute-actions';
import { getAllCategoryAttributes } from '@/lib/actions/category-attribute-actions';
import { getCachedCategories, getCachedBrands } from '@/lib/cache/cached-data';

export default async function NewProductPage() {
  const [categories, brands, attributesResult, categoryAttributes] = await Promise.all([
    getCachedCategories(),
    getCachedBrands(),
    getAttributes(),
    getAllCategoryAttributes(),
  ]);

  const rootCategories = categories.filter(c => c.parentId === null);

  return (
    <div className="w-full">
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-4 md:py-6">
        <ProductForm
          categories={rootCategories}
          brands={brands}
          attributesList={Array.isArray(attributesResult) ? attributesResult : []}
          categoryAttributes={categoryAttributes}
        />
      </div>
    </div>
  );
}
