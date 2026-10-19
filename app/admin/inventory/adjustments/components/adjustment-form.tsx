'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Save,
  Loader2,
  Trash2,
  ClipboardCheck,
  ArrowLeft,
  Warehouse,
  FileText,
  Package,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createAdjustment, getSystemQtyForAdjustment } from '@/lib/actions/adjustment-actions';
import { ProductPicker, InventorySelection } from '../../components/product-picker';
import { useConfirm } from '@/components/providers/confirm-provider';

export type StockAdjustmentReason = 'COUNT' | 'DAMAGE' | 'THEFT' | 'EXPIRED';
type Item = InventorySelection & { systemQty: number; actualQty: number };

const REASONS: Record<StockAdjustmentReason, { label: string; hint: string }> = {
  COUNT: {
    label: 'Physical Count (Reconciliation)',
    hint: 'Enter total physically counted units. Stock can increase or decrease.',
  },
  DAMAGE: {
    label: 'Damaged Goods Write-Off',
    hint: 'Enter remaining usable units after removing damaged items.',
  },
  THEFT: {
    label: 'Lost or Stolen Write-Off',
    hint: 'Enter remaining usable units after accounting for missing stock.',
  },
  EXPIRED: {
    label: 'Expired Goods Write-Off',
    hint: 'Enter remaining usable units after removing expired stock.',
  },
};

export function AdjustmentForm({ warehouses }: { warehouses: { id: string; name: string }[] }) {
  const router = useRouter();
  const confirm = useConfirm();
  const [warehouseId, setWarehouseId] = useState(warehouses[0]?.id || '');
  const [reason, setReason] = useState<StockAdjustmentReason>('COUNT');
  const [note, setNote] = useState('');
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);

  const changed = items.filter((i) => Number.isFinite(i.actualQty) && i.actualQty !== i.systemQty);
  const added = changed.reduce((sum, i) => sum + Math.max(0, i.actualQty - i.systemQty), 0);
  const removed = changed.reduce((sum, i) => sum + Math.max(0, i.systemQty - i.actualQty), 0);
  const invalid = items.some(
    (i) =>
      !Number.isSafeInteger(i.actualQty) ||
      i.actualQty < 0 ||
      (reason !== 'COUNT' && i.actualQty > i.systemQty)
  );

  async function changeWarehouse(value: string) {
    if (
      items.length &&
      !(await confirm('Changing warehouse clears this count sheet. Continue with a new count?'))
    ) {
      return;
    }
    setWarehouseId(value);
    setItems([]);
  }

  async function addItem(selection: InventorySelection) {
    if (
      items.some(
        (i) => i.productId === selection.productId && i.variantId === selection.variantId
      )
    ) {
      throw new Error('This item is already in your count sheet.');
    }
    setAdding(true);
    try {
      const result = await getSystemQtyForAdjustment(
        selection.productId,
        selection.variantId,
        warehouseId
      );
      if (!result.success) throw new Error(result.error || 'Could not load warehouse stock.');
      setItems((prev) => [
        ...prev,
        { ...selection, systemQty: result.qty, actualQty: result.qty },
      ]);
      toast.success(`Added ${selection.name}`);
    } finally {
      setAdding(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (loading || invalid || !changed.length || !note.trim()) return;
    setLoading(true);
    try {
      const result = await createAdjustment({
        warehouseId,
        reason,
        note,
        items: changed.map((i) => ({ ...i, adjustedQty: i.actualQty - i.systemQty })),
      });
      if (!result.success || !result.id) throw new Error(result.message);
      toast.success('Count saved as a draft. Review it before applying the stock adjustment.');
      router.push(`/admin/inventory/adjustments/${result.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not save adjustment.');
    } finally {
      setLoading(false);
    }
  }

  if (!warehouses.length) {
    return (
      <div className="p-10 border rounded-2xl bg-card text-center space-y-4 max-w-lg mx-auto my-8">
        <div className="h-12 w-12 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto">
          <Warehouse className="h-6 w-6" />
        </div>
        <h2 className="text-lg font-bold">Create a warehouse before counting stock</h2>
        <p className="text-sm text-muted-foreground">
          You need at least one active warehouse location to record physical stock counts or adjustments.
        </p>
        <Button asChild>
          <Link href="/admin/inventory/warehouses/new">Add Warehouse</Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      {/* Top Action Header Card */}
      <div className="rounded-xl border bg-card p-4 sm:px-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-9 w-9 rounded-lg shrink-0"
            onClick={() => router.push('/admin/inventory/adjustments')}
            aria-label="Back to adjustments"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
                New Stock Adjustment & Count
              </h1>
              <Badge variant="outline" className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20 text-xs">
                Draft Mode
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Count physical usable stock → review calculated variance → approve to post to Stock Ledger
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-lg border">
          <CheckCircle2 className="h-3.5 w-3.5 text-indigo-600" />
          <span>Stock updates only after final approval</span>
        </div>
      </div>

      <fieldset
        disabled={loading || adding}
        className="grid gap-6 lg:grid-cols-[1fr_340px] disabled:opacity-70"
      >
        {/* Left Main Area */}
        <div className="space-y-6 min-w-0">
          {/* Warehouse & Reason Selection */}
          <section className="rounded-xl border bg-card p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-border/60">
              <Warehouse className="h-4 w-4 text-indigo-600" />
              <h2 className="font-semibold text-sm text-foreground">1. Select Location & Adjustment Type</h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Target Warehouse <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={warehouseId}
                  onValueChange={changeWarehouse}
                  disabled={loading || adding}
                >
                  <SelectTrigger aria-label="Warehouse to count" className="h-10 bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses.map((w) => (
                      <SelectItem value={w.id} key={w.id}>
                        {w.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Adjustment Reason <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={reason}
                  onValueChange={(value) => setReason(value as StockAdjustmentReason)}
                  disabled={loading || adding}
                >
                  <SelectTrigger aria-label="Adjustment reason" className="h-10 bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(REASONS).map(([value, info]) => (
                      <SelectItem value={value} key={value}>
                        {info.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="rounded-lg bg-muted/40 border px-3.5 py-2.5 text-xs text-muted-foreground flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-indigo-600 shrink-0" />
              <span>{REASONS[reason].hint}</span>
            </div>
          </section>

          {/* Product Picker & Count Sheet Table */}
          <section className="rounded-xl border bg-card p-5 shadow-xs space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-border/60">
              <div className="flex items-center gap-2">
                <ClipboardCheck className="h-4 w-4 text-indigo-600" />
                <div>
                  <h2 className="font-semibold text-sm text-foreground">2. Count Sheet</h2>
                </div>
              </div>
              {items.length > 0 && (
                <Badge variant="secondary" className="font-mono text-xs">
                  {items.length} {items.length === 1 ? 'item' : 'items'} listed
                </Badge>
              )}
            </div>

            {/* PO-style Product Search Box with Click-to-open Thumbnail Dropdown */}
            <ProductPicker disabled={!warehouseId || loading || adding} onSelect={addItem} />

            {/* Count Sheet Items */}
            {!items.length ? (
              <div className="border border-dashed rounded-xl py-12 px-4 text-center text-muted-foreground bg-muted/10">
                <div className="h-11 w-11 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                  <ClipboardCheck className="h-5 w-5 opacity-60" />
                </div>
                <p className="text-sm font-medium text-foreground">No products in count sheet yet</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                  Click the search box above to browse products with thumbnails or search by name/SKU to begin counting.
                </p>
              </div>
            ) : (
              <div className="rounded-xl border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-muted/40 text-xs uppercase text-muted-foreground border-b">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Product / Variant</th>
                        <th className="px-4 py-3 font-semibold text-center w-28">System Stock</th>
                        <th className="px-4 py-3 font-semibold text-center w-40">Counted / Usable</th>
                        <th className="px-4 py-3 font-semibold text-center w-28">Variance</th>
                        <th className="px-3 py-3 text-right w-12"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {items.map((item, index) => {
                        const delta = item.actualQty - item.systemQty;
                        const bad =
                          item.actualQty < 0 ||
                          !Number.isSafeInteger(item.actualQty) ||
                          (reason !== 'COUNT' && delta > 0);

                        return (
                          <tr
                            key={`${item.productId}:${item.variantId || ''}`}
                            className="hover:bg-muted/20 transition-colors"
                          >
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3 min-w-[200px]">
                                {item.image ? (
                                  <img
                                    src={item.image}
                                    alt={item.name}
                                    className="w-9 h-9 rounded-md object-cover border shrink-0 bg-background"
                                  />
                                ) : (
                                  <div className="w-9 h-9 rounded-md bg-muted flex items-center justify-center border shrink-0 text-muted-foreground">
                                    <Package className="w-4 h-4" />
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <p className="font-medium text-sm text-foreground truncate">
                                    {item.name}
                                  </p>
                                  <p className="text-xs font-mono text-muted-foreground">
                                    {item.sku || 'No SKU'}
                                  </p>
                                </div>
                              </div>
                              {bad && (
                                <p role="alert" className="text-xs text-destructive mt-1.5">
                                  Enter a non-negative whole number
                                  {reason !== 'COUNT' ? ' no greater than system stock' : ''}.
                                </p>
                              )}
                            </td>

                            <td className="px-4 py-3 text-center">
                              <Badge variant="outline" className="font-mono text-xs px-2.5 py-0.5">
                                {item.systemQty}
                              </Badge>
                            </td>

                            <td className="px-4 py-3">
                              <Input
                                id={`count-${index}`}
                                aria-label={`Counted quantity for ${item.name}`}
                                type="number"
                                min={0}
                                max={reason === 'COUNT' ? 2147483647 : item.systemQty}
                                step={1}
                                required
                                value={Number.isNaN(item.actualQty) ? '' : item.actualQty}
                                aria-invalid={bad}
                                onChange={(e) =>
                                  setItems((prev) =>
                                    prev.map((row, i) =>
                                      i === index
                                        ? {
                                            ...row,
                                            actualQty:
                                              e.target.value === '' ? NaN : Number(e.target.value),
                                          }
                                        : row
                                    )
                                  )
                                }
                                className="h-9 text-center font-mono font-semibold max-w-[120px] mx-auto bg-background"
                              />
                            </td>

                            <td className="px-4 py-3 text-center">
                              <span
                                className={`inline-flex items-center justify-center font-mono text-xs font-bold px-2.5 py-1 rounded-md ${
                                  Number.isNaN(delta)
                                    ? 'bg-muted text-muted-foreground'
                                    : delta < 0
                                    ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                                    : delta > 0
                                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                    : 'bg-muted text-muted-foreground'
                                }`}
                              >
                                {Number.isNaN(delta) ? '—' : delta > 0 ? `+${delta}` : delta}
                              </span>
                            </td>

                            <td className="px-3 py-3 text-right">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                aria-label={`Remove ${item.name}`}
                                onClick={() =>
                                  setItems((prev) => prev.filter((_, i) => i !== index))
                                }
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* Right Sticky Summary Sidebar */}
        <aside className="rounded-xl border bg-card p-5 shadow-xs space-y-5 h-fit lg:sticky lg:top-28">
          <div className="flex items-center gap-2 pb-3 border-b border-border/60">
            <FileText className="h-4 w-4 text-indigo-600" />
            <h2 className="font-semibold text-sm text-foreground">Adjustment Summary</h2>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-lg border bg-muted/20 p-2.5">
              <span className="block text-[10px] uppercase tracking-wider text-muted-foreground">
                Changed
              </span>
              <strong className="text-lg font-bold font-mono text-foreground">
                {changed.length}
              </strong>
            </div>
            <div className="rounded-lg border bg-emerald-500/5 border-emerald-500/20 p-2.5">
              <span className="block text-[10px] uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Added
              </span>
              <strong className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">
                +{added}
              </strong>
            </div>
            <div className="rounded-lg border bg-rose-500/5 border-rose-500/20 p-2.5">
              <span className="block text-[10px] uppercase tracking-wider text-rose-600 dark:text-rose-400">
                Removed
              </span>
              <strong className="text-lg font-bold font-mono text-rose-600 dark:text-rose-400">
                −{removed}
              </strong>
            </div>
          </div>

          <div className="space-y-2 pt-1">
            <Label htmlFor="count-note" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Audit Note / Count Reference <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="count-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              required
              rows={4}
              maxLength={2000}
              placeholder="Who performed the count, reason for discrepancy, or reference number…"
              className="text-sm bg-background resize-none"
            />
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Items with zero difference are automatically omitted. Approving the draft posts the net variance to the Stock Ledger.
            </p>
          </div>

          <div className="space-y-2.5 pt-2 border-t border-border/60">
            <Button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
              disabled={loading || adding || invalid || !changed.length || !note.trim()}
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save Adjustment Draft
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/admin/inventory/adjustments">Cancel & Back</Link>
            </Button>
          </div>
        </aside>
      </fieldset>
    </form>
  );
}
