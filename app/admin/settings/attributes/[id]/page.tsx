import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import AttributeValueManager from '@/components/admin/settings/attribute-value-manager';
import { notFound } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Manage Attribute Values - Admin | TechHat',
};

export default async function AttributeValuesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: attributeId } = await params;

  const attribute = await prisma.attribute.findUnique({
    where: { id: attributeId },
    include: {
      values: {
        orderBy: { displayOrder: 'asc' },
      },
    },
  });

  if (!attribute) {
    notFound();
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight">
          Manage Values: <span className="text-indigo-600">{attribute.name}</span>
        </h1>
        <p className="text-gray-500">
          Configure the predefined options for this attribute.
        </p>
      </div>

      <AttributeValueManager attribute={attribute} initialValues={attribute.values} />
    </div>
  );
}
