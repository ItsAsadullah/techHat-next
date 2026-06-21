'use client';

import { useFormContext } from 'react-hook-form';
import { ProductFormValues } from '../schemas/product.schema';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Copy, RefreshCw, Loader2, Barcode } from 'lucide-react';
import BarcodeLib from 'react-barcode';
import { toast } from 'sonner';
import { useCallback, useState, useEffect } from 'react';
import { generateSKU } from '@/lib/actions/product-enterprise-actions';

export function ProductSKUBarcode() {
  const { register, watch, setValue } = useFormContext<ProductFormValues>();
  const sku = watch('sku');
  const barcode = watch('barcode');
  const name = watch('name');
  const categoryId = watch('categoryId');
  const model = watch('model');
  const [generatingSku, setGeneratingSku] = useState(false);

  const handleGenerateSKU = useCallback(async () => {
    setGeneratingSku(true);
    try {
      const res = await generateSKU(categoryId, model);
      if (res.success && res.sku) {
        setValue('sku', res.sku, { shouldDirty: true });
        setValue('barcode', res.sku, { shouldDirty: true });
        toast.success(`SKU & Barcode generated: ${res.sku}`);
      } else {
        toast.error(res.error || 'Failed to generate SKU');
      }
    } catch {
      toast.error('SKU generation failed');
    } finally {
      setGeneratingSku(false);
    }
  }, [categoryId, model, setValue]);

  // Auto-generate SKU if it's empty but category and model are provided
  useEffect(() => {
    if (!sku && categoryId && model && !generatingSku) {
      const timeout = setTimeout(() => {
        if (!watch('sku')) {
          handleGenerateSKU();
        }
      }, 1500);
      return () => clearTimeout(timeout);
    }
  }, [sku, categoryId, model, generatingSku, handleGenerateSKU, watch]);

  // Sync Barcode with SKU so they are always identical
  useEffect(() => {
    if (sku && barcode !== sku) {
      setValue('barcode', sku, { shouldDirty: true, shouldValidate: true });
    }
  }, [sku, barcode, setValue]);

  const copyToClipboard = useCallback((text: string, label: string) => {
    if (text) {
      navigator.clipboard.writeText(text);
      toast.success(`${label} copied`);
    }
  }, []);

  return (
    <div className="space-y-4">
      {/* SKU & Barcode Combined Input */}
      <div className="space-y-1.5">
        <Label htmlFor="sku" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">SKU / Barcode ID</Label>
        <div className="flex gap-1.5">
          <Input
            id="sku"
            placeholder="TH-HOC-000001"
            className="h-9 text-sm font-mono uppercase"
            {...register('sku', { 
              onChange: (e) => {
                const upperValue = e.target.value.toUpperCase();
                setValue('sku', upperValue);
                setValue('barcode', upperValue);
              }
            })}
          />
          <Button
            type="button" variant="outline" size="sm" className="h-9 px-2 shrink-0"
            onClick={handleGenerateSKU} title="Auto Generate SKU"
            disabled={generatingSku}
          >
            {generatingSku ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          </Button>
          <Button
            type="button" variant="outline" size="sm" className="h-9 px-2 shrink-0"
            onClick={() => copyToClipboard(sku || '', 'SKU / Barcode')} title="Copy SKU" disabled={!sku}
          >
            <Copy className="h-3.5 w-3.5" />
          </Button>
        </div>
        <p className="text-[11px] text-muted-foreground">This code will be used as both the internal SKU and the printable Barcode.</p>
      </div>

      {/* Barcode Visual Preview */}
      {sku ? (
        <div className="p-3 bg-white border rounded-md text-center flex flex-col items-center justify-center">
          <BarcodeLib 
            value={sku} 
            height={50} 
            displayValue={true} 
            format="CODE128"
            background="#ffffff"
            lineColor="#000000"
            margin={10}
          />
          <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
            <Barcode className="w-3 h-3" /> Scannable Preview
          </p>
        </div>
      ) : (
        <div className="p-6 bg-muted/30 border border-dashed rounded-md text-center flex flex-col items-center justify-center text-muted-foreground">
          <Barcode className="w-6 h-6 mb-2 opacity-50" />
          <p className="text-xs">Generate a SKU to view barcode preview</p>
        </div>
      )}
    </div>
  );
}
