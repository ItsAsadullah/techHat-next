'use client';

import { useFormContext, useFieldArray } from 'react-hook-form';
import { ProductFormValues } from '../schemas/product.schema';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Plus, Trash2 } from 'lucide-react';

export function ProductSpecificationSection() {
  const { control, register } = useFormContext<ProductFormValues>();
  
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'productSpecs'
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Label className="text-base font-medium">Technical Specifications</Label>
        <Button 
          type="button" 
          variant="outline" 
          size="sm" 
          onClick={() => append({ id: crypto.randomUUID(), key: '', value: '' })}
        >
          <Plus className="h-4 w-4 mr-2" /> Add Spec
        </Button>
      </div>

      <div className="space-y-3">
        {fields.map((field, index) => (
          <div key={field.id} className="flex items-center gap-3">
            <Input 
              placeholder="e.g. Battery" 
              {...register(`productSpecs.${index}.key`)} 
            />
            <Input 
              placeholder="e.g. 5000 mAh" 
              {...register(`productSpecs.${index}.value`)} 
            />
            <Button 
              type="button" 
              variant="ghost" 
              size="icon" 
              className="text-red-500 shrink-0"
              onClick={() => remove(index)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        {fields.length === 0 && (
          <p className="text-sm text-muted-foreground italic text-center py-4 border rounded-md border-dashed">
            No specifications added.
          </p>
        )}
      </div>
    </div>
  );
}
