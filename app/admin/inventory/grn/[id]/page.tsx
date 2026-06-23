// @ts-nocheck
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Printer, Lock, CheckCircle, PackageSearch, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { getGRNById, submitGRN } from '@/lib/actions/grn-actions';
import { getPOSConfig } from '@/lib/actions/settings-actions';

export default function GRNDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [grn, setGrn] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [posConfig, setPosConfig] = useState<any>(null);

  // TechHat cipher: I=1, Z=2, E=3, A=4, S=5, G=6, T=7, B=8, P=9, O=0
  const cipherMap: Record<string, string> = { '1': 'I', '2': 'Z', '3': 'E', '4': 'A', '5': 'S', '6': 'G', '7': 'T', '8': 'B', '9': 'P', '0': 'O' };
  const toCipher = (price: number) =>
    Math.round(price).toString().split('').map(d => cipherMap[d] || d).join('');

  const handlePrintLabels = () => {
    if (!grn) return;
    const labelWidth = posConfig?.pos_label_width || '50';
    const labelHeight = posConfig?.pos_label_height || '25';

    const supplierCode = grn.supplier?.supplierCode ||
      (grn.supplier?.name || '').toUpperCase().replace(/\s+/g, '').substring(0, 4);

    const logoUrl = posConfig?.pos_logo
      ? `${posConfig.pos_logo}?t=${Date.now()}`
      : `${window.location.origin}/images/techhat.png`;

    // Build all label HTML
    const labelsHtml = grn.items.flatMap((item: any) => {
      const qty = item.acceptedQty || 0;
      const category = (item.product?.category?.name || '').toUpperCase();
      const modelName = (item.product?.model || item.product?.name || '').toUpperCase();
      const landedCost = item.unitCost || item.product?.costPrice || 0;
      const cipherPrice = toCipher(landedCost);
      const sku = item.variant?.sku || item.product?.sku || 'N/A';
      
      const parts = [modelName, cipherPrice, supplierCode].filter(Boolean).join('-');
      const infoHtml = category 
        ? `<span class="cat-wrapper"><span class="cat-part" contenteditable="true" spellcheck="false" title="Click to edit category">${category}</span><span class="cat-sep">-</span></span><span contenteditable="true" spellcheck="false" title="Click to edit model">${parts}</span>`
        : `<span contenteditable="true" spellcheck="false" title="Click to edit model">${parts}</span>`;

      return Array.from({ length: qty }, () => `
        <div class="label">
          <div class="brand">
            <img src="${logoUrl}" alt="Logo" />
            TECHHAT
          </div>
          <div class="info">${infoHtml}</div>
          <svg class="barcode" data-sku="${sku}"></svg>
          <div class="sku-text">${sku}</div>
        </div>
      `);
    }).join('');

    const popup = window.open('', '_blank', `width=520,height=400,toolbar=0,menubar=0,scrollbars=yes`);
    if (!popup) { toast.error('Popup blocked! Please allow popups for this site.'); return; }

    popup.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Barcode Labels — ${labelWidth}×${labelHeight}mm</title>
        <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"><\/script>
        <style>
          :root {
            --page-width: ${labelWidth}mm;
            --page-height: ${labelHeight}mm;
            --pad-left: 5.5mm;
            --pad-top: 0.5mm;
          }
          @page { size: var(--page-width) var(--page-height); margin: 0; }
          * { box-sizing: border-box; margin: 0; padding: 0; font-family: Arial, sans-serif; }
          body { background: #f5f5f5; }

          .top-bar {
            background: #18181b;
            color: white;
            padding: 12px 14px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: 12px;
          }
          .settings-group {
            display: flex;
            gap: 12px;
            align-items: center;
            background: #27272a;
            padding: 8px 12px;
            border-radius: 6px;
            font-size: 12px;
          }
          .settings-group label { display: flex; align-items: center; gap: 6px; color: #d4d4d8; }
          .settings-group input {
            background: #18181b;
            border: 1px solid #3f3f46;
            color: white;
            padding: 4px 6px;
            border-radius: 4px;
            width: 50px;
            font-size: 12px;
          }
          .settings-toggle-btn {
            background: #3f3f46;
            color: white;
            border: none;
            padding: 8px 16px;
            font-size: 14px;
            font-weight: bold;
            border-radius: 5px;
            cursor: pointer;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          }
          .settings-toggle-btn:hover { background: #52525b; }
          .print-btn {
            background: #22c55e;
            color: white;
            border: none;
            padding: 8px 24px;
            font-size: 14px;
            font-weight: bold;
            border-radius: 5px;
            cursor: pointer;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          }
          .print-btn:hover { background: #16a34a; }

          .print-area { padding: 10px; display: flex; flex-direction: column; align-items: center; gap: 6px; }
          .label {
            width: var(--page-width);
            height: var(--page-height);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: var(--pad-top) 2mm 1.5mm var(--pad-left);
            page-break-after: always;
            overflow: hidden;
            background: white;
            border: 1px dashed #ccc;
          }
          .brand {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 4px;
            font-size: 14px;
            font-weight: 900;
            text-align: center;
            letter-spacing: 0.5px;
            margin-bottom: 1.5px;
            text-transform: uppercase;
            white-space: nowrap;
          }
          .brand img {
            height: 40px;
            width: auto;
            object-fit: contain;
          }
          .info {
            font-size: 9.5px;
            font-weight: bold;
            text-align: center;
            letter-spacing: 0.5px;
            margin-bottom: 1px;
          }
          .barcode { display: block; max-width: 100%; }
          .barcode svg { max-width: 100%; height: auto; }
          .sku-text {
            font-size: 6.5px;
            font-weight: bold;
            text-align: center;
            letter-spacing: 0.3px;
            margin-top: 1px;
          }

          @media print {
            .top-bar { display: none !important; }
            body { background: white; }
            .label { border: none; margin: 0; }
            .print-area { padding: 0; gap: 0; display: block; }
          }
        </style>
      </head>
      <body>
        <div class="top-bar">
          <div style="display:flex; gap: 12px; align-items: center;">
            <button class="settings-toggle-btn" onclick="const p = document.getElementById('settings-panel'); p.style.display = p.style.display === 'none' ? 'flex' : 'none'">⚙️ Settings</button>
            <button class="print-btn" onclick="window.print()">🖨️ Print <span id="lcount">0</span> Labels</button>
          </div>
          <div id="settings-panel" style="display:none; gap: 12px; align-items: center; flex-wrap: wrap; margin-top: 12px; width: 100%;">
            <div class="settings-group">
              <span style="font-weight:bold; color:#a1a1aa; margin-right:4px;">Size (mm)</span>
              <label>W: <input type="number" id="pageW" value="${labelWidth}"></label>
              <label>H: <input type="number" id="pageH" value="${labelHeight}"></label>
            </div>
            <div class="settings-group">
              <span style="font-weight:bold; color:#a1a1aa; margin-right:4px;">Margins (mm)</span>
              <label>Left: <input type="number" id="padL" value="5.5" step="0.5"></label>
              <label>Top: <input type="number" id="padT" value="0.5" step="0.5"></label>
            </div>
            <div class="settings-group">
              <span style="font-weight:bold; color:#a1a1aa; margin-right:4px;">Barcode</span>
              <label>Height: <input type="number" id="barH" value="40" step="2"></label>
            </div>
            <div class="settings-group">
              <span style="font-weight:bold; color:#a1a1aa; margin-right:4px;">Content</span>
              <label><input type="checkbox" id="showCat" checked> Category</label>
            </div>
          </div>
        </div>
        <div class="print-area">
          ${labelsHtml}
        </div>
        <script>
          function renderBarcodes() {
            const h = document.getElementById('barH').value;
            document.querySelectorAll('.barcode').forEach(function(el) {
              var sku = el.getAttribute('data-sku');
              JsBarcode(el, sku, {
                format: 'CODE128',
                width: 1.2,
                height: parseInt(h) || 40,
                fontSize: 0,
                margin: 0,
                displayValue: false
              });
            });
          }

          window.addEventListener('load', function() {
            renderBarcodes();
            document.getElementById('lcount').textContent = document.querySelectorAll('.label').length;

            // Live updates
            const root = document.documentElement;
            document.getElementById('pageW').addEventListener('input', e => {
              root.style.setProperty('--page-width', e.target.value + 'mm');
              // Update @page rule dynamically
              const style = document.createElement('style');
              style.innerHTML = \`@page { size: \${e.target.value}mm \${document.getElementById('pageH').value}mm; }\`;
              document.head.appendChild(style);
            });
            document.getElementById('pageH').addEventListener('input', e => {
              root.style.setProperty('--page-height', e.target.value + 'mm');
              const style = document.createElement('style');
              style.innerHTML = \`@page { size: \${document.getElementById('pageW').value}mm \${e.target.value}mm; }\`;
              document.head.appendChild(style);
            });
            document.getElementById('padL').addEventListener('input', e => root.style.setProperty('--pad-left', e.target.value + 'mm'));
            document.getElementById('padT').addEventListener('input', e => root.style.setProperty('--pad-top', e.target.value + 'mm'));
            document.getElementById('barH').addEventListener('change', renderBarcodes);
            
            document.getElementById('showCat').addEventListener('change', e => {
              const display = e.target.checked ? 'inline' : 'none';
              document.querySelectorAll('.cat-wrapper').forEach(el => {
                el.style.display = display;
              });
            });
          });
        <\/script>
      </body>
      </html>
    `);
    popup.document.close();
  };

  useEffect(() => {
    async function load() {
      const res = await getGRNById(params.id as string);
      if (res.success) setGrn(res.data);
      else toast.error('Failed to load GRN');

      const config = await getPOSConfig();
      setPosConfig(config);

      setLoading(false);
    }
    load();
  }, [params.id]);

  const handleSubmitGRN = async () => {
    if (!confirm('Are you sure you want to Submit this GRN? This will IMMUTABLY update the Stock Ledger and product stock quantities. This action cannot be undone.')) return;

    setActionLoading(true);
    const res = await submitGRN(grn.id);
    setActionLoading(false); // End loading first

    if (res.success) {
      toast.success('Goods Receive Note Submitted & Locked successfully!');
      setGrn({ ...grn, status: 'SUBMITTED' });
      
      // Delay the modal slightly to ensure DOM updates and router.refresh don't clash
      setTimeout(() => {
        setShowPrintModal(true);
        router.refresh();
      }, 300);
    } else {
      toast.error(res.error || 'Failed to submit GRN');
    }
  };

  if (loading) {
    return <div className="flex h-[400px] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  if (!grn) {
    return <div className="p-12 text-center text-muted-foreground">GRN not found.</div>;
  }



  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'secondary';
      case 'SUBMITTED': return 'success';
      case 'CANCELLED': return 'destructive';
      default: return 'secondary';
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6 pb-24 max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b py-3 -mx-6 px-6 shadow-sm">
        <div className="flex items-center gap-3">
          <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => router.push('/admin/inventory/grn')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold font-mono">{grn.grnNumber}</h1>
              <Badge variant={getStatusColor(grn.status) as any} className="text-[10px] uppercase">
                {grn.status === 'SUBMITTED' ? <><Lock className="mr-1 h-3 w-3" /> LOCKED</> : grn.status}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">Received on {new Date(grn.receivedDate).toLocaleString()}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePrintLabels}>
            <Printer className="mr-2 h-4 w-4" /> Print Labels
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" /> Print GRN
          </Button>

          {grn.status === 'DRAFT' && (
            <Button size="sm" onClick={handleSubmitGRN} disabled={actionLoading} className="bg-green-600 hover:bg-green-700">
              {actionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
              Submit & Lock Ledger
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Details */}
        <div className="md:col-span-2 space-y-6">
          <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
            <div className="p-4 border-b bg-muted/20">
              <h3 className="font-semibold text-sm">Received Items</h3>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead className="text-center">Received</TableHead>
                  <TableHead className="text-center">Rejected</TableHead>
                  <TableHead className="text-center bg-green-500/5 text-green-700">Accepted</TableHead>
                  <TableHead>Identifications</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {grn.items.map((item: any) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="font-medium text-sm"><Link href={`/admin/products/${item.productId}`} className="hover:underline text-primary">{item.product.name}</Link></div>
                      {item.variant && <div className="text-xs text-muted-foreground">{item.variant.name}</div>}
                      <div className="text-[10px] font-mono text-muted-foreground">{item.variant?.sku || item.product.sku}</div>
                    </TableCell>
                    <TableCell className="text-center font-mono">{item.receivedQty}</TableCell>
                    <TableCell className="text-center font-mono text-red-500">{item.rejectedQty > 0 ? item.rejectedQty : '-'}</TableCell>
                    <TableCell className="text-center font-bold font-mono text-green-700 bg-green-500/5">{item.acceptedQty}</TableCell>
                    <TableCell>
                      {item.serialNumber && <div className="text-xs"><span className="text-muted-foreground">SN:</span> <span className="font-mono">{item.serialNumber}</span></div>}
                      {item.imei && <div className="text-xs"><span className="text-muted-foreground">IMEI:</span> <span className="font-mono">{item.imei}</span></div>}
                      {item.batchNumber && <div className="text-xs"><span className="text-muted-foreground">Batch:</span> <span className="font-mono">{item.batchNumber}</span></div>}
                      {!item.serialNumber && !item.imei && !item.batchNumber && <span className="text-muted-foreground text-xs">-</span>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="rounded-xl border bg-card p-5 shadow-sm space-y-4">
            <h3 className="font-semibold text-sm border-b pb-2">Reference Details</h3>
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-muted-foreground block text-xs">Purchase Order</span>
                <span className="font-mono font-medium"><Link href={`/admin/purchases/${grn.purchaseOrderId}`} className="text-primary hover:underline">{grn.purchaseOrder.poNumber}</Link></span>
              </div>
              <div>
                <span className="text-muted-foreground block text-xs">Supplier</span>
                <span className="font-medium"><Link href={`/admin/suppliers/${grn.supplierId}`} className="text-primary hover:underline">{grn.supplier.name}</Link></span>
              </div>
              <div>
                <span className="text-muted-foreground block text-xs">Receiving Warehouse</span>
                <span className="font-medium">{grn.warehouse?.name}</span>
              </div>
            </div>
          </div>

          {grn.note && (
            <div className="rounded-xl border bg-card p-5 shadow-sm space-y-2">
              <h3 className="font-semibold text-sm border-b pb-2">Receipt Notes</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{grn.note}</p>
            </div>
          )}
        </div>
      </div>

      {/* Print Confirmation Modal */}
      <AlertDialog open={showPrintModal} onOpenChange={setShowPrintModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>GRN Locked Successfully!</AlertDialogTitle>
            <AlertDialogDescription>
              The Goods Receive Note has been verified and locked into the ledger. Would you like to print barcode labels for these received items now?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowPrintModal(false)}>Maybe Later</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                setShowPrintModal(false);
                setTimeout(() => {
                  handlePrintLabels();
                }, 100);
              }}
              className="bg-green-600 hover:bg-green-700"
            >
              <Printer className="mr-2 h-4 w-4" /> Proceed to Print
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
