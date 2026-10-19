'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowRight,
  ArrowLeftRight,
  Loader2,
  Package,
  Trash2,
  Save,
  ArrowLeft,
  FileText,
  CheckCircle2,
  Warehouse as WarehouseIcon,
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
import { createTransfer, getTransferStock } from '@/lib/actions/transfer-actions';
import { ProductPicker, InventorySelection } from '../../../components/product-picker';
import { useConfirm } from '@/components/providers/confirm-provider';

type Item = InventorySelection & { quantity: number; available: number; physical: number };
type Warehouse = { id: string; name: string; code: string };

export function TransferForm({ warehouses }: { warehouses: Warehouse[] }) {
  const router = useRouter();
  const confirm = useConfirm();
  const [sourceId, setSourceId] = useState('');
  const [destinationId, setDestinationId] = useState('');
  const [note, setNote] = useState('');
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);

  const total = items.reduce(
    (sum, item) => sum + (Number.isFinite(item.quantity) ? item.quantity : 0),
    0
  );
  const invalid =
    !items.length ||
    items.some(
      (i) => !Number.isSafeInteger(i.quantity) || i.quantity < 1 || i.quantity > i.available
    );
  const source = warehouses.find((w) => w.id === sourceId);
  const destination = warehouses.find((w) => w.id === destinationId);

  async function changeSource(value: string) {
    if (
      items.length &&
      !(await confirm(
        'Changing the source warehouse clears the selected items because stock availability belongs to a specific warehouse. Continue?'
      ))
    ) {
      return;
    }
    setSourceId(value);
    setItems([]);
    if (value === destinationId) setDestinationId('');
  }

  async function addItem(selection: InventorySelection) {
    if (
      items.some(
        (i) => i.productId === selection.productId && i.variantId === selection.variantId
      )
    ) {
      throw new Error('This item is already in the transfer. Update its quantity below.');
    }
    setAdding(true);
    try {
      const result = await getTransferStock(
        sourceId,
        selection.productId,
        selection.variantId
      );
      if (!result.success || result.available === undefined || result.physical === undefined) {
        throw new Error(result.error || 'Could not load source stock.');
      }
      if (result.available < 1) {
        throw new Error('No unreserved stock available for this item at the source warehouse.');
      }
      setItems((prev) => [
        ...prev,
        {
          ...selection,
          quantity: 1,
          available: result.available!,
          physical: result.physical!,
        },
      ]);
      toast.success(`Added ${selection.name}`);
    } finally {
      setAdding(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (loading || invalid || !sourceId || !destinationId || sourceId === destinationId) return;
    setLoading(true);
    try {
      const result = await createTransfer({
        sourceId,
        destinationId,
        note,
        items: items.map((i) => ({
          productId: i.productId,
          variantId: i.variantId,
          quantity: i.quantity,
        })),
      });
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Could not create transfer.');
      }
      toast.success('Transfer draft saved. Review and approve it before dispatch.');
      router.push(`/admin/inventory/transfers/${result.data.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not save transfer.');
    } finally {
      setLoading(false);
    }
  }

  if (warehouses.length < 2) {
    return (
      <div className="rounded-2xl border bg-card p-10 text-center space-y-4 max-w-lg mx-auto my-8">
        <div className="h-12 w-12 rounded-full bg-blue-500/10 text-blue-600 flex items-center justify-center mx-auto">
          <Package className="h-6 w-6" />
        </div>
        <h2 className="text-lg font-bold">Set up your transfer route</h2>
        <p className="text-sm text-muted-foreground">
          You need at least two active warehouses to move stock between locations.
        </p>
        <Button asChild>
          <Link href="/admin/inventory/warehouses/new">Add Warehouse</Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      {/* Header Card */}
      <div className="rounded-xl border bg-card p-4 sm:px-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-9 w-9 rounded-lg shrink-0"
            onClick={() => router.push('/admin/inventory/transfers')}
            aria-label="Back to transfers"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
                New Warehouse Stock Transfer
              </h1>
              <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20 text-xs">
                Step 1: Draft
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              1. Create Draft → 2. Approve & Reserve → 3. Dispatch Goods → 4. Confirm Full Receipt
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-lg border">
          <CheckCircle2 className="h-3.5 w-3.5 text-indigo-600" />
          <span>Drafts do not move or reserve stock until approved</span>
        </div>
      </div>

      <fieldset
        disabled={loading || adding}
        className="grid gap-6 lg:grid-cols-[1fr_340px] disabled:opacity-70"
      >
        <div className="space-y-6 min-w-0">
          {/* Route Selection Card */}
          <section className="rounded-xl border bg-card p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-border/60">
              <ArrowLeftRight className="h-4 w-4 text-indigo-600" />
              <h2 className="font-semibold text-sm text-foreground">1. Select Transfer Route</h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  From Source Warehouse <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={sourceId}
                  onValueChange={changeSource}
                  disabled={loading || adding}
                >
                  <SelectTrigger aria-label="Source warehouse" className="h-10 bg-background">
                    <SelectValue placeholder="Choose source warehouse" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses.map((w) => (
                      <SelectItem key={w.id} value={w.id}>
                        {w.name} ({w.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  To Destination Warehouse <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={destinationId}
                  onValueChange={setDestinationId}
                  disabled={loading || adding}
                >
                  <SelectTrigger aria-label="Destination warehouse" className="h-10 bg-background">
                    <SelectValue placeholder="Choose destination warehouse" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses
                      .filter((w) => w.id !== sourceId)
                      .map((w) => (
                        <SelectItem key={w.id} value={w.id}>
                          {w.name} ({w.code})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>

          {/* Products to Transfer Card */}
          <section className="rounded-xl border bg-card p-5 shadow-xs space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-border/60">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-indigo-600" />
                <div>
                  <h2 className="font-semibold text-sm text-foreground">2. Products to Transfer</h2>
                </div>
              </div>
              {items.length > 0 && (
                <Badge variant="secondary" className="font-mono text-xs">
                  {items.length} {items.length === 1 ? 'line item' : 'line items'}
                </Badge>
              )}
            </div>

            <ProductPicker disabled={!sourceId || loading || adding} onSelect={addItem} />

            {!items.length ? (
              <div className="rounded-xl border border-dashed py-12 px-4 text-center text-muted-foreground bg-muted/10">
                <div className="h-11 w-11 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                  <Package className="h-5 w-5 opacity-60" />
                </div>
                <p className="text-sm font-medium text-foreground">
                  {sourceId
                    ? 'No products added to this transfer yet'
                    : 'Select a source warehouse first'}
                </p>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                  {sourceId
                    ? 'Click the search box above to choose products with thumbnails and check available stock.'
                    : 'Choose the source warehouse above so we can verify real-time stock availability.'}
                </p>
              </div>
            ) : (
              <div className="rounded-xl border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-muted/40 text-xs uppercase text-muted-foreground border-b">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Product / Variant</th>
                        <th className="px-4 py-3 font-semibold text-center w-28">On Hand</th>
                        <th className="px-4 py-3 font-semibold text-center w-28">Available</th>
                        <th className="px-4 py-3 font-semibold text-center w-36">Transfer Qty</th>
                        <th className="px-3 py-3 text-right w-12"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {items.map((item, index) => (
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
                            {item.quantity > item.available && (
                              <p role="alert" className="text-xs text-destructive mt-1.5">
                                Quantity exceeds available stock ({item.available}).
                              </p>
                            )}
                          </td>

                          <td className="px-4 py-3 text-center font-mono text-xs text-muted-foreground">
                            {item.physical}
                          </td>

                          <td className="px-4 py-3 text-center">
                            <Badge
                              variant="outline"
                              className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 font-mono text-xs"
                            >
                              {item.available}
                            </Badge>
                          </td>

                          <td className="px-4 py-3">
                            <Input
                              id={`qty-${index}`}
                              aria-label={`Transfer quantity for ${item.name}`}
                              type="number"
                              min={1}
                              max={item.available}
                              step={1}
                              required
                              value={Number.isNaN(item.quantity) ? '' : item.quantity}
                              onChange={(e) =>
                                setItems((prev) =>
                                  prev.map((row, i) =>
                                    i === index
                                      ? {
                                          ...row,
                                          quantity:
                                            e.target.value === '' ? NaN : Number(e.target.value),
                                        }
                                      : row
                                  )
                                )
                              }
                              aria-invalid={item.quantity > item.available || item.quantity < 1}
                              className="h-9 text-center font-mono font-semibold max-w-[110px] mx-auto bg-background"
                            />
                          </td>

                          <td className="px-3 py-3 text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              type="button"
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
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>

          {/* Note Section */}
          <section className="rounded-xl border bg-card p-5 shadow-xs space-y-2">
            <Label
              htmlFor="transfer-note"
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Transfer Note / Dispatch Instructions
            </Label>
            <Textarea
              id="transfer-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="Reason for transfer, courier/driver details, or internal reference…"
              maxLength={2000}
              className="text-sm bg-background resize-none"
            />
          </section>
        </div>

        {/* Right Summary Sidebar */}
        <aside className="rounded-xl border bg-card p-5 shadow-xs space-y-5 h-fit lg:sticky lg:top-28">
          <div className="flex items-center gap-2 pb-3 border-b border-border/60">
            <FileText className="h-4 w-4 text-indigo-600" />
            <h2 className="font-semibold text-sm text-foreground">Transfer Summary</h2>
          </div>

          <div className="rounded-xl border bg-muted/20 p-3.5 space-y-2.5 text-xs">
            <div className="flex items-center gap-2">
              <WarehouseIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <span className="block text-[10px] uppercase text-muted-foreground">From Source</span>
                <strong className="text-foreground truncate block">
                  {source ? `${source.name} (${source.code})` : 'Not selected'}
                </strong>
              </div>
            </div>
            <div className="pl-1.5">
              <ArrowRight className="h-3.5 w-3.5 text-indigo-600 rotate-90" />
            </div>
            <div className="flex items-center gap-2">
              <WarehouseIcon className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              <div className="min-w-0">
                <span className="block text-[10px] uppercase text-muted-foreground">To Destination</span>
                <strong className="text-foreground truncate block">
                  {destination ? `${destination.name} (${destination.code})` : 'Not selected'}
                </strong>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5 text-center">
            <div className="rounded-lg border bg-muted/20 p-3">
              <span className="block text-[10px] uppercase tracking-wider text-muted-foreground">
                Product Lines
              </span>
              <strong className="text-xl font-bold font-mono text-foreground">
                {items.length}
              </strong>
            </div>
            <div className="rounded-lg border bg-indigo-500/5 border-indigo-500/20 p-3">
              <span className="block text-[10px] uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Total Units
              </span>
              <strong className="text-xl font-bold font-mono text-indigo-600 dark:text-indigo-400">
                {total}
              </strong>
            </div>
          </div>

          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Saving a draft does not move or reserve stock. Stock availability is verified again upon approval and dispatch.
          </p>

          <div className="space-y-2.5 pt-2 border-t border-border/60">
            <Button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
              disabled={loading || adding || invalid || !sourceId || !destinationId}
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save Transfer Draft
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/admin/inventory/transfers">Cancel & Back</Link>
            </Button>
          </div>
        </aside>
      </fieldset>
    </form>
  );
}
