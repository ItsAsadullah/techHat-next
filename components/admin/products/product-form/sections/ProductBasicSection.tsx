'use client';

import { useFormContext } from 'react-hook-form';
import { ProductFormValues } from '../schemas/product.schema';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import CategoryHierarchy from '@/components/admin/category-hierarchy';
import { BrandCombobox } from '@/components/admin/brand-combobox';
import RichTextEditor from '@/components/ui/rich-text-editor';

interface ProductBasicSectionProps {
  categories: any[];
  brands: any[];
}

export function ProductBasicSection({ categories, brands }: ProductBasicSectionProps) {
  const { register, setValue, watch, formState: { errors } } = useFormContext<ProductFormValues>();
  const categoryId = watch('categoryId');
  const brandId = watch('brandId');
  const description = watch('description');

  return (
    <div className="space-y-4">
      {/* Name Field */}
      <div className="space-y-2">
        <Label htmlFor="name" className="text-sm font-medium">Product Name <span className="text-red-500">*</span></Label>
        <Input 
          id="name" 
          placeholder="e.g. iPhone 15 Pro Max" 
          {...register('name')} 
          className={errors.name ? 'border-red-500' : ''}
        />
        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
      </div>

      {/* Category and Brand Side-by-Side (Mobile: grid-cols-2 if requested, but label might wrap, let's use gap-3 and flex or grid) */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label className="text-sm font-medium">Category <span className="text-red-500">*</span></Label>
          <CategoryHierarchy
            initialCategories={categories}
            selectedCategoryId={categoryId}
            onCategorySelect={(id) => setValue('categoryId', id, { shouldValidate: true })}
          />
          {errors.categoryId && <p className="text-red-500 text-xs mt-1">{errors.categoryId.message}</p>}
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Brand</Label>
          <BrandCombobox
            brands={brands}
            value={brandId || ''}
            onValueChange={(id) => setValue('brandId', id, { shouldValidate: true })}
          />
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Description</Label>
        <div className="min-h-[200px]">
          <RichTextEditor
            value={description || ''}
            onChange={(content) => setValue('description', content)}
          />
        </div>
      </div>
    </div>
  );
}
