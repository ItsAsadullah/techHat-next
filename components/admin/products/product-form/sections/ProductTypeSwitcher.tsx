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
          className={`relative flex flex-col items-start gap-2 p-4 rounded-lg border-2 transition-all text-left ${
            isSimple
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30 shadow-sm'
              : 'border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600 bg-white dark:bg-zinc-900'
          }`}
        >
          {isSimple && (
            <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
              <Check className="w-2.5 h-2.5 text-white" />
            </div>
          )}
          <Package className={`h-5 w-5 ${isSimple ? 'text-blue-600' : 'text-gray-400'}`} />
          <div>
            <div className={`text-sm font-semibold ${isSimple ? 'text-blue-700 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}>
              Simple Product
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">Single SKU, no variants</div>
          </div>
        </button>

        {/* Variable */}
        <button
          type="button"
          onClick={() => setValue('productVariantType', 'variable', { shouldDirty: true })}
          className={`relative flex flex-col items-start gap-2 p-4 rounded-lg border-2 transition-all text-left ${
            isVariable
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30 shadow-sm'
              : 'border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600 bg-white dark:bg-zinc-900'
          }`}
        >
          {isVariable && (
            <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
              <Check className="w-2.5 h-2.5 text-white" />
            </div>
          )}
          <Layers className={`h-5 w-5 ${isVariable ? 'text-blue-600' : 'text-gray-400'}`} />
          <div>
            <div className={`text-sm font-semibold ${isVariable ? 'text-blue-700 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}>
              Variable Product
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">Multiple SKUs & variants</div>
          </div>
        </button>
      </div>

      {/* Contextual summary — appears after selection */}
      {isSimple && (
        <div className="flex items-start gap-3 px-4 py-3 bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 rounded-lg">
          <Package className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
          <div className="space-y-1.5 min-w-0">
            <p className="text-xs font-semibold text-blue-700 dark:text-blue-400">Simple Product selected</p>
            <ul className="space-y-1">
              {SIMPLE_FEATURES.map(f => (
                <li key={f} className="flex items-center gap-1.5 text-xs text-blue-700/80 dark:text-blue-400/80">
                  <Check className="h-3 w-3 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {isVariable && (
        <div className="flex items-start gap-3 px-4 py-3 bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 rounded-lg">
          <Layers className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
          <div className="space-y-1.5 min-w-0">
            <p className="text-xs font-semibold text-blue-700 dark:text-blue-400">Variable Product selected</p>
            <ul className="space-y-1">
              {VARIABLE_FEATURES.map(f => (
                <li key={f} className="flex items-center gap-1.5 text-xs text-blue-700/80 dark:text-blue-400/80">
                  <Check className="h-3 w-3 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <p className="text-[11px] text-blue-600/70 dark:text-blue-400/60 mt-1">
              Variant section will appear below after adding attributes.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
