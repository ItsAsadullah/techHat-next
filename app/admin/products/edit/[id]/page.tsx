import ProductForm from '../../new/product-form';
import { getAttributes } from '@/lib/actions/attribute-actions';
import { getProduct } from '@/lib/actions/product-actions';
import { getCachedCategories, getCachedBrands } from '@/lib/cache/cached-data';
import { notFound } from 'next/navigation';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: PageProps) {
  const { id } = await params;

  const [categories, brands, attributesResult, product] = await Promise.all([
    getCachedCategories(),
    getCachedBrands(),
    getAttributes(),
    getProduct(id)
  ]);

  if (!product) {
    notFound();
  }

  const rootCategories = categories.filter(c => c.parentId === null);

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-950">
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-4 md:py-6">
        <ProductForm
          categories={rootCategories}
          brands={brands}
          attributesList={attributesResult.success && attributesResult.attributes ? attributesResult.attributes : []}
          initialData={product}
        />
      </div>
    </div>
  );
}
