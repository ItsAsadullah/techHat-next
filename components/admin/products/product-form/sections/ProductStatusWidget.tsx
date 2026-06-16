'use client';

import { useFormContext } from 'react-hook-form';
import { ProductFormValues, PRODUCT_LIFECYCLE_STATUSES, statusConfig } from '../schemas/product.schema';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

export function ProductStatusWidget() {
  const { watch, setValue } = useFormContext<ProductFormValues>();
  const status = watch('status');
  const config = statusConfig[status] ?? statusConfig['DRAFT'];

  return (
    <div className="space-y-3">
      {/* Status Selector */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Lifecycle Status</Label>
        <Select value={status} onValueChange={(v) => setValue('status', v as any, { shouldDirty: true })}>
          <SelectTrigger className="h-9">
            <div className="flex items-center gap-2">
              <span className={`inline-block w-2 h-2 rounded-full ${
                status === 'DRAFT' ? 'bg-gray-400' :
                status === 'PENDING_REVIEW' ? 'bg-yellow-400' :
                status === 'PUBLISHED' ? 'bg-blue-500' :
                status === 'ACTIVE' ? 'bg-emerald-500' :
                status === 'ARCHIVED' ? 'bg-orange-500' :
                status === 'DISCONTINUED' ? 'bg-red-500' :
                status === 'COMING_SOON' ? 'bg-purple-500' :
                'bg-rose-500'
              }`} />
              <SelectValue />
            </div>
          </SelectTrigger>
          <SelectContent>
            {PRODUCT_LIFECYCLE_STATUSES.map((s) => {
              const c = statusConfig[s];
              return (
                <SelectItem key={s} value={s}>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{c.label}</span>
                    <span className="text-xs text-muted-foreground">{c.description}</span>
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      {/* Status Badge */}
      <div className={`px-3 py-2 rounded-md text-xs ${config.bg} ${config.color}`}>
        <span className="font-medium">{config.label}</span>
        <span className="block mt-0.5 opacity-75">{config.description}</span>
      </div>

      {/* Store visibility display */}
      <p className="text-xs text-muted-foreground">
        Store visibility: <span className={
          status === 'PUBLISHED' || status === 'ACTIVE'
            ? 'text-emerald-600 font-medium'
            : 'text-gray-500'
        }>
          {status === 'PUBLISHED' || status === 'ACTIVE' ? 'Visible' : 'Hidden'}
        </span>
      </p>
    </div>
  );
}
