'use client';

import { useFormContext } from 'react-hook-form';
import { ProductFormValues } from '../schemas/product.schema';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

export function ProductInventoryConfigSection() {
  const { register, watch, setValue } = useFormContext<ProductFormValues>();
  const trackInventory = watch('trackInventory');
  const trackSerials = watch('trackSerials');
  const trackExpiry = watch('trackExpiry');
  const trackBatch = watch('trackBatch');
  const trackWarranty = watch('trackWarranty');

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="sku" className="text-sm font-medium">SKU</Label>
          <Input id="sku" placeholder="e.g. IPH-15-PRO-MAX" {...register('sku')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="barcode" className="text-sm font-medium">Barcode / UPC</Label>
          <Input id="barcode" placeholder="Scan or enter barcode" {...register('barcode')} />
        </div>
      </div>

      <div className="space-y-4 pt-4 border-t">
        <Label className="text-base font-medium">Tracking Configurations</Label>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-3 border rounded-lg bg-card">
            <div className="space-y-0.5">
              <Label className="text-sm">Track Inventory</Label>
              <div className="text-xs text-muted-foreground">Monitor stock levels</div>
            </div>
            <Switch 
              checked={trackInventory} 
              onCheckedChange={(v) => setValue('trackInventory', v)} 
            />
          </div>

          <div className="flex items-center justify-between p-3 border rounded-lg bg-card">
            <div className="space-y-0.5">
              <Label className="text-sm">Track Serials / IMEI</Label>
              <div className="text-xs text-muted-foreground">Individual item tracking</div>
            </div>
            <Switch 
              checked={trackSerials} 
              onCheckedChange={(v) => setValue('trackSerials', v)} 
            />
          </div>

          <div className="flex items-center justify-between p-3 border rounded-lg bg-card">
            <div className="space-y-0.5">
              <Label className="text-sm">Track Batch</Label>
              <div className="text-xs text-muted-foreground">Lot/Batch tracking</div>
            </div>
            <Switch 
              checked={trackBatch} 
              onCheckedChange={(v) => setValue('trackBatch', v)} 
            />
          </div>

          <div className="flex items-center justify-between p-3 border rounded-lg bg-card">
            <div className="space-y-0.5">
              <Label className="text-sm">Track Expiry</Label>
              <div className="text-xs text-muted-foreground">Expiration dates</div>
            </div>
            <Switch 
              checked={trackExpiry} 
              onCheckedChange={(v) => setValue('trackExpiry', v)} 
            />
          </div>
          
          <div className="flex items-center justify-between p-3 border rounded-lg bg-card">
            <div className="space-y-0.5">
              <Label className="text-sm">Track Warranty</Label>
              <div className="text-xs text-muted-foreground">Manage warranty claims</div>
            </div>
            <Switch 
              checked={trackWarranty} 
              onCheckedChange={(v) => setValue('trackWarranty', v)} 
            />
          </div>
        </div>
      </div>

      {trackInventory && (
        <div className="grid grid-cols-3 gap-3 pt-4 border-t">
          <div className="space-y-2">
            <Label htmlFor="minStock" className="text-xs font-medium">Min Stock</Label>
            <Input id="minStock" type="number" {...register('minStock', { valueAsNumber: true })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="maxStock" className="text-xs font-medium">Max Stock</Label>
            <Input id="maxStock" type="number" {...register('maxStock', { valueAsNumber: true })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reorderPoint" className="text-xs font-medium">Reorder Point</Label>
            <Input id="reorderPoint" type="number" {...register('reorderPoint', { valueAsNumber: true })} />
          </div>
        </div>
      )}
    </div>
  );
}
