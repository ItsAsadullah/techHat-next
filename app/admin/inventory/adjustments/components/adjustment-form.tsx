'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Save, Loader2, Trash2, ClipboardCheck } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createAdjustment, getSystemQtyForAdjustment } from '@/lib/actions/adjustment-actions';
import { ProductPicker, InventorySelection } from '../../components/product-picker';
import { useConfirm } from '@/components/providers/confirm-provider';

export type StockAdjustmentReason = 'COUNT' | 'DAMAGE' | 'THEFT' | 'EXPIRED';
type Item = InventorySelection & { systemQty: number; actualQty: number };
const reasons = { COUNT: 'Physical count', DAMAGE: 'Damaged goods', THEFT: 'Lost or stolen', EXPIRED: 'Expired goods' };
export function AdjustmentForm({ warehouses }: { warehouses: { id: string; name: string }[] }) {
  const router = useRouter();
  const confirm = useConfirm();
  const [warehouseId, setWarehouseId] = useState(warehouses[0]?.id || '');
  const [reason, setReason] = useState<StockAdjustmentReason>('COUNT');
  const [note, setNote] = useState('');
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const changed = items.filter(i => Number.isFinite(i.actualQty) && i.actualQty !== i.systemQty);
  const added = changed.reduce((sum, i) => sum + Math.max(0, i.actualQty - i.systemQty), 0);
  const removed = changed.reduce((sum, i) => sum + Math.max(0, i.systemQty - i.actualQty), 0);
  const invalid = items.some(i => !Number.isSafeInteger(i.actualQty) || i.actualQty < 0 || (reason !== 'COUNT' && i.actualQty > i.systemQty));
  async function changeWarehouse(value: string) {
    if (items.length && !(await confirm('Changing warehouse clears this count. Continue with a new count?'))) return;
    setWarehouseId(value); setItems([]);
  }
  async function addItem(selection: InventorySelection) {
    if (items.some(i => i.productId === selection.productId && i.variantId === selection.variantId)) throw new Error('This item is already in your count.');
    setAdding(true);
    try {
      const result = await getSystemQtyForAdjustment(selection.productId, selection.variantId, warehouseId);
      if (!result.success) throw new Error(result.error || 'Could not load warehouse stock.');
      setItems(prev => [...prev, { ...selection, systemQty: result.qty, actualQty: result.qty }]);
    } finally { setAdding(false); }
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (loading || invalid || !changed.length || !note.trim()) return;
    setLoading(true);
    try {
      const result = await createAdjustment({ warehouseId, reason, note, items: changed.map(i => ({ ...i, adjustedQty: i.actualQty - i.systemQty })) });
      if (!result.success || !result.id) throw new Error(result.message);
      toast.success('Count saved as a draft. Review it before applying the stock adjustment.');
      router.push(`/admin/inventory/adjustments/${result.id}`);
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Could not save adjustment.'); }
    finally { setLoading(false); }
  }
  if (!warehouses.length) return <div className="p-8 border rounded-xl text-center space-y-3"><h2 className="font-semibold">Create a warehouse before counting stock</h2><Button asChild><Link href="/admin/inventory/warehouses/new">Add warehouse</Link></Button></div>;
  return <form onSubmit={submit} className="space-y-6 max-w-6xl mx-auto">
    <div><h1 className="text-3xl font-bold tracking-tight">New stock adjustment</h1><p className="text-muted-foreground mt-2">Count the stock you can physically use, then review the difference before approval.</p></div>
    <div className="rounded-xl border bg-amber-500/5 p-4 text-sm"><strong>Count → Review → Approve.</strong> Stock changes only after approval. If stock moves after your count, a fresh count will be required.</div>
    <fieldset disabled={loading || adding} className="grid gap-6 lg:grid-cols-[1fr_300px] disabled:opacity-70">
      <div className="space-y-6 min-w-0">
        <section className="rounded-xl border bg-card p-5 grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label>Warehouse</Label><Select value={warehouseId} onValueChange={changeWarehouse} disabled={loading || adding}><SelectTrigger aria-label="Warehouse to count"><SelectValue /></SelectTrigger><SelectContent>{warehouses.map(w => <SelectItem value={w.id} key={w.id}>{w.name}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label>Reason</Label><Select value={reason} onValueChange={value => setReason(value as StockAdjustmentReason)} disabled={loading || adding}><SelectTrigger aria-label="Adjustment reason"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(reasons).map(([value, label]) => <SelectItem value={value} key={value}>{label}</SelectItem>)}</SelectContent></Select></div></section>
        <section className="rounded-xl border bg-card p-5 space-y-4"><div><h2 className="font-semibold">Count sheet</h2><p className="text-xs text-muted-foreground mt-1">{reason === 'COUNT' ? 'Enter the total units physically counted at this warehouse.' : 'Enter the usable units remaining after removing damaged, lost or expired goods.'}</p></div><ProductPicker disabled={!warehouseId || loading || adding} onSelect={addItem} />
          {!items.length && <div className="border border-dashed rounded-lg p-10 text-center text-muted-foreground"><ClipboardCheck className="h-8 w-8 mx-auto mb-3 opacity-50" /><p className="text-sm">Add products to start counting</p></div>}
          {items.map((item, index) => {
            const delta = item.actualQty - item.systemQty;
            const bad = item.actualQty < 0 || !Number.isSafeInteger(item.actualQty) || (reason !== 'COUNT' && delta > 0);
            return <div key={`${item.productId}:${item.variantId || ''}`} className="border rounded-lg p-4 space-y-3"><div className="flex items-start justify-between"><div><p className="font-medium text-sm">{item.name}</p><p className="text-xs font-mono text-muted-foreground">{item.sku}</p></div><Button type="button" variant="ghost" size="icon" aria-label={`Remove ${item.name}`} onClick={() => setItems(prev => prev.filter((_, i) => i !== index))}><Trash2 className="h-4 w-4 text-destructive" /></Button></div>
              <div className="grid grid-cols-3 gap-3 items-end"><div><p className="text-xs text-muted-foreground mb-2">System stock</p><p className="font-mono py-2">{item.systemQty}</p></div><div className="space-y-2"><Label htmlFor={`count-${index}`} className="text-xs">Counted / usable</Label><Input id={`count-${index}`} type="number" min={0} max={reason === 'COUNT' ? 2147483647 : item.systemQty} step={1} required value={Number.isNaN(item.actualQty) ? '' : item.actualQty} aria-invalid={bad} onChange={e => setItems(prev => prev.map((row, i) => i === index ? { ...row, actualQty: e.target.value === '' ? NaN : Number(e.target.value) } : row))} /></div><div><p className="text-xs text-muted-foreground mb-2">Difference</p><p className={`font-mono font-semibold py-2 ${delta < 0 ? 'text-red-600' : delta > 0 ? 'text-emerald-600' : ''}`}>{Number.isNaN(delta) ? '—' : delta > 0 ? `+${delta}` : delta}</p></div></div>
              {bad && <p role="alert" className="text-xs text-destructive">Enter a non-negative whole number{reason !== 'COUNT' ? ' no greater than the system stock' : ''}.</p>}
            </div>;
          })}
        </section>
      </div>
      <aside className="rounded-xl border bg-card p-5 space-y-5 h-fit lg:sticky lg:top-24"><h2 className="font-semibold">Adjustment summary</h2><div className="space-y-2 text-sm"><p className="flex justify-between"><span>Changed items</span><strong>{changed.length}</strong></p><p className="flex justify-between"><span>Units added</span><strong className="text-emerald-600">+{added}</strong></p><p className="flex justify-between"><span>Units removed</span><strong className="text-red-600">−{removed}</strong></p></div><div className="border-t pt-4 space-y-2"><Label htmlFor="count-note">Reason / count reference *</Label><Textarea id="count-note" value={note} onChange={e => setNote(e.target.value)} required maxLength={2000} placeholder="Who counted, what happened, and any supporting reference…" /></div><p className="text-xs text-muted-foreground">Unchanged items are omitted. Approval records the change in the stock ledger.</p><Button type="submit" className="w-full" disabled={loading || adding || invalid || !changed.length || !note.trim()}>{loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Save adjustment draft</Button><Button asChild variant="outline" className="w-full"><Link href="/admin/inventory/adjustments">Back to adjustments</Link></Button></aside>
    </fieldset>
  </form>;
}
