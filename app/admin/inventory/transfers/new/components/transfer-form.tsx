'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, ArrowLeftRight, Loader2, Package, Trash2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  const total = items.reduce((sum, item) => sum + (Number.isFinite(item.quantity) ? item.quantity : 0), 0);
  const invalid = !items.length || items.some(i => !Number.isSafeInteger(i.quantity) || i.quantity < 1 || i.quantity > i.available);
  const source = warehouses.find(w => w.id === sourceId);
  const destination = warehouses.find(w => w.id === destinationId);

  async function changeSource(value: string) {
    if (items.length && !(await confirm('Changing the source clears the selected items because stock belongs to a specific warehouse. Continue?'))) return;
    setSourceId(value); setItems([]);
    if (value === destinationId) setDestinationId('');
  }
  async function addItem(selection: InventorySelection) {
    if (items.some(i => i.productId === selection.productId && i.variantId === selection.variantId)) throw new Error('This item is already in the transfer. Update its quantity below.');
    setAdding(true);
    try {
      const result = await getTransferStock(sourceId, selection.productId, selection.variantId);
      if (!result.success || result.available === undefined || result.physical === undefined) throw new Error(result.error || 'Could not load source stock.');
      if (result.available < 1) throw new Error('No unreserved stock available for this item at the source.');
      setItems(prev => [...prev, { ...selection, quantity: 1, available: result.available!, physical: result.physical! }]);
    } finally { setAdding(false); }
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (loading || invalid || !sourceId || !destinationId || sourceId === destinationId) return;
    setLoading(true);
    try {
      const result = await createTransfer({ sourceId, destinationId, note, items: items.map(i => ({ productId: i.productId, variantId: i.variantId, quantity: i.quantity })) });
      if (!result.success || !result.data) throw new Error(result.error || 'Could not create transfer.');
      toast.success('Transfer draft saved. Review and approve it before dispatch.');
      router.push(`/admin/inventory/transfers/${result.data.id}`);
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Could not save transfer.'); }
    finally { setLoading(false); }
  }
  if (warehouses.length < 2) return <div className="rounded-xl border border-dashed p-8 text-center space-y-3"><Package className="mx-auto h-9 w-9 text-muted-foreground" /><h2 className="font-semibold">Set up your transfer route</h2><p className="text-sm text-muted-foreground">You need at least two active warehouses to move stock.</p><Button asChild><Link href="/admin/inventory/warehouses/new">Add warehouse</Link></Button></div>;
  return <form onSubmit={submit} className="space-y-6">
    <div className="rounded-xl border bg-primary/5 p-4 flex flex-wrap gap-x-6 gap-y-2 text-sm"><strong>1. Create draft</strong><span className="text-muted-foreground">2. Approve & reserve</span><span className="text-muted-foreground">3. Dispatch stock</span><span className="text-muted-foreground">4. Confirm receipt</span></div>
    <fieldset disabled={loading || adding} className="grid gap-6 lg:grid-cols-[1fr_300px] disabled:opacity-70">
      <div className="space-y-6 min-w-0">
        <section className="rounded-xl border bg-card p-5 space-y-4"><h2 className="font-semibold flex gap-2 items-center"><ArrowLeftRight className="h-4 w-4" /> Transfer route</h2>
          <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label>From warehouse</Label><Select value={sourceId} onValueChange={changeSource} disabled={loading || adding}><SelectTrigger aria-label="Source warehouse"><SelectValue placeholder="Choose source" /></SelectTrigger><SelectContent>{warehouses.map(w => <SelectItem key={w.id} value={w.id}>{w.name} · {w.code}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-2"><Label>To warehouse</Label><Select value={destinationId} onValueChange={setDestinationId} disabled={loading || adding}><SelectTrigger aria-label="Destination warehouse"><SelectValue placeholder="Choose destination" /></SelectTrigger><SelectContent>{warehouses.filter(w => w.id !== sourceId).map(w => <SelectItem key={w.id} value={w.id}>{w.name} · {w.code}</SelectItem>)}</SelectContent></Select></div></div>
        </section>
        <section className="rounded-xl border bg-card p-5 space-y-4"><div><h2 className="font-semibold">Products to transfer</h2><p className="text-xs text-muted-foreground mt-1">Available quantities account for pending orders and approved transfers.</p></div>
          <ProductPicker disabled={!sourceId || loading || adding} onSelect={addItem} />
          {!items.length && <div className="rounded-lg border border-dashed py-10 text-center text-muted-foreground"><Package className="h-8 w-8 mx-auto mb-3 opacity-50" /><p className="text-sm">Search and add your first product</p></div>}
          {items.map((item, index) => <div key={`${item.productId}:${item.variantId || ''}`} className="rounded-lg border p-4 flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-40"><p className="font-medium text-sm">{item.name}</p><p className="font-mono text-xs text-muted-foreground">{item.sku}</p><p className="text-xs mt-2 text-muted-foreground">On hand: {item.physical} · <span className="text-emerald-700 dark:text-emerald-400">Available: {item.available}</span></p></div>
            <div className="w-28"><Label htmlFor={`qty-${index}`} className="text-xs">Transfer qty</Label><Input id={`qty-${index}`} type="number" min={1} max={item.available} step={1} required value={Number.isNaN(item.quantity) ? '' : item.quantity} onChange={e => setItems(prev => prev.map((row, i) => i === index ? { ...row, quantity: e.target.value === '' ? NaN : Number(e.target.value) } : row))} aria-invalid={item.quantity > item.available || item.quantity < 1} /></div>
            <Button variant="ghost" size="icon" type="button" aria-label={`Remove ${item.name}`} onClick={() => setItems(prev => prev.filter((_, i) => i !== index))}><Trash2 className="h-4 w-4 text-destructive" /></Button>
            {item.quantity > item.available && <p role="alert" className="w-full text-xs text-destructive">Quantity exceeds the available stock.</p>}
          </div>)}
        </section>
        <section className="rounded-xl border bg-card p-5 space-y-2"><Label htmlFor="transfer-note">Transfer note</Label><Textarea id="transfer-note" value={note} onChange={e => setNote(e.target.value)} placeholder="Reason for transfer, delivery instructions or a reference…" maxLength={2000} /></section>
      </div>
      <aside className="rounded-xl border bg-card p-5 space-y-5 h-fit lg:sticky lg:top-24"><h2 className="font-semibold">Transfer summary</h2><div className="text-sm space-y-2"><p>{source?.name || 'Source warehouse'}</p><ArrowRight className="h-4 w-4 text-muted-foreground" /><p>{destination?.name || 'Destination warehouse'}</p></div><div className="border-t pt-4 space-y-2 text-sm"><p className="flex justify-between"><span>Product lines</span><strong>{items.length}</strong></p><p className="flex justify-between"><span>Total units</span><strong>{total}</strong></p></div><p className="text-xs text-muted-foreground">Saving a draft does not move or reserve stock. Availability is checked again when you approve and dispatch.</p><Button type="submit" className="w-full" disabled={loading || adding || invalid || !sourceId || !destinationId}>{loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Save transfer draft</Button><Button asChild variant="outline" className="w-full"><Link href="/admin/inventory/transfers">Back to transfers</Link></Button></aside>
    </fieldset>
  </form>;
}
