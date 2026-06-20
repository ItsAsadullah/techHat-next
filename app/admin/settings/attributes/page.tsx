import { Metadata } from 'next';
import { getAttributes } from '@/lib/actions/attribute-actions';
import AttributeManager from '@/components/admin/settings/attribute-manager';

export const metadata: Metadata = {
  title: 'Attribute Manager - Admin | TechHat',
};

export default async function AttributesPage() {
  const attributes = await getAttributes();

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight">Global Attributes</h1>
        <p className="text-gray-500">
          Manage product attributes, variants, and swatches used across your catalog.
        </p>
      </div>

      <AttributeManager initialAttributes={attributes} />
    </div>
  );
}
