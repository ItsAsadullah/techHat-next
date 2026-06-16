'use client';

import { useFormContext, useFieldArray, Controller } from 'react-hook-form';
import { ProductFormValues } from '../schemas/product.schema';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, RefreshCw, Layers, Package, ShieldAlert, X } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { memo, useCallback, useState } from 'react';

interface Props {
  attributesList: any[]; // Kept for backwards compatibility but not strictly needed anymore
}

function TagInput({ values, onChange }: { values: string[], onChange: (newValues: string[]) => void }) {
  const [input, setInput] = useState('');

  const addTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = input.trim();
      if (val && !values.includes(val)) {
        onChange([...values, val]);
      }
      setInput('');
    }
  };

  const removeTag = (index: number) => {
    onChange(values.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {values.map((v, i) => (
          <Badge key={i} variant="secondary" className="flex items-center gap-1 px-2 py-0.5 font-normal">
            {v}
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground focus:outline-none ml-1"
              onClick={() => removeTag(i)}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
      <Input
        placeholder="Type a value and press Enter or Comma..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={addTag}
        className="h-8 text-xs bg-white dark:bg-gray-900"
      />
    </div>
  );
}

// Memoized variant row — prevents full table re-render when editing one cell
const VariantRow = memo(({
  index,
  variant,
  register,
  remove,
}: {
  index: number;
  variant: any;
  register: any;
  remove: (index: number) => void;
}) => (
  <tr className="hover:bg-muted/20 group">
    <td className="px-3 py-2">
      <span className="font-medium text-xs">{variant.name}</span>
      <input type="hidden" {...register(`variants.${index}.name`)} />
      <input type="hidden" {...register(`variants.${index}.id`)} />
    </td>
    <td className="px-3 py-2">
      <Input
        className="h-7 text-xs font-mono w-[130px]"
        placeholder="SKU"
        {...register(`variants.${index}.sku`)}
      />
    </td>
    <td className="px-3 py-2">
      <div className="relative">
        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">৳</span>
        <Input
          className="h-7 text-xs w-[90px] pl-5"
          type="number"
          step="0.01"
          {...register(`variants.${index}.price`, { valueAsNumber: true })}
        />
      </div>
    </td>
    <td className="px-3 py-2">
      {/* Read-only from Inventory Module */}
      <div className="flex flex-col gap-0.5">
        <span className="text-[10px] font-medium text-gray-400">Ledger Driven</span>
      </div>
      <input type="hidden" {...register(`variants.${index}.stock`, { valueAsNumber: true })} />
    </td>
    <td className="px-3 py-2 text-center">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-6 w-6 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={() => remove(index)}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </td>
  </tr>
));
VariantRow.displayName = 'VariantRow';

export function ProductVariantSection({ attributesList }: Props) {
  const { control, watch, register, setValue, getValues } = useFormContext<ProductFormValues>();

  const productVariantType = watch('productVariantType');
  const basePrice          = watch('price') || 0;
  const baseSku            = watch('sku') || '';

  const { fields: attributes, append: appendAttr, remove: removeAttr, update: updateAttr } = useFieldArray({
    control,
    name: 'attributes',
  });

  const { fields: variations, append: appendVar, remove: removeVar, replace: replaceVars } = useFieldArray({
    control,
    name: 'variants',
  });

  if (productVariantType === 'simple') return null;



  /**
   * Smart Merge Variant Generation.
   *
   * ERP Rule: Never overwrite existing variant data on regeneration.
   * - Build a lookup of existing variants by name.
   * - For each new combination, if variant with same name already exists,
   *   KEEP its SKU, price, image, upc.
   * - Only blank-fill truly new combinations.
   */
  const generateVariations = useCallback(() => {
    const currentAttributes = getValues('attributes') || [];
    if (currentAttributes.length === 0) return;

    const cartesian = (args: string[][]): string[][] =>
      args.reduce<string[][]>((a, b) => a.flatMap(d => b.map(e => [...(Array.isArray(d) ? d : [d]), e])), [[]]);

    const activeAttributes = currentAttributes.filter(a => a.values && a.values.length > 0);
    const attrValues = activeAttributes.map(a => a.values);
    if (attrValues.length === 0) return;

    const combinations = cartesian(attrValues);

    // Build lookup of existing variants by name for smart merge
    const existingByName = new Map<string, typeof variations[number]>();
    for (const v of variations) {
      existingByName.set(v.name, v);
    }

    const newVariations = combinations.map(combo => {
      const values = Array.isArray(combo) ? combo : [combo];
      const variantName = values.join(' / ');

      const attrMap: Record<string, string> = {};
      activeAttributes.forEach((attr, idx) => {
        attrMap[attr.name] = values[idx];
      });

      // Smart merge: preserve existing data
      const existing = existingByName.get(variantName);
      if (existing) {
        return existing; // preserve all existing fields exactly
      }

      // New combination — create blank row with base defaults
      const skuSuffix = values.map(v => v.replace(/[^a-zA-Z0-9]/g, '').substring(0, 3).toUpperCase()).join('-');
      const generatedSku = baseSku ? `${baseSku}-${skuSuffix}` : skuSuffix;

      return {
        id:         Math.random().toString(36).substring(2, 11),
        name:       variantName,
        sku:        generatedSku,
        upc:        '',
        price:      basePrice,
        offerPrice: undefined,
        stock:      0,
        hasSerial:  false,
        serials:    [],
        attributes: attrMap,
      };
    });

    replaceVars(newVariations as any);
  }, [attributes, variations, baseSku, basePrice, replaceVars]);

  const mergedCount  = variations.filter(v => attributes.some(a => a.values?.length > 0) && v.sku).length;
  const newCount     = 0; // computed after generation

  return (
    <div className="space-y-5">
      {/* Attributes Builder */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <Label className="text-sm font-medium">Attributes</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            onClick={() => appendAttr({ id: Math.random().toString(36).substring(2, 11), name: '', values: [] })}
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Attribute
          </Button>
        </div>

        {attributes.length === 0 && (
          <div className="py-8 text-center border-2 border-dashed rounded-lg bg-muted/20">
            <Layers className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No attributes added yet.</p>
            <p className="text-xs text-muted-foreground mt-1">Add attributes like Color, Size, or Storage to create variants.</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3 h-8 text-xs"
              onClick={() => appendAttr({ id: Math.random().toString(36).substring(2, 11), name: '', values: [] })}
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" /> Add First Attribute
            </Button>
          </div>
        )}

        <div className="space-y-3">
          {attributes.map((attr, index) => (
            <div key={attr.id} className="p-4 border rounded-xl space-y-3 bg-muted/10">
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Attribute name (e.g., Color, Size)"
                  {...register(`attributes.${index}.name`)}
                  className="h-9 flex-1 font-medium bg-white dark:bg-gray-900"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-red-500 shrink-0 hover:bg-red-50 dark:hover:bg-red-950/30"
                  onClick={() => removeAttr(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="pl-1">
                <Label className="text-xs text-muted-foreground mb-1.5 block">Attribute Values</Label>
                <Controller
                  control={control}
                  name={`attributes.${index}.values`}
                  render={({ field }) => (
                    <TagInput 
                      values={field.value || []} 
                      onChange={field.onChange} 
                    />
                  )}
                />
              </div>
            </div>
          ))}
        </div>

        {attributes.length > 0 && (
          <div className="space-y-2">
            <Button
              type="button"
              variant="secondary"
              className="w-full h-9 text-sm"
              onClick={generateVariations}
              disabled={!attributes.some(a => a.values && a.values.length > 0)}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              {variations.length > 0 ? 'Re-generate Variants (Smart Merge)' : 'Generate Variants'}
            </Button>
            {variations.length > 0 && (
              <div className="flex items-start gap-1.5 text-[11px] text-amber-700 dark:text-amber-400">
                <ShieldAlert className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <span>Smart merge is active — existing prices, SKUs, and images are preserved. Only new combinations are added.</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Generated Variants Table */}
      {variations.length > 0 && (
        <div className="space-y-3 pt-3 border-t">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">
              Variants
              <span className="ml-2 text-xs font-normal text-muted-foreground">({variations.length})</span>
            </Label>
          </div>

          <div className="border rounded-lg overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/30 border-b text-left">
                  <th className="px-3 py-2 font-medium text-xs text-muted-foreground">Variant</th>
                  <th className="px-3 py-2 font-medium text-xs text-muted-foreground">SKU</th>
                  <th className="px-3 py-2 font-medium text-xs text-muted-foreground">Price</th>
                  <th className="px-3 py-2 font-medium text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      Stock
                      <span className="text-[9px] uppercase tracking-wider bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-1 rounded">Inventory</span>
                    </span>
                  </th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {variations.map((variant, index) => (
                  <VariantRow
                    key={variant.id}
                    index={index}
                    variant={variant}
                    register={register}
                    remove={removeVar}
                  />
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Package className="h-3.5 w-3.5 shrink-0" />
            Stock levels are managed by the Inventory Module. Prices and SKUs are editable here.
          </p>
        </div>
      )}
    </div>
  );
}
