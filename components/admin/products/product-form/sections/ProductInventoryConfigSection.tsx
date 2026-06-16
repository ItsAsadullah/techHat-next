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

  const trackingOptions = [
    { key: 'trackInventory' as const, label: 'Track Inventory', desc: 'Monitor stock levels', value: trackInventory },
    { key: 'trackSerials' as const, label: 'Track Serials / IMEI', desc: 'Individual item tracking', value: trackSerials },
    { key: 'trackBatch' as const, label: 'Track Batch', desc: 'Lot/batch tracking', value: trackBatch },
    { key: 'trackExpiry' as const, label: 'Track Expiry', desc: 'Expiration date tracking', value: trackExpiry },
    { key: 'trackWarranty' as const, label: 'Track Warranty', desc: 'Warranty claim management', value: trackWarranty },
  ];

  return (
    <div className="space-y-4">
      {/* Tracking Toggles — Compact Rows */}
      <div className="space-y-0 divide-y rounded-lg border overflow-hidden">
        {trackingOptions.map((opt) => (
          <div key={opt.key} className="flex items-center justify-between px-3 py-2.5 bg-card hover:bg-muted/30 transition-colors">
            <div>
              <div className="text-sm font-medium">{opt.label}</div>
              <div className="text-xs text-muted-foreground">{opt.desc}</div>
            </div>
            <Switch
              checked={opt.value}
              onCheckedChange={(v) => setValue(opt.key, v)}
            />
          </div>
        ))}
      </div>

      {/* Alert Thresholds — Only when tracking inventory */}
      {trackInventory && (
        <div className="space-y-3 pt-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Stock Thresholds</p>
          
          {/* Row 1: Min Stock + Safety Stock */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="minStock" className="text-xs font-medium">Min Stock Alert</Label>
              <Input id="minStock" type="number" min={0} className="h-9" {...register('minStock', { valueAsNumber: true })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="safetyStock" className="text-xs font-medium">Safety Stock</Label>
              <Input id="safetyStock" type="number" min={0} className="h-9" {...register('safetyStock', { valueAsNumber: true })} />
            </div>
          </div>

          {/* Row 2: Reorder Point + Reorder Qty */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="reorderPoint" className="text-xs font-medium">Reorder Point</Label>
              <Input id="reorderPoint" type="number" min={0} className="h-9" {...register('reorderPoint', { valueAsNumber: true })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="reorderQty" className="text-xs font-medium">Reorder Qty</Label>
              <Input id="reorderQty" type="number" min={0} className="h-9" {...register('reorderQty', { valueAsNumber: true })} />
            </div>
          </div>

          {/* Row 3: Lead Time */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="leadTimeDays" className="text-xs font-medium">Lead Time (days)</Label>
              <Input id="leadTimeDays" type="number" min={0} className="h-9" {...register('leadTimeDays', { valueAsNumber: true })} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
