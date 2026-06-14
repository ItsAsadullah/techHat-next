'use client';

import { useFormContext } from 'react-hook-form';
import { ProductFormValues } from '../schemas/product.schema';
import { useVariants } from '../hooks/useVariants';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, RefreshCw } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Props {
  variantsHook: ReturnType<typeof useVariants>;
  attributesList: any[];
}

export function ProductVariantSection({ variantsHook, attributesList }: Props) {
  const { watch } = useFormContext<ProductFormValues>();
  const productVariantType = watch('productVariantType');
  const basePrice = watch('price') || 0;
  const baseCost = watch('costPrice') || 0;
  const baseSku = watch('sku') || '';

  const {
    attributes,
    variations,
    addAttribute,
    removeAttribute,
    updateAttribute,
    handleValueSelect,
    generateVariations,
    updateVariation,
    removeVariation
  } = variantsHook;

  if (productVariantType === 'simple') {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Label className="text-base font-medium">Product Attributes</Label>
          <Button type="button" variant="outline" size="sm" onClick={addAttribute}>
            <Plus className="h-4 w-4 mr-2" /> Add Attribute
          </Button>
        </div>

        <div className="space-y-4">
          {attributes.map((attr, index) => (
            <div key={attr.id} className="p-4 border rounded-lg space-y-3 bg-muted/20">
              <div className="flex items-center gap-3">
                <Select 
                  value={attr.attributeId?.toString() || ''}
                  onValueChange={(val) => {
                    const selected = attributesList.find(a => a.id.toString() === val);
                    if (selected) {
                      updateAttribute(index, { attributeId: selected.id, name: selected.name, values: [] });
                    }
                  }}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select Attribute" />
                  </SelectTrigger>
                  <SelectContent>
                    {attributesList.map(a => (
                      <SelectItem key={a.id} value={a.id.toString()}>{a.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Button type="button" variant="ghost" size="icon" className="text-red-500" onClick={() => removeAttribute(index)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              {attr.attributeId && (
                <div className="flex flex-wrap gap-2">
                  {attributesList.find(a => a.id === attr.attributeId)?.values?.map((v: any) => {
                    const isSelected = attr.values.includes(v.value);
                    return (
                      <div 
                        key={v.id || v.value} 
                        onClick={() => handleValueSelect(index, v.value)}
                        className={`px-3 py-1 text-sm rounded-full border cursor-pointer transition-colors ${
                          isSelected ? 'bg-primary text-primary-foreground border-primary' : 'bg-background hover:bg-muted'
                        }`}
                      >
                        {v.value}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>

        <Button 
          type="button" 
          variant="secondary" 
          className="w-full" 
          onClick={() => generateVariations(baseSku, basePrice, baseCost)}
          disabled={attributes.length === 0 || !attributes.some(a => a.values.length > 0)}
        >
          <RefreshCw className="h-4 w-4 mr-2" /> Generate Variations
        </Button>
      </div>

      {variations.length > 0 && (
        <div className="space-y-4 pt-4 border-t">
          <Label className="text-base font-medium">Generated Variations ({variations.length})</Label>
          <div className="space-y-3">
            {variations.map((variant) => (
              <div key={variant.id} className="p-3 border rounded-lg bg-card space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-sm">{variant.name}</span>
                  <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-red-500" onClick={() => removeVariation(variant.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">SKU</Label>
                    <Input className="h-8 text-sm" value={variant.sku} onChange={(e) => updateVariation(variant.id, 'sku', e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Price</Label>
                    <Input className="h-8 text-sm" type="number" value={variant.price} onChange={(e) => updateVariation(variant.id, 'price', Number(e.target.value))} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
