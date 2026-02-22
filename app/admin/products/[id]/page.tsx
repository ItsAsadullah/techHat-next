import { prisma } from '@/lib/prisma';
import ProductForm from '../new/product-form';
import { getAttributes } from '@/lib/actions/attribute-actions';
import { getProduct } from '@/lib/actions/product-actions';
import { notFound } from 'next/navigation';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: PageProps) {
  const { id } = await params;
  
  const [categories, brands, attributesResult, product] = await Promise.all([
    prisma.category.findMany({ 
      where: { parentId: null },
      orderBy: { name: 'asc' } 
    }),
    prisma.brand.findMany({ orderBy: { name: 'asc' } }),
    getAttributes(),
    getProduct(id)
  ]);

  if (!product) {
    notFound();
  }

  return (
    <div className="p-8 min-h-screen bg-gray-50/50">
      <div className="max-w-6xl mx-auto">
        <ProductForm 
          categories={categories} 
          brands={brands} 
          attributesList={attributesResult.success && attributesResult.attributes ? attributesResult.attributes : []}
          initialData={product}
        />
      </div>
    </div>
  );
}
