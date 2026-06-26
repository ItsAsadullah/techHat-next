'use client';

import { useState, useEffect } from 'react';
import { X, RotateCcw, Loader2, CheckCircle2, Package, Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { processReturn } from '@/lib/actions/return-actions';
import { toast } from 'sonner';
import type { ReturnCondition } from '@prisma/client';

// Hide admin mobile bottom nav when panel is open
function useHideMobileNav() {
  useEffect(() => {
    const nav = document.getElementById('admin-bottom-nav');
    if (nav) nav.style.display = 'none';
    return () => { if (nav) nav.style.display = ''; };
  }, []);
}

const REASONS = [
  'Defective Product',
  'Damaged in Transit',
  'Wrong Item Sold',
  'Customer Changed Mind',
  'Warranty Claim',
  'Other',
];

const CONDITIONS: { label: string; value: ReturnCondition }[] = [
  { label: 'Sealed / Unopened', value: 'SEALED' },
  { label: 'Like New', value: 'LIKE_NEW' },
  { label: 'Good Condition', value: 'GOOD' },
  { label: 'Used', value: 'USED' },
  { label: 'Damaged', value: 'DAMAGED' },
  { label: 'Defective', value: 'DEFECTIVE' },
  { label: 'Needs Inspection', value: 'NEEDS_INSPECTION' },
];

type RefundMethod = 'CASH' | 'CARD' | 'MOBILE_BANKING' | 'STORE_CREDIT';

const REFUND_METHODS: { label: string; value: RefundMethod; icon: string }[] = [
  { label: 'Cash', value: 'CASH', icon: '💵' },
  { label: 'Mobile Banking', value: 'MOBILE_BANKING', icon: '📱' },
  { label: 'Card', value: 'CARD', icon: '💳' },
  { label: 'Store Credit', value: 'STORE_CREDIT', icon: '🏷️' },
];

export default function ReturnSidePanel({
  order,
  item,
  onClose,
  onSuccess,
}: {
  order: any;
  item: any;
  onClose: () => void;
  onSuccess: () => void;
}) {
  useHideMobileNav();
  const maxQty = item.availableToReturn ?? item.quantity;
  const [returnQty, setReturnQty] = useState(1);
  const [reason, setReason] = useState(REASONS[0]);
  const [condition, setCondition] = useState<ReturnCondition>('GOOD');
  const [refundMethod, setRefundMethod] = useState<RefundMethod>('CASH');
  const [restockingFeePercent, setRestockingFeePercent] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Custom Price states ────────────────────────────────────────────────────
  const [customUnitPrice, setCustomUnitPrice] = useState<number | null>(null);
  const [isEditingPrice, setIsEditingPrice] = useState(false);
  const [priceInput, setPriceInput] = useState('');

  const unitPrice = customUnitPrice !== null ? customUnitPrice : item.unitPrice;
  const rawRefund = returnQty * unitPrice;
  const restockingFee = rawRefund * (restockingFeePercent / 100);
  const finalRefund = rawRefund - restockingFee;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const res = await processReturn({
      orderId: order.id,
      type: 'PARTIAL',
      reason,
      refundMethod,
      restockingFeePercent,
      storeCreditAmount: refundMethod === 'STORE_CREDIT' ? finalRefund : 0,
      refundToWallet: refundMethod === 'STORE_CREDIT',
      items: [{
        productId: item.productId,
        variantId: item.variantId,
        quantity: returnQty,
        unitPrice: unitPrice,
        condition,
        reason,
      }],
    });
    setIsSubmitting(false);
    if (res.success) {
      toast.success(`Return ${res.returnNumber} processed successfully!`);
      onSuccess();
    } else {
      toast.error(res.error || 'Failed to process return');
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex">
      {/* Backdrop */}
      <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="w-full max-w-md bg-white shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-blue-600 text-white px-5 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <RotateCcw className="w-5 h-5" />
            <div>
              <h2 className="font-bold text-base">Process Return</h2>
              <p className="text-blue-200 text-xs">{order.orderNumber}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">

          {/* Product Info */}
          <div className="bg-gray-50 rounded-xl p-4 flex items-center gap-3">
            <div className="w-12 h-12 bg-white rounded-xl border border-gray-200 flex items-center justify-center shrink-0">
              <Package className="w-6 h-6 text-gray-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-gray-900 text-sm leading-tight line-clamp-1">{item.productName}</p>
              {item.variant?.name && <p className="text-xs text-gray-500">{item.variant.name}</p>}
              {isEditingPrice ? (
                <div className="flex items-center gap-1 mt-1">
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={priceInput}
                    onChange={(e) => setPriceInput(e.target.value)}
                    className="h-7 w-20 text-xs px-2"
                  />
                  <Button
                    size="xs"
                    className="h-7 px-2 bg-green-600 hover:bg-green-700 text-white text-[10px] font-semibold"
                    onClick={() => {
                      const val = parseFloat(priceInput) || 0;
                      if (val > 0) {
                        setCustomUnitPrice(val);
                        setIsEditingPrice(false);
                      }
                    }}
                  >
                    Save
                  </Button>
                  <Button
                    size="xs"
                    variant="ghost"
                    className="h-7 px-2 text-[10px] font-semibold text-gray-500 hover:bg-gray-100"
                    onClick={() => {
                      setIsEditingPrice(false);
                      setPriceInput('');
                    }}
                  >
                    Cancel
                  </Button>
                  {customUnitPrice !== null && (
                    <Button
                      size="xs"
                      variant="ghost"
                      className="h-7 px-2 text-[10px] font-semibold text-blue-600 hover:bg-blue-50"
                      onClick={() => {
                        setCustomUnitPrice(null);
                        setIsEditingPrice(false);
                        setPriceInput('');
                      }}
                    >
                      Reset
                    </Button>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-1.5 mt-0.5">
                  <p className="text-xs text-gray-500">
                    Unit Price: <strong>৳{unitPrice?.toLocaleString()}</strong> &nbsp;·&nbsp; Sold: <strong>{item.quantity}</strong>
                  </p>
                  <button
                    onClick={() => {
                      setIsEditingPrice(true);
                      setPriceInput(String(unitPrice));
                    }}
                    className="text-[10px] text-blue-600 hover:text-blue-800 font-semibold px-1 py-0.5 rounded border border-blue-100 bg-white leading-none hover:bg-blue-50"
                  >
                    Edit
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Return Quantity */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Return Quantity</label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setReturnQty(q => Math.max(1, q - 1))}
                className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>
              <div className="flex-1 text-center">
                <span className="text-2xl font-bold text-gray-900">{returnQty}</span>
                <span className="text-sm text-gray-400 ml-1">/ {maxQty}</span>
              </div>
              <button
                onClick={() => setReturnQty(q => Math.min(maxQty, q + 1))}
                className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Return Reason</label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="z-[100]">
                {REASONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Condition */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Product Condition</label>
            <Select value={condition} onValueChange={(v) => setCondition(v as ReturnCondition)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="z-[100]">
                {CONDITIONS.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-400">Condition determines which warehouse the item is restocked in.</p>
          </div>

          {/* Restocking Fee */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Restocking Fee (Optional)</label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="0"
                max="100"
                value={restockingFeePercent || ''}
                onChange={(e) => setRestockingFeePercent(Number(e.target.value) || 0)}
                placeholder="0"
                className="w-24 text-center"
              />
              <span className="text-sm text-gray-500">%</span>
              {restockingFeePercent > 0 && (
                <span className="text-sm text-red-500 font-medium">= ৳{restockingFee.toFixed(0)}</span>
              )}
            </div>
          </div>

          {/* Refund Method */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Refund Method</label>
            <RadioGroup value={refundMethod} onValueChange={(v) => setRefundMethod(v as RefundMethod)} className="grid grid-cols-2 gap-2">
              {REFUND_METHODS.map(m => (
                <div key={m.value}>
                  <RadioGroupItem value={m.value} id={`rm-${m.value}`} className="sr-only" />
                  <Label
                    htmlFor={`rm-${m.value}`}
                    className={`flex items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all text-sm font-semibold ${
                      refundMethod === m.value
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                    }`}
                  >
                    <span className="text-lg">{m.icon}</span>
                    {m.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
            {refundMethod === 'STORE_CREDIT' && !order.userId && (
              <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded-lg">⚠️ Store Credit requires a registered customer account.</p>
            )}
          </div>

          {/* Refund Summary */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 space-y-2 border border-blue-100">
            <h4 className="text-sm font-bold text-gray-800 mb-3">Refund Summary</h4>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Refund Amount</span>
              <span className="font-semibold">৳{rawRefund.toLocaleString()}</span>
            </div>
            {restockingFeePercent > 0 && (
              <div className="flex justify-between text-sm text-red-600">
                <span>Restocking Fee ({restockingFeePercent}%)</span>
                <span>- ৳{restockingFee.toFixed(0)}</span>
              </div>
            )}
            <div className="border-t border-blue-200 pt-2 flex justify-between text-base font-bold">
              <span className="text-gray-800">Final Refund</span>
              <span className="text-blue-700 text-lg">৳{finalRefund.toLocaleString()}</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">via {REFUND_METHODS.find(m => m.value === refundMethod)?.label}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-100 flex gap-3 shrink-0">
          <Button variant="outline" onClick={onClose} className="flex-1 h-12">Cancel</Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || returnQty === 0}
            className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 font-bold text-base gap-2"
          >
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
            Confirm Return
          </Button>
        </div>
      </div>
    </div>
  );
}
