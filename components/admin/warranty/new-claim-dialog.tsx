'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  ShieldCheck, Package, User, Phone, Tag, Calendar, Hash,
  CheckCircle2, Check, Loader2, AlertTriangle, ChevronRight
} from 'lucide-react';
import { createWarrantyClaim } from '@/lib/actions/warranty-actions';

// ── Accessories List ──────────────────────────────────────────────────────────

const ALL_ACCESSORIES = [
  { id: 'Box',       label: 'Original Box',    emoji: '📦' },
  { id: 'Charger',   label: 'Charger',         emoji: '🔌' },
  { id: 'Cable',     label: 'USB Cable',        emoji: '🔗' },
  { id: 'Adapter',   label: 'Adapter',          emoji: '🔋' },
  { id: 'Manual',    label: 'User Manual',      emoji: '📖' },
  { id: 'Earbuds',   label: 'Earbuds',         emoji: '🎧' },
  { id: 'SIM Tray',  label: 'SIM Tray',        emoji: '📌' },
  { id: 'Remote',    label: 'Remote',           emoji: '📡' },
];

const ISSUE_CATEGORIES = [
  'Display Issue', 'Battery Issue', 'Charging Issue', 'Speaker Issue',
  'Microphone Issue', 'Camera Issue', 'Bluetooth Issue', 'Software Issue',
  'Water Damage', 'Physical Damage', 'Dead Unit', 'Other',
];

// ── Props ─────────────────────────────────────────────────────────────────────

interface NewClaimDialogProps {
  product: any;               // from ProductFinder
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// ── Main Component ────────────────────────────────────────────────────────────

export function NewClaimDialog({ product, open, onClose, onSuccess }: NewClaimDialogProps) {
  const [loading, setLoading] = useState(false);
  const [issueCategory, setIssueCategory] = useState('Display Issue');
  const [issueDescription, setIssueDescription] = useState('');
  const [accessoriesReceived, setAccessoriesReceived] = useState<string[]>([]);
  const [condition, setCondition] = useState('Good');
  const [remarks, setRemarks] = useState('');
  const [customerWillPay, setCustomerWillPay] = useState(false);
  const [customerChargeAmount, setCustomerChargeAmount] = useState('');

  const toggleAccessory = (id: string) =>
    setAccessoriesReceived(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );

  const accessoriesMissing = ALL_ACCESSORIES.filter(a => !accessoriesReceived.includes(a.id)).map(a => a.id);

  const handleSubmit = async () => {
    if (!issueDescription.trim()) return toast.error('Please describe the issue.');

    setLoading(true);
    const res = await createWarrantyClaim({
      orderId: product.orderId,
      productId: product.productId,
      variantId: product.variantId || null,
      serialNumber: product.serialNumber || null,
      imei: product.imei || null,
      warrantyType: product.warrantyType || 'Official Warranty',
      purchaseDate: product.purchaseDate,
      warrantyExpiry: product.warrantyExpiry || null,
      issueCategory,
      issueDescription,
      accessoriesReceived,
      accessoriesMissing,
      condition,
      remarks,
      customerChargeAmount: customerWillPay ? parseFloat(customerChargeAmount) || 0 : 0,
    });
    setLoading(false);

    if (res.success) {
      toast.success(`Claim ${res.claim?.claimNumber} registered successfully!`);
      onSuccess();
      onClose();
    } else {
      toast.error(res.error || 'Failed to register claim.');
    }
  };

  const warrantyDaysLeft = product?.warrantyRemainingDays || 0;
  const warrantyExpired = warrantyDaysLeft <= 0;

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:w-[520px] p-0 flex flex-col overflow-hidden">

        {/* ── Header ── */}
        <SheetHeader className="shrink-0 border-b border-slate-200 px-5 py-4">
          <SheetTitle className="flex items-center gap-2 text-base font-extrabold">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            New Warranty Claim
          </SheetTitle>
        </SheetHeader>

        {/* ── Scrollable Body ── */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-5 space-y-5">

            {/* ── Product Card (Auto-filled) ── */}
            <div className="bg-slate-900 rounded-2xl p-4 text-white space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Product</p>
                  <p className="font-extrabold text-sm leading-snug mt-0.5">{product?.productName}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{product?.brandName}{product?.variantName ? ` · ${product?.variantName}` : ''}</p>
                </div>
                <div className={cn(
                  'shrink-0 text-[10px] font-black px-2.5 py-1 rounded-full border whitespace-nowrap',
                  warrantyExpired ? 'bg-red-900/50 border-red-500 text-red-300' : 'bg-emerald-900/50 border-emerald-500 text-emerald-300'
                )}>
                  {warrantyExpired ? '⚠ Expired' : `${warrantyDaysLeft}d left`}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                {product?.serialNumber && (
                  <div className="bg-white/5 rounded-lg p-2">
                    <p className="text-slate-400 text-[9px] uppercase font-bold">Serial</p>
                    <p className="font-mono font-bold text-white truncate">{product.serialNumber}</p>
                  </div>
                )}
                {product?.imei && (
                  <div className="bg-white/5 rounded-lg p-2">
                    <p className="text-slate-400 text-[9px] uppercase font-bold">IMEI</p>
                    <p className="font-mono font-bold text-white truncate">{product.imei}</p>
                  </div>
                )}
                {product?.invoiceNumber && (
                  <div className="bg-white/5 rounded-lg p-2">
                    <p className="text-slate-400 text-[9px] uppercase font-bold">Invoice</p>
                    <p className="font-mono font-bold text-white truncate">{product.invoiceNumber}</p>
                  </div>
                )}
                {product?.purchaseDate && (
                  <div className="bg-white/5 rounded-lg p-2">
                    <p className="text-slate-400 text-[9px] uppercase font-bold">Purchase</p>
                    <p className="font-bold text-white">{new Date(product.purchaseDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                  </div>
                )}
              </div>
            </div>

            {/* ── Customer (Auto-filled, read-only) ── */}
            <div className="bg-slate-50 rounded-xl p-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-sm shrink-0">
                {(product?.customerName || 'C').charAt(0)}
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 leading-none">{product?.customerName}</p>
                <p className="text-xs text-slate-500 font-mono mt-0.5">{product?.customerPhone}</p>
              </div>
            </div>

            {warrantyExpired && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                <p className="text-xs font-bold text-red-700">Warranty has expired. Proceeding may void coverage.</p>
              </div>
            )}

            {/* ── Issue Category ── */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Issue Category *</label>
              <Select value={issueCategory} onValueChange={setIssueCategory}>
                <SelectTrigger className="h-11 rounded-xl text-sm font-semibold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ISSUE_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* ── Problem Description ── */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Problem Description *</label>
              <Textarea
                placeholder="Describe the issue exactly as reported by the customer..."
                className="min-h-[100px] rounded-xl resize-none text-sm"
                value={issueDescription}
                maxLength={500}
                onChange={e => setIssueDescription(e.target.value)}
              />
              <p className="text-[10px] text-slate-400 text-right">{issueDescription.length}/500</p>
            </div>

            {/* ── Physical Condition ── */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Product Condition</label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {['Excellent', 'Good', 'Used', 'Minor Scratch', 'Major Damage', 'Water Damage', 'Dead Unit'].map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCondition(c)}
                    className={cn(
                      'px-2 py-2 rounded-xl border-2 text-[11px] font-bold text-center transition-all leading-snug',
                      condition === c ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    )}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Accessories Checklist ── */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Accessories Checklist</label>
                <div className="text-[10px] font-semibold">
                  <span className="text-emerald-600">{accessoriesReceived.length} received</span>
                  <span className="text-slate-300 mx-1">·</span>
                  <span className="text-red-500">{accessoriesMissing.length} missing</span>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {ALL_ACCESSORIES.map(acc => {
                  const isChecked = accessoriesReceived.includes(acc.id);
                  return (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => toggleAccessory(acc.id)}
                      className={cn(
                        'p-3 rounded-xl border-2 text-left flex flex-col items-center gap-1.5 transition-all',
                        isChecked ? 'border-emerald-400 bg-emerald-50 shadow-sm' : 'border-slate-200 bg-white hover:border-red-200'
                      )}
                    >
                      <div className="flex items-start justify-between w-full">
                        <span className="text-base">{acc.emoji}</span>
                        <div className={cn('w-4 h-4 rounded-full border-2 flex items-center justify-center', isChecked ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300')}>
                          {isChecked && <Check className="w-2.5 h-2.5 text-white" />}
                        </div>
                      </div>
                      <span className={cn('text-[10px] font-bold leading-snug text-center', isChecked ? 'text-emerald-800' : 'text-slate-600')}>{acc.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── Customer Payment ── */}
            <div className="bg-slate-50 rounded-xl p-4 space-y-3 border border-slate-200">
              <label className="flex items-center gap-2 cursor-pointer">
                <div className={cn('w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all', customerWillPay ? 'bg-blue-600 border-blue-600' : 'bg-white border-slate-300')}>
                  {customerWillPay && <Check className="w-3.5 h-3.5 text-white" />}
                </div>
                <input type="checkbox" className="hidden" checked={customerWillPay} onChange={e => {
                  setCustomerWillPay(e.target.checked);
                  if (!e.target.checked) setCustomerChargeAmount('');
                }} />
                <span className="text-sm font-bold text-slate-800">Customer Will Pay (Service / Courier Charge)</span>
              </label>

              {customerWillPay && (
                <div className="pl-7 space-y-1.5 animate-in slide-in-from-top-2 duration-200">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Charge Amount (৳)</label>
                  <Input 
                    type="number" 
                    placeholder="e.g. 200" 
                    value={customerChargeAmount} 
                    onChange={e => setCustomerChargeAmount(e.target.value)}
                    className="h-10 rounded-xl text-sm max-w-[200px]"
                    min="0"
                  />
                  <p className="text-[10px] font-medium text-slate-500">This amount will be added to your Cash balance as Income.</p>
                </div>
              )}
            </div>

            {/* ── Remarks ── */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Remarks (Optional)</label>
              <Textarea placeholder="Any additional notes..." className="min-h-[60px] rounded-xl resize-none text-sm" value={remarks} onChange={e => setRemarks(e.target.value)} />
            </div>

          </div>
        </div>

        {/* ── Footer ── */}
        <div className="shrink-0 border-t border-slate-200 bg-white p-4 flex gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1 rounded-xl h-12 font-bold">Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading} className="flex-1 h-12 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><ShieldCheck className="w-4 h-4 mr-1.5" /> Register Claim</>}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
