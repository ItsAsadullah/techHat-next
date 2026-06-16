import { getAttributes } from '@/lib/actions/attribute-actions';
import { AttributesClient } from './attributes-client';

export default async function AttributesPage() {
  const result = await getAttributes();
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Attributes Management</h1>
        <p className="text-sm text-muted-foreground">
          Create and manage global product attributes like Size, Color, or Storage.
        </p>
      </div>

      <AttributesClient initialAttributes={result.success && result.attributes ? result.attributes : []} />
    </div>
  );
}
