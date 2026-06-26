'use client';

import { useState, useEffect } from 'react';
import {
  X, ArrowLeftRight, Loader2, CheckCircle2, Package,
  AlertCircle, CheckCircle, ChevronDown, ChevronUp, Tag,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { processExchange } from '@/lib/actions/return-actions';
import { toast } from 'sonner';
import type { ReturnCondition } from '@prisma/client';
import Image from 'next/image';
import { ProductFinder, type FinderProduct } from '@/components/admin/shared/product-finder';
import { cn } from '@/lib/utils';

// ─── Constants ─────────────────────────────────────────────────────────────────

const CONDITIONS: { label: string; value: ReturnCondition }[] = [
  { label: 'Like New', value: 'LIKE_NEW' },
  { label: 'Good Condition', value: 'GOOD' },
  { label: 'Used', value: 'USED' },
  { label: 'Damaged', value: 'DAMAGED' },
  { label: 'Defective', value: 'DEFECTIVE' },
  { label: 'Needs Inspection', value: 'NEEDS_INSPECTION' },
];

type DeductionMode = 'none' | 'percent' | 'fixed';

interface SelectedVariant {
  id: string;
  name: string;
  price: number;
  stock: number;
  image: string | null;
}

// ─── Hide mobile nav when panel open ─────────────────────────────────────────

function useHideMobileNav() {
  useEffect(() => {
    const nav = document.getElementById('admin-bottom-nav');
    if (nav) nav.style.display = 'none';
    return () => { if (nav) nav.style.display = ''; };
  }, []);
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ExchangeSidePanel({
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

  const [condition, setCondition] = useState<ReturnCondition>('GOOD');
  const [selectedProduct, setSelectedProduct] = useState<FinderProduct | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<SelectedVariant | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Return value deduction (old product condition/depreciation) ────────────
  const [deductionMode, setDeductionMode] = useState<DeductionMode>('none');
  const [deductionValue, setDeductionValue] = useState('');
  const [showDeduction, setShowDeduction] = useState(false);

  // ── New product discount (POS-style ৳ or %) ───────────────────────────────
  const [showNewDiscount, setShowNewDiscount] = useState(false);
  const [newDiscountType, setNewDiscountType] = useState<'fixed' | 'percent'>('percent');
  const [newDiscountInput, setNewDiscountInput] = useState('');

  // ── Custom Price states ────────────────────────────────────────────────────
  const [customOldUnitPrice, setCustomOldUnitPrice] = useState<number | null>(null);
  const [isEditingOldPrice, setIsEditingOldPrice] = useState(false);
  const [oldPriceInput, setOldPriceInput] = useState('');

  const [customNewUnitPrice, setCustomNewUnitPrice] = useState<number | null>(null);
  const [isEditingNewPrice, setIsEditingNewPrice] = useState(false);
  const [newPriceInput, setNewPriceInput] = useState('');

  // ── Derived values ─────────────────────────────────────────────────────────

  const originalUnitPrice = item.unitPrice ?? 0;
  const oldUnitPrice = customOldUnitPrice !== null ? customOldUnitPrice : originalUnitPrice;
  const qty = item.quantity ?? 1;

  // Return value after deduction
  const deductionAmount = (() => {
    const val = parseFloat(deductionValue) || 0;
    if (deductionMode === 'percent') return Math.round((oldUnitPrice * qty * val) / 100);
    if (deductionMode === 'fixed') return Math.min(Math.round(val), oldUnitPrice * qty);
    return 0;
  })();
  const returnValue = Math.max(0, oldUnitPrice * qty - deductionAmount);
  const returnUnitPrice = qty > 0 ? returnValue / qty : 0;

  // New product base price
  const baseNewUnitPrice = (() => {
    if (selectedVariant) return selectedVariant.price;
    if (selectedProduct) return selectedProduct.offerPrice ?? selectedProduct.price;
    return 0;
  })();
  const newUnitPrice = customNewUnitPrice !== null ? customNewUnitPrice : baseNewUnitPrice;
  const baseNewTotal = newUnitPrice * qty;

  // New product discount
  const newDiscountAmount = (() => {
    const val = parseFloat(newDiscountInput) || 0;
    if (!selectedProduct || val <= 0) return 0;
    if (newDiscountType === 'percent') return Math.min(Math.round((baseNewTotal * val) / 100), baseNewTotal);
    return Math.min(Math.round(val), baseNewTotal);
  })();
  const newTotal = Math.max(0, baseNewTotal - newDiscountAmount);
  const newEffectiveUnitPrice = qty > 0 ? newTotal / qty : 0;
  const newStock = selectedVariant?.stock ?? selectedProduct?.stock ?? 0;

  // Final customer charge or refund
  const difference = newTotal - returnValue;

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleProductSelect = (product: FinderProduct, variantId?: string) => {
    setSelectedProduct(product);
    setNewDiscountInput('');
    setShowNewDiscount(false);
    setCustomNewUnitPrice(null);
    setIsEditingNewPrice(false);
    setNewPriceInput('');
    if (variantId) {
      const variant = product.variants.find((v) => v.id === variantId);
      if (variant) {
        setSelectedVariant({
          id: variant.id,
          name: variant.name,
          price: variant.offerPrice ?? variant.price,
          stock: variant.stock,
          image: variant.image,
        });
        return;
      }
    }
    setSelectedVariant(null);
  };

  const handleSubmit = async () => {
    if (!selectedProduct) return toast.error('Please select a new product.');
    if (selectedProduct.variants.length > 1 && !selectedVariant)
      return toast.error('Please select a variant.');
    if (newStock < qty)
      return toast.error('Insufficient stock for the selected product.');

    setIsSubmitting(true);
    const res = await processExchange({
      orderId: order.id,
      returnItem: {
        productId: item.productId,
        variantId: item.variantId,
        quantity: qty,
        unitPrice: returnUnitPrice,
        condition,
      },
      newProductId: selectedProduct.id,
      newVariantId: selectedVariant?.id,
      newProductPrice: newEffectiveUnitPrice,
      newProductName: selectedVariant
        ? `${selectedProduct.name} – ${selectedVariant.name}`
        : selectedProduct.name,
    });
    setIsSubmitting(false);

    if (res.success) {
      const msg =
        res.difference && res.difference !== 0
          ? `Exchange ${res.returnNumber} done! ${
              res.difference > 0
                ? `Collect ৳${Math.abs(res.difference).toLocaleString()} extra`
                : `Refund ৳${Math.abs(res.difference!).toLocaleString()}`
            }`
          : `Exchange ${res.returnNumber} processed!`;
      toast.success(msg);
      onSuccess();
    } else {
      toast.error(res.error || 'Failed to process exchange');
    }
  };

  const selectedImage = selectedVariant?.image ?? selectedProduct?.image;
  const productChosen = !!selectedProduct && (selectedProduct.variants.length <= 1 || !!selectedVariant);

  // ── UI ─────────────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-[60] flex">
      <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className={`w-full max-w-md bg-white shadow-2xl flex flex-col ${!selectedProduct ? 'overflow-visible' : 'overflow-hidden'}`}>

        {/* ── Header ───────────────────────────────────────────── */}
        <div className="bg-indigo-600 text-white px-5 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <ArrowLeftRight className="w-5 h-5" />
            <div>
              <h2 className="font-bold text-base">Process Exchange</h2>
              <p className="text-indigo-200 text-xs">{order.orderNumber}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Scrollable body ──────────────────────────────────── */}
        <div className={`flex-1 p-4 space-y-4 ${!selectedProduct ? 'overflow-visible' : 'overflow-y-auto'}`}>

          {/* ── OLD PRODUCT ─────────────────────────────────────── */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">Returning</p>
            <div className="bg-gray-50 rounded-xl p-3 flex items-center gap-3">
              <div className="w-11 h-11 bg-white rounded-xl border border-gray-200 flex items-center justify-center shrink-0 overflow-hidden">
                {item.product?.productImages?.[0]?.url || item.product?.images?.[0] ? (
                  <Image
                    src={item.product.productImages?.[0]?.url || item.product.images[0]}
                    alt={item.productName}
                    width={44}
                    height={44}
                    className="object-cover w-full h-full rounded-xl"
                  />
                ) : (
                  <Package className="w-5 h-5 text-gray-400" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-gray-900 text-sm line-clamp-1">{item.productName}</p>
                {isEditingOldPrice ? (
                  <div className="flex items-center gap-1 mt-1">
                    <Input
                      type="text"
                      inputMode="numeric"
                      value={oldPriceInput}
                      onChange={(e) => setOldPriceInput(e.target.value)}
                      className="h-7 w-20 text-xs px-2"
                    />
                    <Button
                      size="xs"
                      className="h-7 px-2 bg-green-600 hover:bg-green-700 text-white text-[10px] font-semibold"
                      onClick={() => {
                        const val = parseFloat(oldPriceInput) || 0;
                        if (val > 0) {
                          setCustomOldUnitPrice(val);
                          setIsEditingOldPrice(false);
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
                        setIsEditingOldPrice(false);
                        setOldPriceInput('');
                      }}
                    >
                      Cancel
                    </Button>
                    {customOldUnitPrice !== null && (
                      <Button
                        size="xs"
                        variant="ghost"
                        className="h-7 px-2 text-[10px] font-semibold text-blue-600 hover:bg-blue-50"
                        onClick={() => {
                          setCustomOldUnitPrice(null);
                          setIsEditingOldPrice(false);
                          setOldPriceInput('');
                        }}
                      >
                        Reset
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <p className="text-xs text-gray-500">
                      Qty: {qty} · ৳{oldUnitPrice.toLocaleString()} each
                    </p>
                    <button
                      onClick={() => {
                        setIsEditingOldPrice(true);
                        setOldPriceInput(String(oldUnitPrice));
                      }}
                      className="text-[10px] text-indigo-600 hover:text-indigo-800 font-semibold px-1 py-0.5 rounded border border-indigo-100 bg-white leading-none hover:bg-indigo-50"
                    >
                      Edit
                    </button>
                  </div>
                )}
              </div>
              <div className="text-right shrink-0">
                <span className="text-sm font-bold text-gray-700">
                  ৳{(oldUnitPrice * qty).toLocaleString()}
                </span>
                {deductionAmount > 0 && (
                  <p className="text-[10px] text-red-500 font-semibold mt-0.5">-৳{deductionAmount.toLocaleString()}</p>
                )}
              </div>
            </div>

            {/* Return deduction toggle */}
            <button
              type="button"
              onClick={() => setShowDeduction((v) => !v)}
              className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold text-gray-500 hover:text-indigo-600 transition-colors"
            >
              {showDeduction ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              {showDeduction ? 'Hide deduction' : 'Apply return value deduction (condition / depreciation)'}
            </button>

            {showDeduction && (
              <div className="mt-2 p-3 bg-orange-50 border border-orange-200 rounded-xl space-y-2.5">
                <p className="text-xs text-orange-700 font-semibold">
                  Deduct from return value ৳{(originalUnitPrice * qty).toLocaleString()}:
                </p>
                <div className="flex gap-2">
                  {[{ label: 'No deduction', value: 'none' }, { label: '% Percent', value: 'percent' }, { label: '৳ Fixed', value: 'fixed' }].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => { setDeductionMode(opt.value as DeductionMode); setDeductionValue(''); }}
                      className={cn(
                        'flex-1 text-[11px] font-semibold px-2 py-1.5 rounded-lg border transition-colors',
                        deductionMode === opt.value
                          ? 'bg-orange-500 text-white border-orange-500'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-orange-300'
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                {deductionMode !== 'none' && (
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <input
                        type="number"
                        min="0"
                        max={deductionMode === 'percent' ? 100 : undefined}
                        value={deductionValue}
                        onChange={(e) => setDeductionValue(e.target.value)}
                        placeholder={deductionMode === 'percent' ? 'e.g. 15' : 'e.g. 200'}
                        className="w-full h-9 px-3 pr-7 text-sm border border-orange-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-400"
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] font-bold text-orange-500">
                        {deductionMode === 'percent' ? '%' : '৳'}
                      </span>
                    </div>
                    {deductionAmount > 0 && (
                      <div className="shrink-0 text-right">
                        <p className="text-xs text-orange-600 font-bold">-৳{deductionAmount.toLocaleString()}</p>
                        <p className="text-[10px] text-gray-500">Return: ৳{returnValue.toLocaleString()}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── CONDITION ────────────────────────────────────────── */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700">Returned Item Condition</label>
            <Select value={condition} onValueChange={(v) => setCondition(v as ReturnCondition)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="z-[100]">
                {CONDITIONS.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* ── NEW PRODUCT FINDER ───────────────────────────────── */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">Select New Product</p>

            {!selectedProduct ? (
              <ProductFinder
                mode="exchange"
                onSelect={handleProductSelect}
                placeholder="Search by name, SKU, barcode..."
                showScanner={true}
                showCostPrice={false}
                excludeProductId={item.productId}
                contextBrandId={item.product?.brand?.id}
                contextCategoryId={item.product?.categoryId}
              />
            ) : (
              <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 flex items-center gap-3">
                <div className="w-11 h-11 bg-white rounded-lg shrink-0 border border-indigo-200 overflow-hidden flex items-center justify-center">
                  {selectedImage ? (
                    <Image src={selectedImage} alt={selectedProduct.name} width={44} height={44} className="object-cover w-full h-full" />
                  ) : (
                    <Package className="w-5 h-5 text-indigo-300" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-indigo-900 truncate">{selectedProduct.name}</p>
                  {selectedVariant && <p className="text-xs text-indigo-600 font-medium mt-0.5">{selectedVariant.name}</p>}
                  {isEditingNewPrice ? (
                    <div className="flex items-center gap-1 mt-1">
                      <Input
                        type="text"
                        inputMode="numeric"
                        value={newPriceInput}
                        onChange={(e) => setNewPriceInput(e.target.value)}
                        className="h-7 w-20 text-xs px-2"
                      />
                      <Button
                        size="xs"
                        className="h-7 px-2 bg-green-600 hover:bg-green-700 text-white text-[10px] font-semibold"
                        onClick={() => {
                          const val = parseFloat(newPriceInput) || 0;
                          if (val > 0) {
                            setCustomNewUnitPrice(val);
                            setIsEditingNewPrice(false);
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
                          setIsEditingNewPrice(false);
                          setNewPriceInput('');
                        }}
                      >
                        Cancel
                      </Button>
                      {customNewUnitPrice !== null && (
                        <Button
                          size="xs"
                          variant="ghost"
                          className="h-7 px-2 text-[10px] font-semibold text-blue-600 hover:bg-blue-50"
                          onClick={() => {
                            setCustomNewUnitPrice(null);
                            setIsEditingNewPrice(false);
                            setNewPriceInput('');
                          }}
                        >
                          Reset
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-[10px] font-mono text-indigo-400">{selectedProduct.sku}</span>
                      <span className="text-xs font-bold text-indigo-700">৳{newUnitPrice.toLocaleString()}</span>
                      {baseNewUnitPrice !== newUnitPrice && (
                        <span className="text-[10px] line-through text-indigo-300">৳{baseNewUnitPrice.toLocaleString()}</span>
                      )}
                      <button
                        onClick={() => {
                          setIsEditingNewPrice(true);
                          setNewPriceInput(String(newUnitPrice));
                        }}
                        className="text-[10px] text-indigo-600 hover:text-indigo-800 font-semibold px-1.5 py-0.5 rounded border border-indigo-100 bg-white leading-none hover:bg-indigo-50"
                      >
                        Edit
                      </button>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => { 
                    setSelectedProduct(null); 
                    setSelectedVariant(null); 
                    setNewDiscountInput(''); 
                    setShowNewDiscount(false);
                    setCustomNewUnitPrice(null);
                    setIsEditingNewPrice(false);
                    setNewPriceInput('');
                  }}
                  className="text-indigo-400 hover:text-indigo-600 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Variant picker */}
            {selectedProduct && selectedProduct.variants.length > 1 && !selectedVariant && (
              <div className="mt-3 border border-gray-200 rounded-xl overflow-hidden">
                <div className="px-3 py-2 bg-gray-50 border-b border-gray-100">
                  <p className="text-xs font-semibold text-gray-500">Pick a variant</p>
                </div>
                {selectedProduct.variants.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => {
                      setSelectedVariant({ id: v.id, name: v.name, price: v.offerPrice ?? v.price, stock: v.stock, image: v.image });
                      setCustomNewUnitPrice(null);
                      setIsEditingNewPrice(false);
                      setNewPriceInput('');
                    }}
                    className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-indigo-50 border-b border-gray-50 last:border-0 text-left"
                  >
                    <div className="flex items-center gap-2">
                      {v.image && <Image src={v.image} alt={v.name} width={28} height={28} className="rounded object-cover" />}
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{v.name}</p>
                        {v.sku && <p className="text-[10px] font-mono text-gray-400">{v.sku}</p>}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900">৳{(v.offerPrice ?? v.price).toLocaleString()}</p>
                      {v.offerPrice && v.offerPrice < v.price && (
                        <p className="text-[10px] line-through text-gray-400">৳{v.price.toLocaleString()}</p>
                      )}
                      <p className={cn('text-[10px] font-semibold', v.stock <= 0 ? 'text-red-500' : v.stock <= 5 ? 'text-amber-500' : 'text-emerald-600')}>
                        Stock: {v.stock}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* ── NEW PRODUCT DISCOUNT (POS-style) ─────────────── */}
            {productChosen && (
              <>
                <button
                  type="button"
                  onClick={() => setShowNewDiscount((v) => !v)}
                  className={cn(
                    'mt-2.5 w-full flex items-center justify-between px-3 py-2 rounded-lg border text-xs font-semibold transition-colors',
                    showNewDiscount || newDiscountAmount > 0
                      ? 'bg-green-50 text-green-700 border-green-200'
                      : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                  )}
                >
                  <div className="flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5" />
                    New Product Discount / Commission
                    {newDiscountAmount > 0 && (
                      <span className="ml-1 bg-green-200 text-green-800 px-1.5 py-0.5 rounded text-[10px] font-bold">
                        -৳{newDiscountAmount.toLocaleString()}
                      </span>
                    )}
                  </div>
                  {showNewDiscount ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                {showNewDiscount && (
                  <div className="mt-1 p-3 bg-green-50 border border-green-200 rounded-xl space-y-2">
                    <p className="text-xs text-green-700 font-semibold">
                      Discount on ৳{baseNewTotal.toLocaleString()} (new product):
                    </p>
                    <div className="flex gap-2 items-center">
                      {/* Type toggle — POS style */}
                      <div className="flex border border-gray-200 rounded-lg overflow-hidden shrink-0">
                        <button
                          type="button"
                          onClick={() => { setNewDiscountType('fixed'); setNewDiscountInput(''); }}
                          className={cn(
                            'px-3 py-1.5 text-xs font-bold transition-colors',
                            newDiscountType === 'fixed' ? 'bg-gray-900 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'
                          )}
                        >৳</button>
                        <button
                          type="button"
                          onClick={() => { setNewDiscountType('percent'); setNewDiscountInput(''); }}
                          className={cn(
                            'px-3 py-1.5 text-xs font-bold transition-colors',
                            newDiscountType === 'percent' ? 'bg-gray-900 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'
                          )}
                        >%</button>
                      </div>
                      <input
                        type="number"
                        min="0"
                        max={newDiscountType === 'percent' ? 100 : undefined}
                        value={newDiscountInput}
                        onChange={(e) => setNewDiscountInput(e.target.value)}
                        placeholder={newDiscountType === 'percent' ? '0 – 100%' : 'Amount'}
                        className="flex-1 h-9 px-3 text-sm border border-green-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-green-400"
                      />
                      {newDiscountAmount > 0 && (
                        <div className="shrink-0 text-right">
                          <p className="text-xs text-green-700 font-bold">-৳{newDiscountAmount.toLocaleString()}</p>
                          <p className="text-[10px] text-gray-500">৳{newTotal.toLocaleString()}</p>
                        </div>
                      )}
                    </div>
                    {/* Quick % buttons like POS */}
                    <div className="flex gap-1.5 flex-wrap">
                      {[5, 10, 15, 20].map((pct) => (
                        <button
                          key={pct}
                          type="button"
                          onClick={() => { setNewDiscountType('percent'); setNewDiscountInput(String(pct)); }}
                          className={cn(
                            'px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-colors',
                            newDiscountType === 'percent' && newDiscountInput === String(pct)
                              ? 'bg-green-600 text-white border-green-600'
                              : 'bg-white text-gray-600 border-gray-200 hover:bg-green-50'
                          )}
                        >
                          {pct}%
                        </button>
                      ))}
                      {newDiscountInput && (
                        <button
                          type="button"
                          onClick={() => setNewDiscountInput('')}
                          className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-red-200 text-red-500 hover:bg-red-50 ml-auto"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* ── STOCK STATUS ─────────────────────────────────────── */}
          {productChosen && (
            <div className={cn(
              'flex items-center gap-2 p-3 rounded-xl text-sm font-semibold',
              newStock >= qty ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            )}>
              {newStock >= qty
                ? <CheckCircle className="w-4 h-4 shrink-0" />
                : <AlertCircle className="w-4 h-4 shrink-0" />
              }
              {newStock >= qty
                ? `In Stock: ${newStock} units available`
                : `Insufficient stock: only ${newStock} available, need ${qty}`
              }
            </div>
          )}

          {/* ── EXCHANGE SUMMARY ─────────────────────────────────── */}
          {productChosen && (
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-100">
              <h4 className="text-sm font-bold text-gray-800 mb-3">Exchange Summary</h4>
              <div className="space-y-1.5">

                {/* Original return */}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Original sale ({qty}×)</span>
                  <span className="font-medium text-gray-700">৳{(originalUnitPrice * qty).toLocaleString()}</span>
                </div>

                {/* Return deduction */}
                {deductionAmount > 0 && (
                  <div className="flex justify-between text-sm text-red-600">
                    <span>Return deduction{deductionMode === 'percent' && ` (${deductionValue}%)`}</span>
                    <span className="font-semibold">– ৳{deductionAmount.toLocaleString()}</span>
                  </div>
                )}

                {/* Effective return */}
                <div className="flex justify-between text-sm pb-2 border-b border-indigo-200">
                  <span className="text-gray-700 font-semibold">Return value</span>
                  <span className="font-bold text-indigo-700">৳{returnValue.toLocaleString()}</span>
                </div>

                {/* New product base */}
                <div className="flex justify-between text-sm pt-1">
                  <span className="text-gray-600">New product ({qty}×)</span>
                  <span className="font-medium">৳{baseNewTotal.toLocaleString()}</span>
                </div>

                {/* New product discount */}
                {newDiscountAmount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>
                      Discount
                      {newDiscountType === 'percent' && ` (${newDiscountInput}%)`}
                    </span>
                    <span className="font-semibold">– ৳{newDiscountAmount.toLocaleString()}</span>
                  </div>
                )}

                {/* Net new product */}
                {newDiscountAmount > 0 && (
                  <div className="flex justify-between text-sm pb-2 border-b border-indigo-200">
                    <span className="text-gray-700 font-semibold">After discount</span>
                    <span className="font-bold text-green-700">৳{newTotal.toLocaleString()}</span>
                  </div>
                )}

                {/* Final */}
                <div className="flex justify-between text-base font-bold pt-2 border-t border-indigo-200 mt-1">
                  {difference === 0 ? (
                    <>
                      <span className="text-gray-800">No Difference</span>
                      <span className="text-green-600">Even Exchange ✓</span>
                    </>
                  ) : difference > 0 ? (
                    <>
                      <span className="text-gray-800">Customer Pays Extra</span>
                      <span className="text-orange-600 text-lg">৳{difference.toLocaleString()}</span>
                    </>
                  ) : (
                    <>
                      <span className="text-gray-800">Refund to Customer</span>
                      <span className="text-blue-600 text-lg">৳{Math.abs(difference).toLocaleString()}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="h-2" />
        </div>

        {/* ── FOOTER ───────────────────────────────────────────────── */}
        <div className="p-4 border-t border-gray-100 flex gap-3 shrink-0 bg-white">
          <Button variant="outline" onClick={onClose} className="flex-1 h-12">Cancel</Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !productChosen || newStock < qty}
            className="flex-1 h-12 bg-indigo-600 hover:bg-indigo-700 font-bold text-base gap-2"
          >
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
            Confirm Exchange
          </Button>
        </div>
      </div>
    </div>
  );
}
