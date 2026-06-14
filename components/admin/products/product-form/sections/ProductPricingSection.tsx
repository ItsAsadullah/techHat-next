'use client';

import { useFormContext } from 'react-hook-form';
import { ProductFormValues } from '../schemas/product.schema';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function ProductPricingSection() {
  const { register, watch, formState: { errors } } = useFormContext<ProductFormValues>();

  const costPrice = watch('costPrice') || 0;
  const price = watch('price') || 0;
  
  // Calculate margin/profit
  const profit = price - costPrice;
  const margin = price > 0 ? (profit / price) * 100 : 0;

  return (
    <div className="space-y-4">
      {/* Cost & Selling Price */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="costPrice" className="text-sm font-medium">Cost Price</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">৳</span>
            <Input id="costPrice" type="number" step="0.01" className="pl-8" {...register('costPrice', { valueAsNumber: true })} />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="price" className="text-sm font-medium">Selling Price <span className="text-red-500">*</span></Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">৳</span>
            <Input 
              id="price" 
              type="number" 
              step="0.01" 
              className={`pl-8 ${errors.price ? 'border-red-500' : ''}`}
              {...register('price', { valueAsNumber: true })} 
            />
          </div>
          {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price.message}</p>}
        </div>
      </div>

      {/* Margin / Profit Display */}
      {price > 0 && costPrice > 0 && (
        <div className="flex items-center gap-4 text-xs text-muted-foreground p-2 bg-muted/50 rounded-md">
          <div>Profit: <span className={profit > 0 ? 'text-green-600' : 'text-red-600'}>৳{profit.toFixed(2)}</span></div>
          <div>Margin: <span className={margin > 0 ? 'text-green-600' : 'text-red-600'}>{margin.toFixed(1)}%</span></div>
        </div>
      )}

      {/* Other prices (Online, Wholesale, Offer) */}
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-2">
          <Label htmlFor="offerPrice" className="text-xs font-medium text-muted-foreground">Offer Price</Label>
          <Input id="offerPrice" type="number" step="0.01" {...register('offerPrice', { valueAsNumber: true })} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="onlinePrice" className="text-xs font-medium text-muted-foreground">Online Price</Label>
          <Input id="onlinePrice" type="number" step="0.01" {...register('onlinePrice', { valueAsNumber: true })} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="wholesalePrice" className="text-xs font-medium text-muted-foreground">Wholesale Price</Label>
          <Input id="wholesalePrice" type="number" step="0.01" {...register('wholesalePrice', { valueAsNumber: true })} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="taxClass" className="text-sm font-medium">Tax Class</Label>
        <Input id="taxClass" placeholder="e.g. VAT 15%" {...register('taxClass')} />
      </div>
    </div>
  );
}
