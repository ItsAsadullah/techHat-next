'use client';

import React, { useState, useEffect } from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { ProductFormValues } from '../schemas/product.schema';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import CategoryHierarchy from '@/components/admin/category-hierarchy-v2';
import { BrandCombobox } from '@/components/admin/brand-combobox';
import { Textarea } from '@/components/ui/textarea';

interface ProductBasicSectionProps {
  categories: any[];
  brands: any[];
}

export function ProductBasicSection({ categories, brands }: ProductBasicSectionProps) {
  const { register, control, setValue, watch, formState: { errors } } = useFormContext<ProductFormValues>();
  const categoryId = watch('categoryId');
  const brandId = watch('brandId');
  const unit = watch('unit');
  const nameLength = (watch('name') || '').length;

  const [hasWarranty, setHasWarranty] = useState(false);
  const [customWarrantyType, setCustomWarrantyType] = useState(false);

  useEffect(() => {
    const wType = watch('warrantyType');
    const wMonths = watch('warrantyMonths');
    if (wType || (wMonths && wMonths > 0)) {
      setHasWarranty(true);
      if (wType && !['Official Warranty', 'Service Warranty', 'Replacement Warranty', 'International Warranty', 'Parts Warranty'].includes(wType)) {
        setCustomWarrantyType(true);
      }
    }
  }, []);

  return (
    <div className="space-y-4">

      {/* ── Product Name (ERP short name) ── */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="name" className="text-sm font-medium">
            Product Name <span className="text-red-500">*</span>
          </Label>
          <span className={`text-[11px] tabular-nums ${nameLength > 80 ? 'text-amber-500' : 'text-muted-foreground'}`}>
            {nameLength} chars
          </span>
        </div>
        <Controller
          control={control}
          name="name"
          render={({ field }) => (
            <Input
              id="name"
              placeholder="e.g. Hoco EQ33 Wireless Earbuds"
              className={`h-10 ${errors.name ? 'border-red-500' : ''}`}
              {...field}
            />
          )}
        />
        {errors.name && <p className="text-red-500 text-xs">{errors.name.message}</p>}
        <p className="text-[11px] text-muted-foreground">
          Keep it short and searchable. Use Short Description for full marketing copy.
        </p>
      </div>

      {/* ── Brand + Model ── */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Brand</Label>
          <BrandCombobox
            brands={brands}
            value={brandId || ''}
            onValueChange={(id) => setValue('brandId', id, { shouldValidate: true })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="model" className="text-sm font-medium">
            Model
            <span className="ml-1.5 text-[10px] uppercase tracking-wider text-amber-600 dark:text-amber-400 font-bold">
              Recommended
            </span>
          </Label>
          <Input
            id="model"
            placeholder="e.g. EQ33, M90, X15"
            className="h-10"
            {...register('model')}
          />
          <p className="text-[11px] text-muted-foreground">Used for SKU generation (Brand + Model)</p>
        </div>
      </div>

      {/* ── Category ── */}
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">
          Category <span className="text-red-500">*</span>
        </Label>
        <CategoryHierarchy
          initialCategories={categories.filter(c => c.parentId === null)}
          allCategories={categories}
          selectedCategoryId={categoryId}
          onCategorySelect={(id) => setValue('categoryId', id, { shouldValidate: true })}
        />
        {errors.categoryId && <p className="text-red-500 text-xs">{errors.categoryId.message}</p>}
      </div>

      {/* ── Unit ── */}
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Unit</Label>
        <Select value={unit} onValueChange={(v) => setValue('unit', v)}>
          <SelectTrigger className="h-10">
            <SelectValue placeholder="Select unit" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pc">Piece (pc)</SelectItem>
            <SelectItem value="kg">Kilogram (kg)</SelectItem>
            <SelectItem value="g">Gram (g)</SelectItem>
            <SelectItem value="lb">Pound (lb)</SelectItem>
            <SelectItem value="m">Meter (m)</SelectItem>
            <SelectItem value="cm">Centimeter (cm)</SelectItem>
            <SelectItem value="l">Liter (L)</SelectItem>
            <SelectItem value="ml">Milliliter (ml)</SelectItem>
            <SelectItem value="box">Box</SelectItem>
            <SelectItem value="pack">Pack</SelectItem>
            <SelectItem value="pair">Pair</SelectItem>
            <SelectItem value="set">Set</SelectItem>
            <SelectItem value="roll">Roll</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* ── Warranty Section ── */}
      <div className="space-y-4 rounded-xl border bg-slate-50/50 p-4">
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="hasWarranty" 
            checked={hasWarranty} 
            onCheckedChange={(checked) => {
              setHasWarranty(checked as boolean);
              if (!checked) {
                setValue('warrantyMonths', 0);
                setValue('warrantyType', '');
                setCustomWarrantyType(false);
              }
            }} 
          />
          <Label htmlFor="hasWarranty" className="text-sm font-medium cursor-pointer">
            This product has a warranty
          </Label>
        </div>

        {hasWarranty && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
            <div className="space-y-1.5">
              <Label htmlFor="warrantyMonths" className="text-sm font-medium">Warranty Duration (Months)</Label>
              <Input
                id="warrantyMonths"
                type="number"
                min={0}
                className="h-10 bg-white"
                {...register('warrantyMonths', { valueAsNumber: true })}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Warranty Type</Label>
              <Select
                value={customWarrantyType ? 'Other' : (watch('warrantyType') || '')}
                onValueChange={(val) => {
                  if (val === 'Other') {
                    setCustomWarrantyType(true);
                    setValue('warrantyType', '');
                  } else {
                    setCustomWarrantyType(false);
                    setValue('warrantyType', val);
                  }
                }}
              >
                <SelectTrigger className="bg-white h-10">
                  <SelectValue placeholder="Select Warranty Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Official Warranty">Official Warranty</SelectItem>
                  <SelectItem value="Service Warranty">Service Warranty</SelectItem>
                  <SelectItem value="Replacement Warranty">Replacement Warranty</SelectItem>
                  <SelectItem value="International Warranty">International Warranty</SelectItem>
                  <SelectItem value="Parts Warranty">Parts Warranty</SelectItem>
                  <SelectItem value="Other">Other (Type manually)</SelectItem>
                </SelectContent>
              </Select>

              {customWarrantyType && (
                <div className="pt-2">
                  <Input
                    placeholder="e.g. Lifetime Warranty"
                    className="h-10 bg-white"
                    {...register('warrantyType')}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
