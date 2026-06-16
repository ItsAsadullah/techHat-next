'use client';

import { useFormContext } from 'react-hook-form';
import { ProductFormValues } from '../schemas/product.schema';
import { Switch } from '@/components/ui/switch';
import { Info } from 'lucide-react';

/**
 * ProductAdvancedSection — Merchandising flags only.
 *
 * ERP Rule: Store visibility is controlled exclusively by Lifecycle Status.
 */
export function ProductAdvancedSection() {
  const { watch, setValue } = useFormContext<ProductFormValues>();

  const toggles = [
    { key: 'isFeatured'   as const, label: 'Featured',    desc: 'Show in featured collections' },
    { key: 'isFlashSale'  as const, label: 'Flash Sale',   desc: 'Include in flash sale campaigns' },
    { key: 'isBestSeller' as const, label: 'Best Seller',  desc: 'Mark as best seller badge' },
  ];

  return (
    <div className="space-y-0">
      {/* ERP notice */}
      <div className="flex items-start gap-2 px-3 py-2 mb-2 rounded-md bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
        <Info className="h-3.5 w-3.5 text-blue-500 mt-0.5 shrink-0" />
        <p className="text-[11px] text-blue-700 dark:text-blue-400 leading-relaxed">
          Store visibility is controlled by <strong>Lifecycle Status</strong>. Set status to <strong>ACTIVE</strong> or <strong>PUBLISHED</strong> to make the product visible.
        </p>
      </div>

      <div className="divide-y rounded-lg border overflow-hidden">
        {toggles.map((t) => (
          <div key={t.key} className="flex items-center justify-between px-3 py-2.5 bg-card hover:bg-muted/30 transition-colors">
            <div>
              <div className="text-sm font-medium">{t.label}</div>
              <div className="text-xs text-muted-foreground">{t.desc}</div>
            </div>
            <Switch
              checked={watch(t.key)}
              onCheckedChange={(v) => setValue(t.key, v, { shouldDirty: true })}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
