'use client';

import { useFormContext } from 'react-hook-form';
import { ProductFormValues } from '../schemas/product.schema';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Copy, RefreshCw, Loader2, Barcode, Hash } from 'lucide-react';
import dynamic from 'next/dynamic';

const BarcodeLib = dynamic(() => import('react-barcode'), {
  ssr: false,
  loading: () => <div className="h-[50px] w-full bg-gray-100 animate-pulse rounded my-2" />
});
import { toast } from 'sonner';
import { useCallback, useState, useEffect } from 'react';
import { generateSKU, generateNumericBarcode } from '@/lib/actions/product-enterprise-actions';

export function ProductSKUBarcode() {
  const { register, watch, setValue } = useFormContext<ProductFormValues>();
  const sku = watch('sku');
  const barcode = watch('barcode');
  const categoryId = watch('categoryId');
  const model = watch('model');
  const name = watch('name');
  const brandId = watch('brandId');
  const [generatingSku, setGeneratingSku] = useState(false);
  const [generatingBarcode, setGeneratingBarcode] = useState(false);

  // Generate Human-Readable SKU (e.g. TH-CDATA-0142 or TH-M90-0142)
  const handleGenerateSKU = useCallback(async () => {
    setGeneratingSku(true);
    try {
      const res = await generateSKU(
        categoryId || undefined,
        model || undefined,
        name || undefined,
        brandId || undefined
      );
      if (res.success && res.sku) {
        setValue('sku', res.sku, { shouldDirty: true, shouldValidate: true });
        toast.success(`SKU তৈরি হয়েছে: ${res.sku}`);
      } else {
        // Guaranteed client fallback
        const fallbackClean = (model || name || 'PROD').replace(/[^a-zA-Z0-9]/g, '').slice(0, 6).toUpperCase();
        const fallbackSku = `TH-${fallbackClean || 'PROD'}-${String(Date.now()).slice(-4)}`;
        setValue('sku', fallbackSku, { shouldDirty: true, shouldValidate: true });
        toast.success(`SKU তৈরি হয়েছে: ${fallbackSku}`);
      }
    } catch {
      // Guaranteed client fallback on network or deploy sync issue
      const fallbackClean = (model || name || 'PROD').replace(/[^a-zA-Z0-9]/g, '').slice(0, 6).toUpperCase();
      const fallbackSku = `TH-${fallbackClean || 'PROD'}-${String(Date.now()).slice(-4)}`;
      setValue('sku', fallbackSku, { shouldDirty: true, shouldValidate: true });
      toast.success(`SKU তৈরি হয়েছে: ${fallbackSku}`);
    } finally {
      setGeneratingSku(false);
    }
  }, [categoryId, model, name, brandId, setValue]);

  // Generate Unique Numeric-Only Barcode (e.g. 10000140)
  const handleGenerateBarcode = useCallback(async () => {
    setGeneratingBarcode(true);
    try {
      const res = await generateNumericBarcode();
      if (res.success && res.barcode) {
        setValue('barcode', res.barcode, { shouldDirty: true, shouldValidate: true });
        toast.success(`ইউনিক বারকোড তৈরি হয়েছে: ${res.barcode}`);
      } else {
        const fallbackBarcode = String(10000000 + (Date.now() % 9000000));
        setValue('barcode', fallbackBarcode, { shouldDirty: true, shouldValidate: true });
        toast.success(`ইউনিক বারকোড তৈরি হয়েছে: ${fallbackBarcode}`);
      }
    } catch {
      const fallbackBarcode = String(10000000 + (Date.now() % 9000000));
      setValue('barcode', fallbackBarcode, { shouldDirty: true, shouldValidate: true });
      toast.success(`ইউনিক বারকোড তৈরি হয়েছে: ${fallbackBarcode}`);
    } finally {
      setGeneratingBarcode(false);
    }
  }, [setValue]);

  // Auto-generate SKU if empty and name OR model OR category is entered
  useEffect(() => {
    if (!sku && (model || name || categoryId) && !generatingSku) {
      const timeout = setTimeout(() => {
        if (!watch('sku')) {
          handleGenerateSKU();
        }
      }, 800);
      return () => clearTimeout(timeout);
    }
  }, [sku, model, name, categoryId, generatingSku, handleGenerateSKU, watch]);

  // Auto-generate Numeric Barcode if empty on form load
  useEffect(() => {
    if (!barcode && !generatingBarcode) {
      const timeout = setTimeout(() => {
        if (!watch('barcode')) {
          handleGenerateBarcode();
        }
      }, 400);
      return () => clearTimeout(timeout);
    }
  }, [barcode, generatingBarcode, handleGenerateBarcode, watch]);

  const copyToClipboard = useCallback((text: string, label: string) => {
    if (text) {
      navigator.clipboard.writeText(text);
      toast.success(`${label} কপি করা হয়েছে`);
    }
  }, []);

  const isBarcodeNumeric = Boolean(barcode && /^\d+$/.test(barcode.trim()));
  const activeBarcodeValue = barcode || sku || '';

  return (
    <div className="space-y-4">
      {/* 1. Barcode Field (Numeric-Only for Sharp & Compact Printing) */}
      <div className="space-y-2 p-3.5 rounded-lg border border-blue-500/25 bg-blue-50/50 dark:bg-blue-950/20">
        <div className="flex items-center justify-between">
          <Label htmlFor="barcode" className="text-xs font-semibold text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
            <Hash className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> বারকোড (শুধুমাত্র সংখ্যা / 0-9)
          </Label>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300 font-bold">
            ৮ ডিজিট ইউনিক
          </span>
        </div>
        <div className="flex gap-1.5">
          <Input
            id="barcode"
            placeholder="10000140"
            inputMode="numeric"
            pattern="[0-9]*"
            className="h-9 text-sm font-mono font-bold tracking-wider bg-white dark:bg-zinc-900"
            {...register('barcode', {
              onChange: (e) => {
                // Filter out non-digits: only allow pure numbers
                const numericOnly = e.target.value.replace(/\D/g, '');
                setValue('barcode', numericOnly, { shouldDirty: true, shouldValidate: true });
              }
            })}
          />
          <Button
            type="button" variant="outline" size="sm" className="h-9 px-2.5 shrink-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/50"
            onClick={handleGenerateBarcode} title="নতুন ইউনিক বারকোড জেনারেট করুন"
            disabled={generatingBarcode}
          >
            {generatingBarcode ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            <span className="ml-1 text-xs">নতুন</span>
          </Button>
          <Button
            type="button" variant="outline" size="sm" className="h-9 px-2 shrink-0"
            onClick={() => copyToClipboard(barcode || '', 'Barcode')} title="Copy Barcode" disabled={!barcode}
          >
            <Copy className="h-3.5 w-3.5" />
          </Button>
        </div>
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          {isBarcodeNumeric ? (
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">
              ✓ শুধু সংখ্যা থাকায় বারকোড অনেক ছোট হবে এবং প্রিন্টারে ক্লিয়ার ও স্পষ্ট প্রিন্ট হবে।
            </span>
          ) : (
            <span>শুধু সংখ্যা (0-9) ব্যবহার করুন যাতে বারকোডের দাগ ঘন না হয়ে স্পষ্ট ও দ্রুত স্ক্যান হয়।</span>
          )}
        </p>
      </div>

      {/* 2. SKU Field (Human-Readable Model Code) */}
      <div className="space-y-1.5">
        <Label htmlFor="sku" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          SKU (মডেল কোড / অভ্যন্তরীণ আইডি)
        </Label>
        <div className="flex gap-1.5">
          <Input
            id="sku"
            placeholder="TH-TX100-0001"
            className="h-9 text-sm font-mono uppercase"
            {...register('sku', { 
              onChange: (e) => {
                setValue('sku', e.target.value.toUpperCase(), { shouldDirty: true, shouldValidate: true });
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
            onClick={() => copyToClipboard(sku || '', 'SKU')} title="Copy SKU" disabled={!sku}
          >
            <Copy className="h-3.5 w-3.5" />
          </Button>
        </div>
        <p className="text-[11px] text-muted-foreground">অভ্যন্তরীণ হিসাব ও মডেল চেনার জন্য SKU ব্যবহার হয়।</p>
      </div>

      {/* 3. Barcode Visual Scannable Preview */}
      {activeBarcodeValue ? (
        <div className="p-3.5 bg-white dark:bg-zinc-950 border rounded-md text-center flex flex-col items-center justify-center">
          <BarcodeLib 
            value={activeBarcodeValue} 
            height={46} 
            displayValue={true} 
            format="CODE128"
            background="transparent"
            lineColor="#000000"
            margin={6}
            fontSize={12}
          />
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Barcode className="w-3 h-3" /> স্ক্যানযোগ্য লাইভ প্রিভিউ
            </span>
            {isBarcodeNumeric && (
              <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded">
                Code 128C (Ultra-Compact & Clear)
              </span>
            )}
          </div>
        </div>
      ) : (
        <div className="p-5 bg-muted/30 border border-dashed rounded-md text-center flex flex-col items-center justify-center text-muted-foreground">
          <Barcode className="w-6 h-6 mb-1 opacity-50" />
          <p className="text-xs">বারকোড তৈরি হলে লাইভ প্রিভিউ দেখা যাবে</p>
        </div>
      )}
    </div>
  );
}
