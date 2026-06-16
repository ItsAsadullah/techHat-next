'use client';

import { useFormContext } from 'react-hook-form';
import { ProductFormValues } from '../schemas/product.schema';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import CategoryHierarchy from '@/components/admin/category-hierarchy';
import { BrandCombobox } from '@/components/admin/brand-combobox';
import { Textarea } from '@/components/ui/textarea';

interface ProductBasicSectionProps {
  categories: any[];
  brands:     any[];
}

export function ProductBasicSection({ categories, brands }: ProductBasicSectionProps) {
  const { register, setValue, watch, formState: { errors } } = useFormContext<ProductFormValues>();
  const categoryId = watch('categoryId');
  const brandId    = watch('brandId');
  const unit       = watch('unit');
  const nameLength = (watch('name') || '').length;

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
        <Input
          id="name"
          placeholder="e.g. Hoco EQ33 Wireless Earbuds"
          className={`h-10 ${errors.name ? 'border-red-500' : ''}`}
          {...register('name')}
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
          initialCategories={categories}
          selectedCategoryId={categoryId}
          onCategorySelect={(id) => setValue('categoryId', id, { shouldValidate: true })}
        />
        {errors.categoryId && <p className="text-red-500 text-xs">{errors.categoryId.message}</p>}
      </div>

      {/* ── Unit + Warranty ── */}
      <div className="grid grid-cols-2 gap-3">
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

        <div className="space-y-1.5">
          <Label htmlFor="warrantyMonths" className="text-sm font-medium">Warranty (months)</Label>
          <Input
            id="warrantyMonths"
            type="number"
            min={0}
            className="h-10"
            {...register('warrantyMonths', { valueAsNumber: true })}
          />
        </div>
      </div>

      {/* ── Warranty Type (moved here from sidebar) ── */}
      <div className="space-y-1.5">
        <Label htmlFor="warrantyType" className="text-sm font-medium">Warranty Type</Label>
        <Input
          id="warrantyType"
          placeholder="e.g. Official, Service Center, International"
          className="h-9"
          {...register('warrantyType')}
        />
      </div>

    </div>
  );
}
