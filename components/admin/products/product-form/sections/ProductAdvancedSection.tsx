'use client';

import { useFormContext } from 'react-hook-form';
import { ProductFormValues } from '../schemas/product.schema';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export function ProductAdvancedSection() {
  const { watch, setValue } = useFormContext<ProductFormValues>();
  
  const isActive = watch('isActive');
  const isFlashSale = watch('isFlashSale');
  const isFeatured = watch('isFeatured');
  const isBestSeller = watch('isBestSeller');

  return (
    <div className="space-y-4">
      <Label className="text-base font-medium">Status & Visibility</Label>
      
      <div className="flex items-center justify-between p-3 border rounded-lg bg-card">
        <div className="space-y-0.5">
          <Label className="text-sm">Active Status</Label>
          <div className="text-xs text-muted-foreground">Product is visible on store</div>
        </div>
        <Switch checked={isActive} onCheckedChange={(v) => setValue('isActive', v)} />
      </div>

      <div className="flex items-center justify-between p-3 border rounded-lg bg-card">
        <div className="space-y-0.5">
          <Label className="text-sm">Flash Sale</Label>
          <div className="text-xs text-muted-foreground">Include in flash sale sections</div>
        </div>
        <Switch checked={isFlashSale} onCheckedChange={(v) => setValue('isFlashSale', v)} />
      </div>

      <div className="flex items-center justify-between p-3 border rounded-lg bg-card">
        <div className="space-y-0.5">
          <Label className="text-sm">Featured</Label>
          <div className="text-xs text-muted-foreground">Highlight as featured product</div>
        </div>
        <Switch checked={isFeatured} onCheckedChange={(v) => setValue('isFeatured', v)} />
      </div>

      <div className="flex items-center justify-between p-3 border rounded-lg bg-card">
        <div className="space-y-0.5">
          <Label className="text-sm">Best Seller</Label>
          <div className="text-xs text-muted-foreground">Mark as a best selling item</div>
        </div>
        <Switch checked={isBestSeller} onCheckedChange={(v) => setValue('isBestSeller', v)} />
      </div>
    </div>
  );
}
