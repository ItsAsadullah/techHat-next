'use client';

import { useState, useEffect, useRef } from 'react';
import { useLocalStorageState } from '@/lib/hooks/useLocalStorageState';
import { X, Loader2, ShoppingBag, MapPin, Phone, User, Mail, FileText, CreditCard, Truck, Check, ChevronDown, AlertCircle, Package, Zap, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getDivisions, getDistricts, getUpazilas } from '@/lib/location-data';
import Image from 'next/image';

interface CheckoutItem {
  productId: string;
  variantId?: string | null;
  productName: string;
  variantName?: string | null;
  quantity: number;
  unitPrice: number;
  image?: string | null;
}

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CheckoutItem[];
}

type Step = 'info' | 'shipping' | 'payment' | 'confirm';

const SHIPPING_RATES_FALLBACK: Record<string, number> = {
  'Dhaka': 60,
  'Chattogram': 120,
  'Rajshahi': 120,
  'Khulna': 120,
  'Sylhet': 120,
  'Barishal': 130,
  'Rangpur': 130,
  'Mymensingh': 120,
};

const PAYMENT_METHODS = [
  { id: 'CASH', label: 'Cash on Delivery', icon: '💵', desc: 'Pay when you receive the product' },
  { id: 'MOBILE_BANKING', label: 'Mobile Banking', icon: '📱', desc: 'bKash, Nagad, Rocket' },
  { id: 'ONLINE', label: 'Online Payment', icon: '💳', desc: 'Card / Online Banking' },
];

function formatPrice(p: number) { return `৳${p.toLocaleString('en-BD')}`; }

export default function CheckoutModal({ isOpen, onClose, items }: CheckoutModalProps) {
  const [step, setStep] = useState<Step>('info');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');

  // Form state — localStorage এ save থাকে, পরের বার auto-fill হয়
  const [customerName, setCustomerName] = useLocalStorageState('checkout_name', '');
  const [customerPhone, setCustomerPhone] = useLocalStorageState('checkout_phone', '');
  const [customerEmail, setCustomerEmail] = useLocalStorageState('checkout_email', '');
  const [division, setDivision] = useLocalStorageState('checkout_division', '');
  const [district, setDistrict] = useLocalStorageState('checkout_district', '');
  const [upazila, setUpazila] = useLocalStorageState('checkout_upazila', '');
  const [shippingAddress, setShippingAddress] = useLocalStorageState('checkout_address', '');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [transactionId, setTransactionId] = useState('');
  const [orderNote, setOrderNote] = useState('');
  const [shippingRates, setShippingRates] = useState({ dhaka: 60, outside: 120, freeThreshold: 0 });

  // Load dynamic shipping rates from admin settings
  useEffect(() => {
    fetch('/api/settings/shipping')
      .then((r) => r.json())
      .then((d) => setShippingRates({ dhaka: d.dhaka ?? 60, outside: d.outside ?? 120, freeThreshold: d.freeThreshold ?? 0 }))
      .catch(() => {});
  }, []);

  // Division/district cascade reset — প্রথম render এ fire করবে না
  const divisionMounted = useRef(false);
  const districtMounted = useRef(false);

  // Derived
  const divisions = getDivisions();
  const districts = division ? getDistricts(division) : [];
  const upazilas = district && division ? getUpazilas(division, district) : [];

  const subtotal = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const isDhaka = division === 'Dhaka';
  const baseShipping = isDhaka ? shippingRates.dhaka : (shippingRates.outside ?? SHIPPING_RATES_FALLBACK[division] ?? 120);
  const shippingCost = division
    ? (shippingRates.freeThreshold > 0 && subtotal >= shippingRates.freeThreshold ? 0 : baseShipping)
    : 0;
  const grandTotal = subtotal + shippingCost;

  // Reset on open/close
  useEffect(() => {
    if (isOpen) {
      setStep('info');
      setError('');
      setSuccess(false);
    }
  }, [isOpen]);

  // Reset dependent selects (initial mount এ skip করে)
  useEffect(() => {
    if (!divisionMounted.current) { divisionMounted.current = true; return; }
    setDistrict('');
    setUpazila('');
  }, [division]);
  useEffect(() => {
    if (!districtMounted.current) { districtMounted.current = true; return; }
    setUpazila('');
  }, [district]);

  const validateInfo = () => {
    if (!customerName.trim()) return 'আপনার নাম লিখুন';
    if (!customerPhone.trim()) return 'ফোন নম্বর লিখুন';
    const phoneRegex = /^(\+?880|0)?1[3-9]\d{8}$/;
    if (!phoneRegex.test(customerPhone.replace(/\s/g, ''))) return 'সঠিক ফোন নম্বর দিন (01XXXXXXXXX)';
    return null;
  };

  const validateShipping = () => {
    if (!division) return 'বিভাগ সিলেক্ট করুন';
    if (!district) return 'জেলা সিলেক্ট করুন';
    if (!shippingAddress.trim()) return 'সম্পূর্ণ ঠিকানা লিখুন';
    return null;
  };

  const goNext = () => {
    setError('');
    if (step === 'info') {
      const err = validateInfo();
      if (err) { setError(err); return; }
      setStep('shipping');
    } else if (step === 'shipping') {
      const err = validateShipping();
      if (err) { setError(err); return; }
      setStep('payment');
    } else if (step === 'payment') {
      if (paymentMethod !== 'CASH' && !transactionId.trim()) {
        setError('Transaction ID দিন');
        return;
      }
      setStep('confirm');
    }
  };

  const goBack = () => {
    setError('');
    if (step === 'shipping') setStep('info');
    else if (step === 'payment') setStep('shipping');
    else if (step === 'confirm') setStep('payment');
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          customerEmail: customerEmail.trim() || undefined,
          division,
          district,
          upazila: upazila || undefined,
          shippingAddress: shippingAddress.trim(),
          paymentMethod,
          transactionId: transactionId.trim() || undefined,
          orderNote: orderNote.trim() || undefined,
          items: items.map(i => ({
            productId: i.productId,
            variantId: i.variantId || null,
            productName: i.productName,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
          })),
          shippingCost,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setSuccess(true);
        setOrderNumber(data.order.orderNumber);
      } else {
        setError(data.error || 'অর্ডার প্লেস করতে সমস্যা হয়েছে');
      }
    } catch {
      setError('নেটওয়ার্ক সমস্যা। আবার চেষ্টা করুন।');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const steps: { key: Step; label: string; num: number }[] = [
    { key: 'info', label: 'Information', num: 1 },
    { key: 'shipping', label: 'Shipping', num: 2 },
    { key: 'payment', label: 'Payment', num: 3 },
    { key: 'confirm', label: 'Confirm', num: 4 },
  ];

  const currentStepIdx = steps.findIndex(s => s.key === step);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal Container */}
      <div className="relative w-full max-w-lg mx-4 max-h-[92vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="shrink-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShoppingBag className="w-5 h-5" />
              <h2 className="text-lg font-bold">
                {success ? 'Order Placed!' : 'Place Order'}
              </h2>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-white/20 flex items-center justify-center transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Progress Steps */}
          {!success && (
            <div className="flex items-center gap-1 mt-4">
              {steps.map((s, idx) => (
                <div key={s.key} className="flex items-center flex-1">
                  <div className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-all",
                    idx < currentStepIdx ? "bg-white text-blue-600 border-white" :
                    idx === currentStepIdx ? "bg-white/20 text-white border-white" :
                    "bg-transparent text-white/40 border-white/30"
                  )}>
                    {idx < currentStepIdx ? <Check className="w-3 h-3" /> : s.num}
                  </div>
                  {idx < steps.length - 1 && (
                    <div className={cn(
                      "flex-1 h-0.5 mx-1.5 rounded-full transition-all",
                      idx < currentStepIdx ? "bg-white" : "bg-white/20"
                    )} />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Success View */}
        {success ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-5 animate-in zoom-in duration-500">
              <Check className="w-10 h-10 text-green-600" />
            </div>
            <h3 className="text-2xl font-extrabold text-gray-900 mb-2">Thank You!</h3>
            <p className="text-gray-600 mb-1">আপনার অর্ডার সফলভাবে প্লেস করা হয়েছে।</p>
            <div className="bg-gray-100 rounded-xl px-5 py-3 mt-3 mb-6">
              <p className="text-xs text-gray-500 mb-1">Order Number</p>
              <p className="text-xl font-mono font-bold text-gray-900">{orderNumber}</p>
            </div>
            <p className="text-sm text-gray-500 mb-6">
              আমরা শীঘ্রই আপনার সাথে যোগাযোগ করব।
            </p>
            <button
              onClick={onClose}
              className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors"
            >
              Continue Shopping
            </button>
          </div>
        ) : (
          <>
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Error */}
              {error && (
                <div className="mb-4 flex items-center gap-2 bg-red-50 text-red-700 px-4 py-3 rounded-xl text-sm font-medium border border-red-200 animate-in fade-in duration-200">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              {/* Step: Customer Info */}
              {step === 'info' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-200">
                  <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-500" />
                    Customer Information
                  </h3>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Full Name *</label>
                    <input
                      id="checkout-name"
                      name="name"
                      type="text"
                      autoComplete="name"
                      value={customerName}
                      onChange={e => setCustomerName(e.target.value)}
                      placeholder="আপনার নাম"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Phone Number *</label>
                    <input
                      id="checkout-phone"
                      name="tel"
                      type="tel"
                      autoComplete="tel"
                      value={customerPhone}
                      onChange={e => setCustomerPhone(e.target.value)}
                      placeholder="01XXXXXXXXX"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Email (Optional)</label>
                    <input
                      id="checkout-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      value={customerEmail}
                      onChange={e => setCustomerEmail(e.target.value)}
                      placeholder="email@example.com"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              )}

              {/* Step: Shipping */}
              {step === 'shipping' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-200">
                  <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                    <Truck className="w-4 h-4 text-blue-500" />
                    Shipping Address
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Division *</label>
                      <select
                        value={division}
                        onChange={e => setDivision(e.target.value)}
                        className="w-full px-3 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      >
                        <option value="">বিভাগ</option>
                        {divisions.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600 mb-1.5 block">District *</label>
                      <select
                        value={district}
                        onChange={e => setDistrict(e.target.value)}
                        disabled={!division}
                        className="w-full px-3 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:bg-gray-50 disabled:text-gray-400"
                      >
                        <option value="">জেলা</option>
                        {districts.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Upazila (Optional)</label>
                    <select
                      value={upazila}
                      onChange={e => setUpazila(e.target.value)}
                      disabled={!district}
                      className="w-full px-3 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:bg-gray-50 disabled:text-gray-400"
                    >
                      <option value="">উপজেলা</option>
                      {upazilas.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Full Address *</label>
                    <textarea
                      id="checkout-address"
                      name="address"
                      autoComplete="street-address"
                      value={shippingAddress}
                      onChange={e => setShippingAddress(e.target.value)}
                      placeholder="বাড়ি নম্বর, রোড, এলাকা, পোস্ট অফিস..."
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Order Note (Optional)</label>
                    <textarea
                      value={orderNote}
                      onChange={e => setOrderNote(e.target.value)}
                      placeholder="বিশেষ কোনো নির্দেশনা..."
                      rows={2}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                  </div>

                  {/* Shipping Cost Info */}
                  {division && (
                    <div className="flex items-center justify-between bg-blue-50 px-4 py-3 rounded-xl border border-blue-100">
                      <span className="text-sm text-blue-700 font-medium">Delivery Charge ({division})</span>
                      <span className="text-sm font-bold text-blue-800">{formatPrice(shippingCost)}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Step: Payment */}
              {step === 'payment' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-200">
                  <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-blue-500" />
                    Payment Method
                  </h3>
                  <div className="space-y-3">
                    {PAYMENT_METHODS.map(pm => (
                      <label
                        key={pm.id}
                        className={cn(
                          "flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all",
                          paymentMethod === pm.id
                            ? "border-blue-500 bg-blue-50/50 shadow-sm"
                            : "border-gray-200 hover:border-gray-300 bg-white"
                        )}
                      >
                        <input
                          type="radio"
                          name="paymentMethod"
                          value={pm.id}
                          checked={paymentMethod === pm.id}
                          onChange={e => setPaymentMethod(e.target.value)}
                          className="sr-only"
                        />
                        <div className={cn(
                          "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0",
                          paymentMethod === pm.id ? "border-blue-500" : "border-gray-300"
                        )}>
                          {paymentMethod === pm.id && <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />}
                        </div>
                        <span className="text-2xl">{pm.icon}</span>
                        <div>
                          <p className="text-sm font-bold text-gray-900">{pm.label}</p>
                          <p className="text-xs text-gray-500">{pm.desc}</p>
                        </div>
                      </label>
                    ))}
                  </div>

                  {paymentMethod !== 'CASH' && (
                    <div className="animate-in fade-in duration-200">
                      <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Transaction ID *</label>
                      <input
                        type="text"
                        value={transactionId}
                        onChange={e => setTransactionId(e.target.value)}
                        placeholder="আপনার Transaction ID লিখুন"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {paymentMethod === 'MOBILE_BANKING' && (
                        <p className="text-xs text-gray-500 mt-2">
                          Send to: <span className="font-bold text-gray-700">01XXXXXXXXX</span> (bKash/Nagad)
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Step: Confirm */}
              {step === 'confirm' && (
                <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-200">
                  <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-500" />
                    Order Summary
                  </h3>

                  {/* Items */}
                  <div className="space-y-3">
                    {items.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                        <div className="w-12 h-12 rounded-lg bg-white border border-gray-200 overflow-hidden relative shrink-0">
                          {item.image ? (
                            <Image src={item.image} alt="" fill className="object-cover" sizes="48px" />
                          ) : (
                            <Package className="w-5 h-5 text-gray-300 m-auto mt-3" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{item.productName}</p>
                          {item.variantName && <p className="text-xs text-gray-500">{item.variantName}</p>}
                          <p className="text-xs text-gray-500">{item.quantity} × {formatPrice(item.unitPrice)}</p>
                        </div>
                        <span className="text-sm font-bold text-gray-900">{formatPrice(item.unitPrice * item.quantity)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Customer Info Summary */}
                  <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Name</span>
                      <span className="font-semibold text-gray-900">{customerName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Phone</span>
                      <span className="font-semibold text-gray-900">{customerPhone}</span>
                    </div>
                    {customerEmail && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Email</span>
                        <span className="font-semibold text-gray-900">{customerEmail}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-500">Address</span>
                      <span className="font-semibold text-gray-900 text-right max-w-[200px]">{shippingAddress}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Area</span>
                      <span className="font-semibold text-gray-900">{[upazila, district, division].filter(Boolean).join(', ')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Payment</span>
                      <span className="font-semibold text-gray-900">{PAYMENT_METHODS.find(p => p.id === paymentMethod)?.label}</span>
                    </div>
                  </div>

                  {/* Price Summary */}
                  <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Subtotal</span>
                      <span>{formatPrice(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Shipping</span>
                      <span>{formatPrice(shippingCost)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-black text-gray-900 pt-2 border-t border-gray-200">
                      <span>Grand Total</span>
                      <span>{formatPrice(grandTotal)}</span>
                    </div>
                  </div>

                  {orderNote && (
                    <div className="bg-amber-50 rounded-xl p-3 border border-amber-100">
                      <p className="text-xs font-semibold text-amber-700 mb-1">Note:</p>
                      <p className="text-sm text-amber-800">{orderNote}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="shrink-0 border-t border-gray-100 bg-gray-50/50 px-6 py-4">
              {/* Price Summary */}
              {step !== 'confirm' && (
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-xs text-gray-500">Items ({items.reduce((s, i) => s + i.quantity, 0)})</p>
                    <p className="text-lg font-black text-gray-900">{formatPrice(subtotal)}</p>
                  </div>
                  {division && (
                    <div className="text-right">
                      <p className="text-xs text-gray-500">+ Shipping</p>
                      <p className="text-sm font-bold text-gray-600">{formatPrice(shippingCost)}</p>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-3">
                {step !== 'info' && (
                  <button
                    onClick={goBack}
                    className="flex-1 h-12 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-50 transition-colors"
                  >
                    Back
                  </button>
                )}
                {step !== 'confirm' ? (
                  <button
                    onClick={goNext}
                    className="flex-1 h-12 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
                  >
                    Continue
                    <ChevronDown className="w-4 h-4 -rotate-90" />
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="flex-1 h-12 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700 transition-all shadow-lg shadow-green-200 flex items-center justify-center gap-2 disabled:opacity-70"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Placing Order...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        Confirm Order — {formatPrice(grandTotal)}
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
