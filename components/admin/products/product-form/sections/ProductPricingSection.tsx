'use client';

import { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { ProductFormValues } from '../schemas/product.schema';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TrendingUp, TrendingDown, Minus, Lock, ChevronDown, ChevronUp } from 'lucide-react';

interface Props {
  isEditMode?: boolean;
}

export function ProductPricingSection({ isEditMode = false }: Props) {
  const { register, watch, formState: { errors } } = useFormContext<ProductFormValues>();

  // costPrice comes from form default (initialData) — display only, never submitted
  const costPrice = watch('costPrice') ?? 0;
  const price = watch('price') || 0;

  const profit = price - costPrice;
  const margin = price > 0 ? (profit / price) * 100 : 0;

  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <div className="space-y-4">
      {/* ── Retail Price + Offer Price ── */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="price" className="text-sm font-medium">
            Retail Price <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">৳</span>
            <Input
              id="price"
              type="number"
              step="0.01"
              min={0}
              className={`pl-7 h-10 ${errors.price ? 'border-red-500' : ''}`}
              {...register('price', { valueAsNumber: true })}
            />
          </div>
          {errors.price && <p className="text-red-500 text-xs">{errors.price.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="offerPrice" className="text-sm font-medium">Offer Price</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">৳</span>
            <Input
              id="offerPrice"
              type="number"
              step="0.01"
              min={0}
              className="pl-7 h-10"
              {...register('offerPrice', { valueAsNumber: true })}
            />
          </div>
        </div>
      </div>

      <div className="pt-2">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
        >
          {showAdvanced ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          Advanced Pricing
        </button>
      </div>

      {showAdvanced && (
        <div className="space-y-4 p-4 border rounded-md bg-muted/10">
          {/* ── Online Price + Wholesale Price ── */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="onlinePrice" className="text-xs font-medium text-muted-foreground">Online Price</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">৳</span>
                <Input
                  id="onlinePrice"
                  type="number"
                  step="0.01"
                  min={0}
                  className="pl-7 h-9"
                  {...register('onlinePrice', { valueAsNumber: true })}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="wholesalePrice" className="text-xs font-medium text-muted-foreground">Wholesale Price</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">৳</span>
                <Input
                  id="wholesalePrice"
                  type="number"
                  step="0.01"
                  min={0}
                  className="pl-7 h-9"
                  {...register('wholesalePrice', { valueAsNumber: true })}
                />
              </div>
            </div>
          </div>

          {/* ── Tax Class ── */}
          <div className="space-y-1.5">
            <Label htmlFor="taxClass" className="text-xs font-medium text-muted-foreground">Tax Class</Label>
            <Input
              id="taxClass"
              placeholder="e.g. VAT 15%"
              className="h-9"
              {...register('taxClass')}
            />
          </div>
        </div>
      )}

      {/* ── Purchase Cost (read-only from Purchase Module) ── */}
      <div className="border-t pt-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-muted-foreground">Average Cost</span>
          <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400 px-1.5 py-0.5 rounded font-bold">
            <Lock className="h-2.5 w-2.5" />
            Purchase Module
          </span>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-muted/40 border border-dashed">
          <span className="text-muted-foreground text-sm">৳</span>
          <span className="font-mono text-sm font-medium">
            {costPrice > 0 ? costPrice.toFixed(2) : '—'}
          </span>
          <span className="text-xs text-muted-foreground ml-auto">
            Automatically calculated from purchases
          </span>
        </div>
      </div>

      {/* ── Profit / Margin Indicator ── */}
      {price > 0 && costPrice > 0 && (
        <div className="flex items-center gap-4 px-3 py-2 rounded-md bg-muted/40 text-sm">
          {profit > 0 ? (
            <TrendingUp className="h-4 w-4 text-emerald-600 shrink-0" />
          ) : profit < 0 ? (
            <TrendingDown className="h-4 w-4 text-red-600 shrink-0" />
          ) : (
            <Minus className="h-4 w-4 text-gray-400 shrink-0" />
          )}
          <div className="flex items-center gap-4 text-xs">
            <span className="text-muted-foreground">Est. Profit:</span>
            <span className={`font-mono font-semibold tabular-nums ${profit > 0 ? 'text-emerald-600' : profit < 0 ? 'text-red-600' : ''}`}>
              ৳{profit.toFixed(0)}
            </span>
            <span className="text-muted-foreground">Margin:</span>
            <span className={`font-mono font-semibold tabular-nums ${margin > 0 ? 'text-emerald-600' : margin < 0 ? 'text-red-600' : ''}`}>
              {margin.toFixed(1)}%
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
