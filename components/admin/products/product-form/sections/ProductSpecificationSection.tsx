'use client';

import { useSpecifications } from '../hooks/useSpecifications';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Plus, Trash2 } from 'lucide-react';

interface Props {
  specsHook: ReturnType<typeof useSpecifications>;
}

export function ProductSpecificationSection({ specsHook }: Props) {
  const { specs, addSpec, removeSpec, updateSpec } = specsHook;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Label className="text-base font-medium">Technical Specifications</Label>
        <Button type="button" variant="outline" size="sm" onClick={addSpec}>
          <Plus className="h-4 w-4 mr-2" /> Add Spec
        </Button>
      </div>

      <div className="space-y-3">
        {specs.map((spec) => (
          <div key={spec.id} className="flex items-center gap-3">
            <Input 
              placeholder="e.g. Battery" 
              value={spec.key} 
              onChange={(e) => updateSpec(spec.id, 'key', e.target.value)} 
            />
            <Input 
              placeholder="e.g. 5000 mAh" 
              value={spec.value} 
              onChange={(e) => updateSpec(spec.id, 'value', e.target.value)} 
            />
            <Button 
              type="button" 
              variant="ghost" 
              size="icon" 
              className="text-red-500 shrink-0"
              onClick={() => removeSpec(spec.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        {specs.length === 0 && (
          <p className="text-sm text-muted-foreground italic text-center py-4 border rounded-md border-dashed">
            No specifications added.
          </p>
        )}
      </div>
    </div>
  );
}
