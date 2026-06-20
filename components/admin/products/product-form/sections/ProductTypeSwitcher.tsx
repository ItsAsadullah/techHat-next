'use client';

import { useFormContext } from 'react-hook-form';
import { ProductFormValues } from '../schemas/product.schema';
import { Package, Layers, Check } from 'lucide-react';

const SIMPLE_FEATURES = [
  'একটি SKU',
  'একটি Price',
  'একটি Barcode',
  'Direct inventory tracking',
];

const VARIABLE_FEATURES = [
  'Multiple SKUs per variant',
  'Per-variant pricing',
  'Per-variant barcode',
  'Attribute-based (Color, Size, Storage…)',
];

export function ProductTypeSwitcher() {
  const { watch, setValue } = useFormContext<ProductFormValues>();
  const productVariantType = watch('productVariantType');
  const isSimple   = productVariantType === 'simple';
  const isVariable = productVariantType === 'variable';

  return (
    <div className="space-y-3">
      {/* Selector cards */}
      <div className="grid grid-cols-2 gap-3">
        {/* Simple */}
        <button
          type="button"
          onClick={() => setValue('productVariantType', 'simple', { shouldDirty: true })}
          className={`relative flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${
            isSimple
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30 shadow-sm ring-1 ring-blue-500'
              : 'border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600 bg-white dark:bg-zinc-900'
          }`}
        >
          {isSimple && (
            <div className="absolute top-1.5 right-1.5 w-3.5 h-3.5 rounded-full bg-blue-500 flex items-center justify-center">
              <Check className="w-2 h-2 text-white" />
            </div>
          )}
          <Package className={`h-6 w-6 shrink-0 ${isSimple ? 'text-blue-600' : 'text-gray-400'}`} />
          <div className="min-w-0">
            <div className={`text-sm font-semibold truncate ${isSimple ? 'text-blue-700 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}>
              Simple Product
            </div>
          </div>
        </button>

        {/* Variable */}
        <button
          type="button"
          onClick={() => setValue('productVariantType', 'variable', { shouldDirty: true })}
          className={`relative flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${
            isVariable
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30 shadow-sm ring-1 ring-blue-500'
              : 'border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600 bg-white dark:bg-zinc-900'
          }`}
        >
          {isVariable && (
            <div className="absolute top-1.5 right-1.5 w-3.5 h-3.5 rounded-full bg-blue-500 flex items-center justify-center">
              <Check className="w-2 h-2 text-white" />
            </div>
          )}
          <Layers className={`h-6 w-6 shrink-0 ${isVariable ? 'text-blue-600' : 'text-gray-400'}`} />
          <div className="min-w-0">
            <div className={`text-sm font-semibold truncate ${isVariable ? 'text-blue-700 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}>
              Variable Product
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}
