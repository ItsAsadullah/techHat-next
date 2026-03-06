'use client';

import { useState, useEffect } from 'react';
import {
  Ticket, Plus, Trash2, Edit2, Search, Loader2, Save, X,
  CheckCircle2, XCircle, Percent, Tag, Calendar, RotateCcw,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Coupon {
  id: string;
  code: string;
  discount_type: 'PERCENTAGE' | 'FLAT';
  discount_value: number;
  min_order_amount: number;
  usage_limit: number;
  used_count: number;
  expires_at: string | null;
  is_active: boolean;
}

const EMPTY_FORM = {
  code: '',
  discount_type: 'FLAT' as 'PERCENTAGE' | 'FLAT',
  discount_value: '',
  min_order_amount: '',
  usage_limit: '100',
  expires_at: '',
  is_active: true,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function isExpired(dateStr: string | null) {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date();
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-BD', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function CouponSettingsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [filter, setFilter] = useState<'all' | 'active' | 'expired' | 'inactive'>('all');

  useEffect(() => { loadCoupons(); }, []);

  async function loadCoupons() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/coupons');
      if (res.ok) setCoupons(await res.json());
    } catch { toast.error('Failed to load coupons'); }
    setLoading(false);
  }

  function openAdd() {
    setEditId(null);
    setForm(EMPTY_FORM);
    setOpen(true);
  }

  function openEdit(c: Coupon) {
    setEditId(c.id);
    setForm({
      code: c.code,
      discount_type: c.discount_type,
      discount_value: String(c.discount_value),
      min_order_amount: String(c.min_order_amount),
      usage_limit: String(c.usage_limit),
      expires_at: c.expires_at ? new Date(c.expires_at).toISOString().slice(0, 10) : '',
      is_active: c.is_active,
    });
    setOpen(true);
  }

  async function handleSave() {
    if (!form.code.trim()) { toast.error('Coupon code is required'); return; }
    if (!form.discount_value || Number(form.discount_value) <= 0) { toast.error('Discount value must be > 0'); return; }
    if (form.discount_type === 'PERCENTAGE' && Number(form.discount_value) > 100) {
      toast.error('Percentage discount cannot exceed 100%'); return;
    }

    setSaving(true);
    try {
      const body = {
        code: form.code.toUpperCase().trim(),
        discount_type: form.discount_type,
        discount_value: Number(form.discount_value),
        min_order_amount: Number(form.min_order_amount) || 0,
        usage_limit: Number(form.usage_limit) || 100,
        expires_at: form.expires_at || null,
        is_active: form.is_active,
      };

      const url = editId ? `/api/admin/coupons/${editId}` : '/api/admin/coupons';
      const method = editId ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to save');

      toast.success(editId ? 'Coupon updated' : 'Coupon created');
      setOpen(false);
      loadCoupons();
    } catch (e: any) {
      toast.error(e.message);
    }
    setSaving(false);
  }

  async function handleDelete(id: string, code: string) {
    if (!confirm(`Delete coupon "${code}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/admin/coupons/${id}`, { method: 'DELETE' });
    if (res.ok) { toast.success('Coupon deleted'); loadCoupons(); }
    else toast.error('Failed to delete');
  }

  async function handleToggleActive(c: Coupon) {
    const res = await fetch(`/api/admin/coupons/${c.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...c, is_active: !c.is_active }),
    });
    if (res.ok) { loadCoupons(); }
    else toast.error('Failed to update');
  }

  // Filter + search
  const filtered = coupons.filter((c) => {
    const matchSearch = c.code.toLowerCase().includes(search.toLowerCase());
    if (!matchSearch) return false;
    if (filter === 'active') return c.is_active && !isExpired(c.expires_at);
    if (filter === 'expired') return isExpired(c.expires_at ?? null);
    if (filter === 'inactive') return !c.is_active;
    return true;
  });

  const totalUsed = coupons.reduce((s, c) => s + c.used_count, 0);
  const activeCoupons = coupons.filter((c) => c.is_active && !isExpired(c.expires_at));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-100 rounded-xl">
            <Ticket className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Coupon Management</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {coupons.length} total · {activeCoupons.length} active · {totalUsed} uses
            </p>
          </div>
        </div>
        <Button onClick={openAdd} className="bg-amber-500 hover:bg-amber-600 text-white rounded-xl gap-2">
          <Plus className="w-4 h-4" /> New Coupon
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Coupons', value: coupons.length, color: 'text-gray-900' },
          { label: 'Active', value: activeCoupons.length, color: 'text-green-600' },
          { label: 'Expired / Inactive', value: coupons.length - activeCoupons.length, color: 'text-red-500' },
          { label: 'Total Uses', value: totalUsed, color: 'text-blue-600' },
        ].map((s) => (
          <div key={s.label} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3">
            <p className="text-xs text-gray-400 font-medium">{s.label}</p>
            <p className={`text-lg font-bold mt-0.5 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filter + Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search coupon code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 rounded-xl"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(['all', 'active', 'expired', 'inactive'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize',
                filter === f
                  ? 'bg-gray-900 dark:bg-gray-700 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Ticket className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">No coupons found</p>
            <p className="text-xs mt-1">Click &quot;New Coupon&quot; to create your first discount code</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800">
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide">Code</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide">Discount</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide">Min Order</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide">Uses</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide">Expires</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide">Status</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                {filtered.map((c) => {
                  const expired = isExpired(c.expires_at);
                  const status = expired ? 'expired' : c.is_active ? 'active' : 'inactive';
                  return (
                    <tr key={c.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/20 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-gray-900 dark:text-gray-100 tracking-widest">{c.code}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          'inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold',
                          c.discount_type === 'PERCENTAGE'
                            ? 'bg-violet-100 text-violet-700'
                            : 'bg-blue-100 text-blue-700'
                        )}>
                          {c.discount_type === 'PERCENTAGE' ? (
                            <><Percent className="w-3 h-3" />{c.discount_value}%</>
                          ) : (
                            <><Tag className="w-3 h-3" />৳{c.discount_value}</>
                          )}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                        {c.min_order_amount > 0 ? `৳${c.min_order_amount}` : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className="text-gray-900 dark:text-gray-100 font-medium">{c.used_count}</span>
                          <span className="text-gray-400 text-xs">/ {c.usage_limit}</span>
                        </div>
                        <div className="w-16 h-1 bg-gray-100 dark:bg-gray-700 rounded-full mt-1 overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full"
                            style={{ width: `${Math.min((c.used_count / c.usage_limit) * 100, 100)}%` }}
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          <Calendar className="w-3.5 h-3.5" />
                          <span className={expired ? 'text-red-500 font-medium' : ''}>{formatDate(c.expires_at)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold',
                          status === 'active' && 'bg-green-100 text-green-700',
                          status === 'expired' && 'bg-orange-100 text-orange-700',
                          status === 'inactive' && 'bg-gray-100 text-gray-500',
                        )}>
                          {status === 'active' && <CheckCircle2 className="w-3 h-3" />}
                          {status === 'expired' && <RotateCcw className="w-3 h-3" />}
                          {status === 'inactive' && <XCircle className="w-3 h-3" />}
                          {status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Switch
                            checked={c.is_active}
                            onCheckedChange={() => handleToggleActive(c)}
                            className="scale-75"
                          />
                          <button
                            onClick={() => openEdit(c)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(c.id, c.code)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle>{editId ? 'Edit Coupon' : 'Create New Coupon'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Code */}
            <div className="space-y-1.5">
              <Label>Coupon Code <span className="text-red-500">*</span></Label>
              <Input
                placeholder="e.g. TECHHAT100"
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                className="rounded-xl font-mono tracking-wider uppercase"
              />
              <p className="text-xs text-gray-400">Will be auto-uppercased. Customers enter this at checkout.</p>
            </div>

            {/* Discount Type */}
            <div className="space-y-1.5">
              <Label>Discount Type <span className="text-red-500">*</span></Label>
              <div className="grid grid-cols-2 gap-2">
                {(['FLAT', 'PERCENTAGE'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setForm((f) => ({ ...f, discount_type: type }))}
                    className={cn(
                      'flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-semibold transition-all',
                      form.discount_type === type
                        ? 'bg-gray-900 text-white border-gray-900'
                        : 'border-gray-200 text-gray-500 hover:border-gray-400'
                    )}
                  >
                    {type === 'FLAT' ? <><Tag className="w-3.5 h-3.5" /> Fixed (৳)</> : <><Percent className="w-3.5 h-3.5" /> Percent (%)</>}
                  </button>
                ))}
              </div>
            </div>

            {/* Discount Value + Min Order (2 cols) */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>
                  {form.discount_type === 'PERCENTAGE' ? 'Discount %' : 'Discount Amount (৳)'}
                  <span className="text-red-500"> *</span>
                </Label>
                <Input
                  type="number"
                  placeholder={form.discount_type === 'PERCENTAGE' ? '10' : '100'}
                  value={form.discount_value}
                  onChange={(e) => setForm((f) => ({ ...f, discount_value: e.target.value }))}
                  className="rounded-xl"
                  min="1"
                  max={form.discount_type === 'PERCENTAGE' ? '100' : undefined}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Min Order Amount (৳)</Label>
                <Input
                  type="number"
                  placeholder="500"
                  value={form.min_order_amount}
                  onChange={(e) => setForm((f) => ({ ...f, min_order_amount: e.target.value }))}
                  className="rounded-xl"
                  min="0"
                />
              </div>
            </div>

            {/* Usage Limit + Expiry (2 cols) */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Usage Limit</Label>
                <Input
                  type="number"
                  placeholder="100"
                  value={form.usage_limit}
                  onChange={(e) => setForm((f) => ({ ...f, usage_limit: e.target.value }))}
                  className="rounded-xl"
                  min="1"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Expiry Date</Label>
                <Input
                  type="date"
                  value={form.expires_at}
                  onChange={(e) => setForm((f) => ({ ...f, expires_at: e.target.value }))}
                  className="rounded-xl"
                  min={new Date().toISOString().slice(0, 10)}
                />
              </div>
            </div>

            {/* Active toggle */}
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Coupon Active</p>
                <p className="text-xs text-gray-400">Inactive coupons cannot be applied at checkout</p>
              </div>
              <Switch
                checked={form.is_active}
                onCheckedChange={(v) => setForm((f) => ({ ...f, is_active: v }))}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 flex-row justify-end">
            <Button variant="outline" onClick={() => setOpen(false)} className="rounded-xl" disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving} className="bg-amber-500 hover:bg-amber-600 text-white rounded-xl gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {editId ? 'Save Changes' : 'Create Coupon'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
