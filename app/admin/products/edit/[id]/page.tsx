import { prisma } from '@/lib/prisma';
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
  
  // Use cached categories and brands + parallel fetch
  const [categories, brands, attributesResult, product] = await Promise.all([
    getCachedCategories(),
    getCachedBrands(),
    getAttributes(),
    getProduct(id)
  ]);

  if (!product) {
    notFound();
  }

  // Filter root categories for the form
  const rootCategories = categories.filter(c => c.parentId === null);

  return (
    <div className="p-8 min-h-screen bg-gray-50/50 dark:bg-gray-950">
      <div className="max-w-6xl mx-auto">
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
