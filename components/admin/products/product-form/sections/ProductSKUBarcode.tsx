'use client';

import { useFormContext } from 'react-hook-form';
import { ProductFormValues } from '../schemas/product.schema';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Copy, RefreshCw, Barcode, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useCallback, useState } from 'react';
import { generateSKU, generateBarcode } from '@/lib/actions/product-enterprise-actions';

export function ProductSKUBarcode() {
  const { register, watch, setValue } = useFormContext<ProductFormValues>();
  const sku = watch('sku');
  const barcode = watch('barcode');
  const name = watch('name');
  const [generatingSku, setGeneratingSku] = useState(false);
  const [generatingBarcode, setGeneratingBarcode] = useState(false);

  const handleGenerateSKU = useCallback(async () => {
    setGeneratingSku(true);
    try {
      // Build prefix from product name: TH-{3chars}
      const nameCode = name
        ? name.replace(/[^a-zA-Z0-9]/g, '').substring(0, 3).toUpperCase()
        : 'PRD';
      const prefix = `TH-${nameCode}`;
      const res = await generateSKU(prefix);
      if (res.success && res.sku) {
        setValue('sku', res.sku, { shouldDirty: true });
        toast.success(`SKU generated: ${res.sku}`);
      } else {
        toast.error(res.error || 'Failed to generate SKU');
      }
    } catch {
      toast.error('SKU generation failed');
    } finally {
      setGeneratingSku(false);
    }
  }, [name, setValue]);

  const handleGenerateBarcode = useCallback(async () => {
    setGeneratingBarcode(true);
    try {
      const res = await generateBarcode();
      if (res.success && res.barcode) {
        setValue('barcode', res.barcode, { shouldDirty: true });
        toast.success(`EAN-13 Barcode generated: ${res.barcode}`);
      } else {
        toast.error(res.error || 'Failed to generate barcode');
      }
    } catch {
      toast.error('Barcode generation failed');
    } finally {
      setGeneratingBarcode(false);
    }
  }, [setValue]);

  const copyToClipboard = useCallback((text: string, label: string) => {
    if (text) {
      navigator.clipboard.writeText(text);
      toast.success(`${label} copied`);
    }
  }, []);

  return (
    <div className="space-y-4">
      {/* SKU */}
      <div className="space-y-1.5">
        <Label htmlFor="sku" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">SKU</Label>
        <div className="flex gap-1.5">
          <Input
            id="sku"
            placeholder="TH-HOC-000001"
            className="h-9 text-sm font-mono"
            {...register('sku')}
          />
          <Button
            type="button" variant="outline" size="sm" className="h-9 px-2 shrink-0"
            onClick={handleGenerateSKU} title="Generate SKU (DB Sequence)"
            disabled={generatingSku}
          >
            {generatingSku ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          </Button>
          <Button
            type="button" variant="outline" size="sm" className="h-9 px-2 shrink-0"
            onClick={() => copyToClipboard(sku || '', 'SKU')} title="Copy SKU" disabled={!sku}
          >
            <Copy className="h-3.5 w-3.5" />
          </Button>
        </div>
        {sku && <p className="text-xs text-muted-foreground font-mono">{sku}</p>}
      </div>

      {/* Barcode */}
      <div className="space-y-1.5">
        <Label htmlFor="barcode" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Barcode</Label>
        <div className="flex gap-1.5">
          <Input
            id="barcode"
            placeholder="Scan or enter barcode"
            className="h-9 text-sm font-mono"
            {...register('barcode')}
          />
          <Button
            type="button" variant="outline" size="sm" className="h-9 px-2 shrink-0"
            onClick={handleGenerateBarcode} title="Generate Barcode"
            disabled={generatingBarcode}
          >
            <Barcode className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button" variant="outline" size="sm" className="h-9 px-2 shrink-0"
            onClick={() => copyToClipboard(barcode || '', 'Barcode')} title="Copy Barcode" disabled={!barcode}
          >
            <Copy className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Barcode Visual Preview */}
      {barcode && (
        <div className="p-3 bg-white dark:bg-zinc-900 border rounded-md text-center">
          <div className="font-mono text-lg tracking-[0.3em] text-gray-800 dark:text-gray-200 mb-1">{barcode}</div>
          <div className="flex justify-center gap-[1px] h-10">
            {barcode.split('').map((char, i) => (
              <div
                key={i}
                className="bg-gray-900 dark:bg-gray-100"
                style={{ width: `${parseInt(char) % 2 === 0 ? 2 : 1}px`, height: '100%' }}
              />
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">CODE-128 Preview</p>
        </div>
      )}
    </div>
  );
}
