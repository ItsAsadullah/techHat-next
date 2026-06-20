import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import CategoryAttributeManager from '@/components/admin/settings/category-attribute-manager';
import { getCategoryAttributes } from '@/lib/actions/category-attribute-actions';

export const metadata: Metadata = {
  title: 'Category Attributes - Admin | TechHat',
};

export default async function CategoryAttributesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: categoryId } = await params;

  const category = await prisma.category.findUnique({
    where: { id: categoryId },
  });

  if (!category) {
    notFound();
  }

  const categoryAttributes = await getCategoryAttributes(categoryId);
  const allAttributes = await prisma.attribute.findMany({
    orderBy: { name: 'asc' },
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight">
          Attribute Template: <span className="text-indigo-600">{category.name}</span>
        </h1>
        <p className="text-gray-500">
          Define the default attributes and options that will be auto-suggested when creating a product in this category.
        </p>
      </div>

      <CategoryAttributeManager 
        category={category} 
        initialCategoryAttributes={categoryAttributes} 
        allAttributes={allAttributes} 
      />
    </div>
  );
}
