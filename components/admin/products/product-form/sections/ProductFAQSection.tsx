'use client';

import { useFormContext, useFieldArray } from 'react-hook-form';
import { ProductFormValues } from '../schemas/product.schema';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';

export function ProductFAQSection() {
  const { register, control } = useFormContext<ProductFormValues>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'faqs',
  });

  return (
    <div className="space-y-4">
      {fields.map((field, index) => (
        <div key={field.id} className="relative p-4 border rounded-md bg-muted/20 space-y-3">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => remove(index)}
            className="absolute top-2 right-2 h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
          </Button>

          <div className="space-y-1.5 pr-8">
            <Label className="text-xs font-medium">Question {index + 1}</Label>
            <Input
              placeholder="e.g., Is there a warranty for this product?"
              className="h-9 text-sm"
              {...register(`faqs.${index}.question` as const)}
            />
          </div>

          <div className="space-y-1.5 pr-8">
            <Label className="text-xs font-medium">Answer {index + 1}</Label>
            <Textarea
              placeholder="Provide a clear, helpful answer..."
              className="resize-none h-20 text-sm"
              {...register(`faqs.${index}.answer` as const)}
            />
          </div>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => append({ question: '', answer: '' })}
        className="w-full border-dashed"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add FAQ
      </Button>
    </div>
  );
}
