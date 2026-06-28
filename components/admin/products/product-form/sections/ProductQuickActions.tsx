'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Eye, CopyPlus, Printer, Barcode, Archive, FileText, Share2, Loader2, Check,
} from 'lucide-react';
import { toast } from 'sonner';
import { duplicateProduct } from '@/lib/actions/product-duplicate-action';
import { updateProductStatus } from '@/lib/actions/product-enterprise-actions';
import { useConfirm } from '@/components/providers/confirm-provider';

interface Props {
  productId?: string;
  slug?: string;
  productName?: string;
  sku?: string;
  barcode?: string;
}

export function ProductQuickActions({ productId, slug, productName, sku, barcode }: Props) {
  const router = useRouter();
  const [duplicating, setDuplicating] = useState(false);
  const [archiving,   setArchiving]   = useState(false);
  const [copied,      setCopied]      = useState(false);
  const confirm = useConfirm();

  // ── Duplicate ──────────────────────────────────────────────────────────────
  const handleDuplicate = async () => {
    if (!productId) return;
    setDuplicating(true);
    try {
      const res = await duplicateProduct(productId);
      if (res.success && res.newProductId) {
        toast.success('Product duplicated as DRAFT');
        router.push(`/admin/products/edit/${res.newProductId}`);
      } else {
        toast.error(res.error || 'Failed to duplicate');
      }
    } catch {
      toast.error('Duplicate failed');
    } finally {
      setDuplicating(false);
    }
  };

  // ── Archive ────────────────────────────────────────────────────────────────
  const handleArchive = async () => {
    if (!productId) return;
    if (!(await confirm('Archive this product? It will be hidden from the store but data is retained.'))) return;
    setArchiving(true);
    try {
      const res = await updateProductStatus(productId, 'ARCHIVED', 'admin', 'Archived via Quick Actions');
      if (res.success) {
        toast.success('Product archived');
        router.refresh();
      } else {
        toast.error(res.error || 'Failed to archive');
      }
    } catch {
      toast.error('Archive failed');
    } finally {
      setArchiving(false);
    }
  };

  // ── Print Barcode ──────────────────────────────────────────────────────────
  const handlePrintBarcode = () => {
    const barcodeValue = barcode || sku || productId || 'N/A';
    const name         = productName || 'Product';

    const printWindow = window.open('', '_blank', 'width=400,height=300');
    if (!printWindow) { toast.error('Allow pop-ups to print barcode'); return; }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Barcode — ${name}</title>
          <style>
            body { font-family: monospace; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; }
            .name { font-size: 14px; font-weight: bold; margin-bottom: 8px; text-align: center; }
            .barcode-value { font-size: 22px; letter-spacing: 0.3em; margin: 8px 0; }
            .bars { display: flex; gap: 1px; height: 60px; margin: 4px 0; }
            .bar { background: #000; }
            .label { font-size: 10px; color: #666; margin-top: 4px; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          <div class="name">${name}</div>
          <div class="barcode-container" style="width: 100%; max-width: 300px; display: flex; justify-content: center; margin: 5px 0;">
            <svg id="barcode"></svg>
          </div>
          <div class="label">SKU: ${sku || '—'}</div>
          <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"></script>
          <script>
            window.onload = () => {
              JsBarcode("#barcode", "${barcodeValue}", {
                format: "CODE128",
                width: 2,
                height: 50,
                displayValue: false,
                margin: 0
              });
              setTimeout(() => {
                window.print();
                window.close();
              }, 300);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // ── Print SKU Label ────────────────────────────────────────────────────────
  const handlePrintLabel = () => {
    const name = productName || 'Product';
    const printWindow = window.open('', '_blank', 'width=400,height=200');
    if (!printWindow) { toast.error('Allow pop-ups to print label'); return; }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Label — ${name}</title>
          <style>
            body { font-family: sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
            .label { border: 2px solid #000; padding: 12px 20px; display: inline-block; text-align: center; }
            .name { font-size: 13px; font-weight: bold; margin-bottom: 6px; }
            .sku { font-family: monospace; font-size: 16px; letter-spacing: 0.15em; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          <div class="label">
            <div class="name">${name}</div>
            <div class="sku">${sku || barcode || '—'}</div>
          </div>
          <script>window.onload = () => { window.print(); window.close(); }<\/script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // ── Share Link ─────────────────────────────────────────────────────────────
  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast.success('Link copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy link');
    }
  };

  if (!productId) return null;

  return (
    <div className="space-y-0.5">
      {/* View on Store */}
      {slug && (
        <Button
          type="button"
          variant="ghost"
          className="w-full justify-start h-8 text-sm font-normal px-2"
          onClick={() => window.open(`/products/${slug}`, '_blank')}
        >
          <Eye className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
          View on Store
        </Button>
      )}

      {/* Duplicate */}
      <Button
        type="button"
        variant="ghost"
        className="w-full justify-start h-8 text-sm font-normal px-2"
        onClick={handleDuplicate}
        disabled={duplicating}
      >
        {duplicating ? (
          <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
        ) : (
          <CopyPlus className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
        )}
        {duplicating ? 'Duplicating...' : 'Duplicate Product'}
      </Button>

      {/* Print Barcode */}
      <Button
        type="button"
        variant="ghost"
        className="w-full justify-start h-8 text-sm font-normal px-2"
        onClick={handlePrintBarcode}
      >
        <Barcode className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
        Print Barcode
      </Button>

      {/* Print SKU Label */}
      <Button
        type="button"
        variant="ghost"
        className="w-full justify-start h-8 text-sm font-normal px-2"
        onClick={handlePrintLabel}
      >
        <Printer className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
        Print SKU Label
      </Button>

      {/* Share Link */}
      <Button
        type="button"
        variant="ghost"
        className="w-full justify-start h-8 text-sm font-normal px-2"
        onClick={handleShare}
      >
        {copied ? (
          <Check className="h-3.5 w-3.5 mr-2 text-emerald-500" />
        ) : (
          <Share2 className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
        )}
        {copied ? 'Copied!' : 'Copy Share Link'}
      </Button>

      <div className="border-t my-1" />

      {/* Archive — Destructive */}
      <Button
        type="button"
        variant="ghost"
        className="w-full justify-start h-8 text-sm font-normal px-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
        onClick={handleArchive}
        disabled={archiving}
      >
        {archiving ? (
          <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
        ) : (
          <Archive className="h-3.5 w-3.5 mr-2" />
        )}
        {archiving ? 'Archiving...' : 'Archive Product'}
      </Button>
    </div>
  );
}
