'use client';

import { useFormContext } from 'react-hook-form';
import { ProductFormValues } from '../schemas/product.schema';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useEffect, useCallback } from 'react';
import { Globe, Search } from 'lucide-react';

/**
 * Unicode-safe slug generator.
 *
 * Strategy:
 *  1. Try to use the `slugify` package logic (same as server-side buildSlug).
 *  2. For scripts that produce empty ASCII output (Bangla, Arabic, etc.),
 *     fall back to a sanitised transliteration using encodeURIComponent, 
 *     keeping percent-encoded chars as hyphens, resulting in a timestamp slug.
 */
function buildClientSlug(text: string): string {
  if (!text) return '';

  // Step 1: Try ASCII-safe slugification
  const asciiSlug = text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip combining diacritics
    .replace(/[^a-z0-9\s-]/g, ' ')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  if (asciiSlug && asciiSlug !== '-') {
    return asciiSlug;
  }

  // Step 2: Non-ASCII fallback — use timestamp so slug is never empty
  // Server-side buildSlug() handles the real slugify with Unicode locale support.
  // We just need a valid non-empty slug preview.
  const timestampSuffix = Date.now().toString(36);
  // Try to extract any numeric or latin chars
  const latinPart = text.replace(/[^a-zA-Z0-9]/g, '').toLowerCase().substring(0, 8);
  return latinPart ? `${latinPart}-${timestampSuffix}` : `product-${timestampSuffix}`;
}

export function ProductSEOSection() {
  const { register, watch, setValue } = useFormContext<ProductFormValues>();

  const name = watch('name');
  const shortDesc = watch('shortDesc');
  const seoTitle = watch('seoTitle');
  const metaDescription = watch('metaDescription');
  const slug = watch('slug');

  // Auto-fill SEO title from name (only if seoTitle is empty)
  useEffect(() => {
    if (!seoTitle && name) {
      setValue('seoTitle', name, { shouldDirty: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name]);

  // Auto-fill meta description from shortDesc (only if metaDescription is empty)
  useEffect(() => {
    if (!metaDescription && shortDesc) {
      setValue('metaDescription', shortDesc, { shouldDirty: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shortDesc]);

  // Auto-generate slug from name (only if slug is empty)
  useEffect(() => {
    if (!slug && name) {
      setValue('slug', buildClientSlug(name), { shouldDirty: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name]);

  const titleLen = (seoTitle || '').length;
  const descLen = (metaDescription || '').length;
  const previewSlug = slug || buildClientSlug(name || '');

  return (
    <div className="space-y-4">
      {/* SEO Title */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="seoTitle" className="text-sm font-medium">SEO Title</Label>
          <span className={`text-xs tabular-nums ${titleLen > 60 ? 'text-red-500 font-medium' : 'text-muted-foreground'}`}>
            {titleLen}/60
          </span>
        </div>
        <Input
          id="seoTitle"
          placeholder="Page title for search engines"
          className="h-9 text-sm"
          {...register('seoTitle')}
        />
      </div>

      {/* Meta Description */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="metaDescription" className="text-sm font-medium">Meta Description</Label>
          <span className={`text-xs tabular-nums ${descLen > 160 ? 'text-red-500 font-medium' : 'text-muted-foreground'}`}>
            {descLen}/160
          </span>
        </div>
        <Textarea
          id="metaDescription"
          placeholder="Description shown in search results..."
          className="resize-none h-[60px] text-sm"
          {...register('metaDescription')}
        />
      </div>

      {/* URL Slug */}
      <div className="space-y-1.5">
        <Label htmlFor="slug" className="text-sm font-medium">URL Slug</Label>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground shrink-0 font-mono">/products/</span>
          <Input
            id="slug"
            placeholder="product-url-slug"
            className="h-9 text-sm font-mono"
            {...register('slug')}
          />
        </div>
        <p className="text-[11px] text-muted-foreground">
          Bangla/Arabic names are handled server-side using Unicode-safe slugify.
        </p>
      </div>

      {/* Google Search Preview */}
      {(seoTitle || name) && (
        <div className="rounded-md border overflow-hidden">
          <div className="flex items-center gap-1.5 px-3 py-2 bg-muted/30 border-b">
            <Search className="h-3 w-3 text-muted-foreground" />
            <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Search Preview</span>
          </div>
          <div className="p-3 space-y-0.5">
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Globe className="h-3 w-3" />
              <span className="font-mono">techhat.com.bd/products/{previewSlug}</span>
            </div>
            <div className="text-blue-700 dark:text-blue-400 text-sm font-medium truncate">
              {seoTitle || name}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed">
              {metaDescription || shortDesc || 'No description provided.'}
            </div>
          </div>
        </div>
      )}

      {/* Open Graph Preview */}
      {(seoTitle || name) && (
        <div className="rounded-md border overflow-hidden">
          <div className="flex items-center gap-1.5 px-3 py-2 bg-muted/30 border-b">
            <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Open Graph Preview</span>
          </div>
          <div className="p-3 bg-[#f0f2f5] dark:bg-zinc-800">
            <div className="bg-white dark:bg-zinc-900 rounded border overflow-hidden">
              <div className="h-[80px] bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-950/40 dark:to-indigo-950/40 flex items-center justify-center">
                <span className="text-2xl">🏷️</span>
              </div>
              <div className="p-2.5">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">techhat.com.bd</p>
                <p className="text-xs font-semibold text-foreground truncate mt-0.5">{seoTitle || name}</p>
                <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">
                  {metaDescription || shortDesc || 'No description provided.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
