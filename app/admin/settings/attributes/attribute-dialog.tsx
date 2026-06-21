'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { createAttribute, updateAttribute } from '@/lib/actions/attribute-actions';

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.string().min(1, 'Type is required'),
  values: z.array(z.object({
    id: z.number().optional(),
    value: z.string().min(1, 'Value is required'),
    colorCode: z.string().optional(),
  })).min(1, 'At least one value is required'),
});

type FormValues = z.infer<typeof formSchema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  attribute?: any | null; // Pass null for create, object for edit
}

export function AttributeDialog({ open, onOpenChange, attribute }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      type: 'select',
      values: [{ value: '', colorCode: '' }],
    },
  });

  const { control, handleSubmit, register, reset, watch, setValue } = form;
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'values',
  });

  const selectedType = watch('type');

  useEffect(() => {
    if (open) {
      if (attribute) {
        reset({
          name: attribute.name,
          type: attribute.type || 'select',
          values: attribute.values && attribute.values.length > 0 
            ? attribute.values.map((v: any) => ({
                id: v.id,
                value: v.value,
                colorCode: v.colorCode || '',
              }))
            : [{ value: '', colorCode: '' }],
        });
      } else {
        reset({
          name: '',
          type: 'select',
          values: [{ value: '', colorCode: '' }],
        });
      }
    }
  }, [open, attribute, reset]);

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      let res;
      let attributeId = attribute?.id;

      // 1. Map type to uiType
      const uiTypeMap: Record<string, 'DROPDOWN' | 'RADIO' | 'COLOR_SWATCH'> = {
        select: 'DROPDOWN',
        radio: 'RADIO',
        color: 'COLOR_SWATCH',
      };
      const uiType = uiTypeMap[data.type] || 'DROPDOWN';

      // 2. Generate slug
      const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

      // 3. Create or update parent attribute
      const attrData = {
        name: data.name,
        slug,
        dataType: 'STRING' as const,
        uiType,
        isVariant: true,
      };

      if (attribute) {
        res = await updateAttribute(attributeId, attrData);
      } else {
        res = await createAttribute(attrData);
        if (res.success && res.attribute) {
          attributeId = res.attribute.id;
        }
      }

      if (res.success && attributeId) {
        // 4. Handle values (this is a simplified approach, ideally we should sync properly)
        // For simplicity, we'll use a server action if it existed, but since we don't have a bulk 
        // sync action in attribute-actions.ts, we will just call createAttributeValue for each.
        // Wait, if it's an update, we'd need to delete old ones or update them. 
        // Let's import createAttributeValue, updateAttributeValue from attribute-actions
        const { createAttributeValue, updateAttributeValue } = await import('@/lib/actions/attribute-actions');
        
        for (let i = 0; i < data.values.length; i++) {
          const val = data.values[i];
          if (val.id) {
            await updateAttributeValue(String(val.id), {
              label: val.value,
              value: val.value,
              colorCode: val.colorCode || undefined,
              displayOrder: i,
            });
          } else {
            await createAttributeValue({
              attributeId,
              label: val.value,
              value: val.value,
              colorCode: val.colorCode || undefined,
              displayOrder: i,
            });
          }
        }
        
        toast.success(`Attribute ${attribute ? 'updated' : 'created'} successfully`);
        onOpenChange(false);
      } else {
        toast.error(res?.error || 'Failed to save attribute');
      }
    } catch (error: any) {
      toast.error('An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{attribute ? 'Edit Attribute' : 'Add New Attribute'}</DialogTitle>
          <DialogDescription>
            Create an attribute like Color or Size and define its values.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 overflow-y-auto pr-2 pb-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Attribute Name</Label>
              <Input id="name" placeholder="e.g. Size" {...register('name')} />
              {form.formState.errors.name && (
                <p className="text-xs text-red-500">{form.formState.errors.name.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label>Input Type</Label>
              <Select 
                value={selectedType} 
                onValueChange={(val) => setValue('type', val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="select">Dropdown (Select)</SelectItem>
                  <SelectItem value="radio">Radio Buttons</SelectItem>
                  <SelectItem value="color">Color Swatches</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Attribute Values</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() => append({ value: '', colorCode: '' })}
              >
                <Plus className="h-3 w-3 mr-1" /> Add Value
              </Button>
            </div>
            
            {form.formState.errors.values?.root && (
              <p className="text-xs text-red-500">{form.formState.errors.values.root.message}</p>
            )}

            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
              {fields.map((field, index) => (
                <div key={field.id} className="flex items-start gap-2">
                  <div className="flex-1 space-y-1">
                    <Input 
                      placeholder="e.g. XL or Red" 
                      className="h-9"
                      {...register(`values.${index}.value`)} 
                    />
                    {form.formState.errors.values?.[index]?.value && (
                      <p className="text-xs text-red-500">{form.formState.errors.values[index]?.value?.message}</p>
                    )}
                  </div>
                  
                  {selectedType === 'color' && (
                    <div className="w-24 shrink-0">
                      <Input 
                        placeholder="#Hex" 
                        className="h-9 font-mono text-xs"
                        {...register(`values.${index}.colorCode`)} 
                      />
                    </div>
                  )}
                  
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-muted-foreground hover:text-red-500 shrink-0"
                    onClick={() => remove(index)}
                    disabled={fields.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Attribute'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
