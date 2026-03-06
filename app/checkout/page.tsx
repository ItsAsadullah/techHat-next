'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useCart } from '@/lib/context/cart-context';
import type { CartItem } from '@/lib/types/cart-wishlist';
import { bangladeshLocations } from '@/lib/location-data';
import {
  ShoppingCart, Plus, Minus, Trash2, Tag, ChevronRight, ChevronDown,
  MapPin, Phone, Mail, User, Building2, Truck, CreditCard,
  Banknote, Smartphone, CheckCircle2, ArrowLeft, Package, AlertCircle,
  Loader2, BadgeCheck, X, Info, Copy, Check, Shield, Lock, Star,
  Home, Briefcase, RefreshCw, Edit3, LogIn, Zap,
  ChevronLeft, Gift, Award,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────
//  Constants & Types
// ─────────────────────────────────────────────────────────

type Step = 1 | 2 | 3;
type PaymentMethod = 'CASH' | 'MOBILE_BANKING' | 'CARD' | 'ONLINE';
type MobileProvider = 'bKash' | 'Nagad' | 'Rocket';

interface SavedAddress {
  id: string;
  label: string;
  type: 'home' | 'work' | 'other';
  name: string;
  phone: string;
  address: string;
  division: string;
  district: string;
  upazila?: string;
  isDefault: boolean;
}

interface DeliveryForm {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  division: string;
  district: string;
  upazila: string;
  shippingAddress: string;
  orderNote: string;
}

interface FieldError {
  customerName?: string;
  customerPhone?: string;
  division?: string;
  district?: string;
  shippingAddress?: string;
}

const EMPTY_FORM: DeliveryForm = {
  customerName: '', customerPhone: '', customerEmail: '',
  division: '', district: '', upazila: '', shippingAddress: '', orderNote: '',
};
const SHIPPING_DHAKA = 60;
const SHIPPING_OUTSIDE = 120;
const STORAGE_KEY = 'techhat_addresses';

const BANK_INFO = {
  bankName: 'Dutch-Bangla Bank Limited (DBBL)',
  accountName: 'TechHat Bangladesh Ltd.',
  accountNumber: '1481100132169',
  branchName: 'Gulshan Branch, Dhaka',
  routing: '090261481',
};

const MOBILE_NUMBERS: Record<MobileProvider, string> = {
  bKash: '01700-000000',
  Nagad: '01700-000001',
  Rocket: '01700-000002',
};

const PROVIDER_COLORS: Record<MobileProvider, string> = {
  bKash: 'from-pink-500 to-rose-600',
  Nagad: 'from-orange-500 to-red-500',
  Rocket: 'from-violet-600 to-purple-700',
};

const STEPS = [
  { id: 1, label: 'Cart Review', icon: ShoppingCart },
  { id: 2, label: 'Delivery', icon: MapPin },
  { id: 3, label: 'Payment', icon: CreditCard },
];

const validatePhone = (p: string) =>
  /^(?:\+?88)?01[3-9]\d{8}$/.test(p.replace(/[\s-]/g, ''));

// ─────────────────────────────────────────────────────────
//  Main Component
// ─────────────────────────────────────────────────────────

export default function CheckoutPage() {
  const { items: cart, updateQuantity, removeFromCart, clearCart } = useCart();

  // — Auth —
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [guestMode, setGuestMode] = useState(false);

  // — Step —
  const [step, setStep] = useState<Step>(1);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const mainRef = useRef<HTMLDivElement>(null);

  // — Form —
  const [form, setForm] = useState<DeliveryForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<FieldError>({});
  const [touched, setTouched] = useState<Partial<Record<keyof DeliveryForm, boolean>>>({});

  // — Saved addresses —
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showAddrsPanel, setShowAddrsPanel] = useState(false);

  // — Payment —
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [mobileProvider, setMobileProvider] = useState<MobileProvider>('bKash');
  const [mobilePhone, setMobilePhone] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [paymentErrors, setPaymentErrors] = useState<Record<string, string>>({});

  // — Coupon —
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponMsg, setCouponMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // — Order —
  const [placing, setPlacing] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<{
    orderNumber: string;
    grandTotal: number;
    trackingToken?: string;
    estimatedDelivery?: string;
    paymentMethod?: string;
  } | null>(null);
  const [orderError, setOrderError] = useState('');
  const [stockError, setStockError] = useState<string[]>([]);

  // — Misc —
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [summaryExpanded, setSummaryExpanded] = useState(false);

  // ─── Auth init ────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        setForm(prev => ({
          ...prev,
          customerEmail: session.user.email || '',
          customerName: session.user.user_metadata?.full_name || '',
          customerPhone: session.user.user_metadata?.phone || '',
        }));
      }
      setAuthLoading(false);
    });
  }, []);

  // ─── Load saved addresses ─────────────────────────────
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const addrs: SavedAddress[] = JSON.parse(raw);
        setSavedAddresses(addrs);
        const def = addrs.find(a => a.isDefault);
        if (def) applyAddress(def);
      }
    } catch { /* ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Scroll top on step change ────────────────────────
  useEffect(() => {
    mainRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [step]);

  // ─── Derived ─────────────────────────────────────────
  const divisions = useMemo(() => Object.keys(bangladeshLocations.divisions).sort(), []);
  const districts = useMemo(() =>
    form.division ? Object.keys(bangladeshLocations.divisions[form.division]?.districts ?? {}).sort() : [],
  [form.division]);
  const upazilas = useMemo(() =>
    form.division && form.district
      ? Object.keys(bangladeshLocations.divisions[form.division]?.districts[form.district]?.upazilas ?? {}).sort()
      : [],
  [form.division, form.district]);

  const subTotal = useMemo(
    () => cart.reduce((s: number, i: CartItem) => s + (i.offerPrice ?? i.price) * i.quantity, 0),
    [cart]
  );
  const shippingCost = form.division === 'Dhaka' ? SHIPPING_DHAKA : SHIPPING_OUTSIDE;
  const discount = couponDiscount;
  const grandTotal = subTotal + shippingCost - discount;
  const totalItems = cart.reduce((s: number, i: CartItem) => s + i.quantity, 0);
  const savings = cart.reduce((s: number, i: CartItem) =>
    s + (i.offerPrice != null && i.offerPrice < i.price ? (i.price - i.offerPrice) * i.quantity : 0), 0);

  // ─── Address apply ────────────────────────────────────
  const applyAddress = useCallback((addr: SavedAddress) => {
    setForm(prev => ({
      ...prev,
      customerName: addr.name,
      customerPhone: addr.phone,
      division: addr.division,
      district: addr.district,
      upazila: addr.upazila || '',
      shippingAddress: addr.address,
    }));
    setSelectedAddressId(addr.id);
    setShowAddrsPanel(false);
    setErrors({});
  }, []);

  // ─── Field change with live validation ───────────────
  const handleField = useCallback((field: keyof DeliveryForm, value: string) => {
    setForm(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'division') { next.district = ''; next.upazila = ''; }
      if (field === 'district') { next.upazila = ''; }
      return next;
    });
    setTouched(prev => ({ ...prev, [field]: true }));
    setSelectedAddressId(null);
    setErrors(prev => {
      const next = { ...prev };
      if (field === 'customerName') next.customerName = value.trim() ? undefined : 'Name is required';
      if (field === 'customerPhone') {
        if (!value.trim()) next.customerPhone = 'Phone number is required';
        else if (!validatePhone(value)) next.customerPhone = 'Enter a valid phone number';
        else next.customerPhone = undefined;
      }
      if (field === 'division') next.division = value ? undefined : 'Please select a division';
      if (field === 'district') next.district = value ? undefined : 'Select district';
      if (field === 'shippingAddress') next.shippingAddress = value.trim() ? undefined : 'Full address is required';
      return next;
    });
  }, []);

  // ─── Validate delivery step ───────────────────────────
  const validateDelivery = (): boolean => {
    const e: FieldError = {};
    if (!form.customerName.trim()) e.customerName = 'Name is required';
    if (!form.customerPhone.trim()) e.customerPhone = 'Phone number is required';
    else if (!validatePhone(form.customerPhone)) e.customerPhone = 'Enter a valid Bangladeshi mobile number';
    if (!form.division) e.division = 'Please select a division';
    if (!form.district) e.district = 'Select district';
    if (!form.shippingAddress.trim()) e.shippingAddress = 'Full address is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ─── Validate payment ────────────────────────────────
  const validatePayment = (): boolean => {
    const pe: Record<string, string> = {};
    if (paymentMethod === 'MOBILE_BANKING') {
      if (!mobilePhone.trim()) pe.mobilePhone = 'Mobile number is required';
      else if (!validatePhone(mobilePhone)) pe.mobilePhone = 'Enter a valid phone number';
      if (!transactionId.trim()) pe.transactionId = 'Transaction ID is required';
    }
    setPaymentErrors(pe);
    return Object.keys(pe).length === 0;
  };

  // ─── Step navigation ─────────────────────────────────
  const goToStep = (target: Step) => {
    if (target === 2 && step === 1) {
      if (cart.length === 0) return;
      setCompletedSteps(prev => new Set([...prev, 1]));
      setStep(2);
    } else if (target === 3 && step === 2) {
      if (!validateDelivery()) return;
      setCompletedSteps(prev => new Set([...prev, 2]));
      setStep(3);
    } else if (target < step) {
      setStep(target);
    }
  };

  // ─── Coupon ───────────────────────────────────────────
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponMsg(null);
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode.trim().toUpperCase(), subtotal: subTotal }),
      });
      const data = await res.json();
      if (data.valid) {
        setCouponDiscount(data.discount);
        setCouponMsg({ type: 'success', text: `Coupon applied! ৳${data.discount} discount` });
      } else {
        setCouponDiscount(0);
        setCouponMsg({ type: 'error', text: data.message || 'Invalid coupon code' });
      }
    } catch {
      setCouponMsg({ type: 'error', text: 'Could not validate coupon' });
    } finally {
      setCouponLoading(false);
    }
  };

  // ─── Copy ─────────────────────────────────────────────
  const copyText = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(key);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // ─── Place order ──────────────────────────────────────
  const handlePlaceOrder = async () => {
    if (!validatePayment()) return;
    setStockError([]);
    setOrderError('');
    setPlacing(true);

    try {
      // Stock revalidation
      const stockRes = await fetch('/api/orders/validate-stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: cart.map((i: CartItem) => ({ productId: i.id, quantity: i.quantity })) }),
      });
      if (stockRes.ok) {
        const stockData = await stockRes.json();
        if (stockData.outOfStock?.length > 0) {
          setStockError(stockData.outOfStock.map((p: any) => p.name));
          setPlacing(false);
          return;
        }
      }

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: form.customerName.trim(),
          customerPhone: form.customerPhone.trim(),
          customerEmail: form.customerEmail.trim() || undefined,
          division: form.division,
          district: form.district,
          upazila: form.upazila || undefined,
          shippingAddress: [form.shippingAddress.trim(), form.upazila, form.district, form.division].filter(Boolean).join(', '),
          orderNote: form.orderNote.trim() || undefined,
          paymentMethod,
          transactionId: paymentMethod === 'MOBILE_BANKING' ? transactionId.trim() : undefined,
          // Send couponCode so server validates & applies it independently.
          // shippingCost and discount are intentionally omitted —
          // the server always recalculates them from the DB.
          couponCode: couponDiscount > 0 ? couponCode.trim().toUpperCase() : undefined,
          items: cart.map((i: CartItem) => ({
            productId: i.id,
            productName: i.name,
            quantity: i.quantity,
            // unitPrice is sent as a hint only; server re-fetches from DB
            unitPrice: i.offerPrice ?? i.price,
          })),
        }),
      });

      const data = await res.json();
      if (data.success) {
        clearCart();
        setOrderSuccess({
          orderNumber: data.orderNumber,
          grandTotal: data.grandTotal ?? grandTotal,
          trackingToken: data.trackingToken,
          estimatedDelivery: data.estimatedDelivery,
          paymentMethod: paymentMethod,
        });
      } else {
        setOrderError(data.error || 'Could not place order. Please try again.');
      }
    } catch {
      setOrderError('Server connection error. Please try again.');
    } finally {
      setPlacing(false);
    }
  };

  // ─── SUCCESS SCREEN ───────────────────────────────────
  if (orderSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-md w-full"
        >
          <div className="flex justify-center mb-8">
            <div className="relative">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.15, type: 'spring', stiffness: 180, damping: 14 }}
                className="w-28 h-28 rounded-full bg-green-500 flex items-center justify-center shadow-2xl shadow-green-200"
              >
                <CheckCircle2 className="w-16 h-16 text-white" strokeWidth={2.5} />
              </motion.div>
              {[1, 2].map(i => (
                <motion.div
                  key={i}
                  initial={{ scale: 0.6, opacity: 0.8 }}
                  animate={{ scale: 1.8 + i * 0.5, opacity: 0 }}
                  transition={{ delay: 0.3 + i * 0.15, duration: 0.8, ease: 'easeOut' }}
                  className="absolute inset-0 rounded-full border-2 border-green-400"
                />
              ))}
            </div>
          </div>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="text-center mb-8">
            <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Order Placed! 🎉</h1>
            <p className="text-gray-500">Your order has been successfully received</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 }}
            className="bg-white border border-gray-200 rounded-3xl p-6 mb-5 shadow-lg"
          >
            <div className="text-center mb-5">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Order Number</span>
              <p className="text-2xl font-black text-green-600 mt-1 tracking-wide">{orderSuccess.orderNumber}</p>
            </div>
            <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-4">
              <div className="text-center">
                <p className="text-xs text-gray-400 mb-0.5">Total Amount</p>
                <p className="font-bold text-gray-900">৳{orderSuccess.grandTotal.toLocaleString()}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-400 mb-0.5">Est. Delivery</p>
                <p className="font-bold text-gray-900">
                  {orderSuccess.estimatedDelivery
                    ? new Date(orderSuccess.estimatedDelivery).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                    : '3–5 Business Days'}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-400 mb-0.5">Payment</p>
                <p className="font-semibold text-gray-900 text-sm capitalize">
                  {orderSuccess.paymentMethod === 'CASH' ? 'Cash on Delivery' :
                   orderSuccess.paymentMethod === 'MOBILE_BANKING' ? 'Mobile Banking' :
                   orderSuccess.paymentMethod === 'CARD' ? 'Card' : 'Online'}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-400 mb-0.5">Status</p>
                <span className="inline-flex items-center px-2 py-0.5 bg-amber-100 text-amber-700 border border-amber-200 rounded text-xs font-semibold">Pending Confirmation</span>
              </div>
            </div>
          </motion.div>

          {/* Track order */}
          {orderSuccess.trackingToken && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.58 }} className="mb-4">
              <Link href={`/track/${orderSuccess.trackingToken}`}
                className="flex items-center justify-center gap-2 w-full py-3 bg-blue-50 hover:bg-blue-100 border-2 border-blue-200 text-blue-700 font-bold rounded-2xl transition-colors"
              >
                <Package className="w-4 h-4" /> Track Your Order
              </Link>
            </motion.div>
          )}

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.65 }}
            className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-6"
          >
            <Phone className="w-4 h-4" /> We will call you at {form.customerPhone} to confirm
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="flex flex-col sm:flex-row gap-3">
            <Link href="/account/orders" className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 rounded-2xl transition-colors shadow-lg shadow-green-100">
              <Package className="w-4 h-4" /> My Orders
            </Link>
            <Link href="/" className="flex-1 flex items-center justify-center gap-2 bg-white border-2 border-gray-200 hover:bg-gray-50 text-gray-700 font-bold py-3.5 rounded-2xl transition-colors">
              <ShoppingCart className="w-4 h-4" /> Continue Shopping
            </Link>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  // ─── EMPTY CART ───────────────────────────────────────
  if (!authLoading && cart.length === 0 && step === 1) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingCart className="w-12 h-12 text-blue-300" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Your Cart is Empty</h2>
          <p className="text-gray-500 mb-8">Add items to your cart before checking out.</p>
          <Link href="/" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-3.5 rounded-2xl transition-colors">
            <ArrowLeft className="w-4 h-4" /> Start Shopping
          </Link>
        </div>
      </div>
    );
  }

  // ─── MAIN CHECKOUT ────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#f5f6f8]" ref={mainRef}>

      {/* ── Top nav bar ───────────────────────────────── */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-1.5 text-gray-500 hover:text-gray-900 transition-colors text-sm font-medium">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>

          {/* Step progress */}
          <div className="flex items-center gap-0">
            {STEPS.map((s, idx) => {
              const done = completedSteps.has(s.id);
              const active = step === s.id;
              const clickable = s.id < step || done;
              return (
                <div key={s.id} className="flex items-center">
                  <button
                    onClick={() => clickable ? setStep(s.id as Step) : undefined}
                    disabled={!clickable && !active}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-semibold transition-all ${active ? 'text-blue-600' : done ? 'text-green-600 cursor-pointer' : 'text-gray-400 cursor-default'}`}
                  >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${active ? 'bg-blue-600 text-white shadow-md shadow-blue-200' : done ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                      {done ? <Check className="w-3.5 h-3.5" /> : s.id}
                    </div>
                    <span className="hidden sm:inline">{s.label}</span>
                  </button>
                  {idx < STEPS.length - 1 && (
                    <div className={`w-8 h-0.5 transition-colors ${completedSteps.has(s.id) ? 'bg-green-400' : 'bg-gray-200'}`} />
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <Lock className="w-3.5 h-3.5 text-green-500" />
            <span className="hidden sm:inline">Secure Checkout</span>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6 lg:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 items-start">

          {/* ═══════ LEFT COLUMN ═════════════════════════ */}
          <div className="space-y-4">

            {/* ── Guest / login banner ──────────────────── */}
            {!authLoading && !user && !guestMode && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-blue-600 text-white rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <LogIn className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-sm">Sign in for faster checkout</p>
                    <p className="text-blue-200 text-xs mt-0.5">Access saved addresses, order tracking & offers</p>
                  </div>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <Link href="/?auth=login" className="flex-1 sm:flex-none text-center bg-white text-blue-600 hover:bg-blue-50 font-bold text-sm px-4 py-2 rounded-xl transition-colors">
                    Sign In
                  </Link>
                  <button onClick={() => setGuestMode(true)} className="flex-1 sm:flex-none text-center bg-blue-500 hover:bg-blue-400 text-white font-bold text-sm px-4 py-2 rounded-xl transition-colors">
                    Continue as Guest
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── STEP 1: Cart Review ──────────────────── */}
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div key="step1" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.22 }} className="space-y-4">

                  <Card title="Cart Items" icon={<ShoppingCart className="w-4 h-4" />} badge={`${totalItems}items`}>
                    <div className="divide-y divide-gray-100">
                      {cart.map((item: CartItem) => (
                        <div key={item.id} className="py-4 first:pt-0 last:pb-0">
                          <div className="flex gap-3">
                            <div className="relative w-[72px] h-[72px] flex-shrink-0 rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
                              {item.image
                                ? <Image src={item.image} alt={item.name} fill className="object-cover" sizes="72px" />
                                : <div className="w-full h-full flex items-center justify-center"><Package className="w-7 h-7 text-gray-300" /></div>}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <Link href={`/products/${item.slug}`} className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2 hover:text-blue-600 transition-colors">
                                  {item.name}
                                </Link>
                                <button onClick={() => removeFromCart(item.id)} className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0 p-0.5">
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                              {item.brand && <p className="text-xs text-gray-400 mt-0.5">{item.brand}</p>}
                              <div className="flex items-center justify-between mt-2.5">
                                <div className="flex items-center gap-1 border border-gray-200 rounded-xl overflow-hidden bg-gray-50">
                                  <button
                                    onClick={() => item.quantity > 1 ? updateQuantity(item.id, item.quantity - 1) : removeFromCart(item.id)}
                                    className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-red-50 hover:text-red-500 transition-colors"
                                  >
                                    {item.quantity === 1 ? <Trash2 className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
                                  </button>
                                  <span className="w-9 text-center font-bold text-sm text-gray-900 select-none">{item.quantity}</span>
                                  <button
                                    onClick={() => item.quantity < item.stock && updateQuantity(item.id, item.quantity + 1)}
                                    disabled={item.quantity >= item.stock}
                                    className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                                <div className="text-right">
                                  <span className="font-bold text-gray-900">৳{((item.offerPrice ?? item.price) * item.quantity).toLocaleString()}</span>
                                  {item.offerPrice != null && item.offerPrice < item.price && (
                                    <p className="text-xs text-gray-400 line-through">৳{(item.price * item.quantity).toLocaleString()}</p>
                                  )}
                                </div>
                              </div>
                              {item.quantity >= item.stock && (
                                <p className="text-[11px] text-amber-600 mt-1.5 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Max stock</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {savings > 0 && (
                      <div className="mt-4 flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-3 py-2">
                        <Gift className="w-4 h-4 text-green-600 flex-shrink-0" />
                        <span className="text-sm text-green-700 font-semibold">You save ৳{savings.toLocaleString()}!</span>
                      </div>
                    )}
                  </Card>

                  {/* Coupon */}
                  <Card title="Coupon Code" icon={<Tag className="w-4 h-4" />}>
                    {couponDiscount > 0 ? (
                      <div className="flex items-center justify-between bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                            <BadgeCheck className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <p className="font-bold text-green-800 text-sm">{couponCode.toUpperCase()}</p>
                            <p className="text-xs text-green-600">৳{couponDiscount} discount applied</p>
                          </div>
                        </div>
                        <button onClick={() => { setCouponCode(''); setCouponDiscount(0); setCouponMsg(null); }} className="text-red-400 hover:text-red-600 transition-colors">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <div className="flex-1 relative">
                          <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="text" value={couponCode}
                            onChange={e => setCouponCode(e.target.value.toUpperCase())}
                            onKeyDown={e => e.key === 'Enter' && handleApplyCoupon()}
                            placeholder="Enter coupon code"
                            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-all"
                          />
                        </div>
                        <button
                          onClick={handleApplyCoupon}
                          disabled={couponLoading || !couponCode.trim()}
                          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-bold text-sm rounded-xl transition-colors flex items-center gap-1.5 whitespace-nowrap"
                        >
                          {couponLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply'}
                        </button>
                      </div>
                    )}
                    <AnimatePresence>
                      {couponMsg && (
                        <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                          className={`flex items-center gap-1.5 text-xs mt-2 ${couponMsg.type === 'success' ? 'text-green-600' : 'text-red-500'}`}
                        >
                          {couponMsg.type === 'success' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                          {couponMsg.text}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </Card>

                  <button onClick={() => goToStep(2)} className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold text-base rounded-2xl transition-all shadow-lg shadow-blue-100 flex items-center justify-center gap-2">
                    Continue to Delivery <ChevronRight className="w-5 h-5" />
                  </button>
                </motion.div>
              )}

              {/* ── STEP 2: Delivery ─────────────────────── */}
              {step === 2 && (
                <motion.div key="step2" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }} transition={{ duration: 0.22 }} className="space-y-4">

                  {/* Saved addresses */}
                  {savedAddresses.length > 0 && (
                    <Card title="Saved Addresses" icon={<MapPin className="w-4 h-4" />}>
                      <div className="grid gap-2">
                        {savedAddresses.slice(0, showAddrsPanel ? undefined : 3).map(addr => (
                          <button key={addr.id} onClick={() => applyAddress(addr)}
                            className={`text-left p-3 rounded-xl border-2 transition-all ${selectedAddressId === addr.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-gray-50 hover:border-gray-300'}`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${selectedAddressId === addr.id ? 'bg-blue-100' : 'bg-gray-200'}`}>
                                  {addr.type === 'home' ? <Home className="w-3.5 h-3.5 text-gray-600" /> : <Briefcase className="w-3.5 h-3.5 text-gray-600" />}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-semibold text-sm text-gray-900">{addr.label || addr.name}</span>
                                    {addr.isDefault && <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-bold">Default</span>}
                                  </div>
                                  <p className="text-xs text-gray-500 truncate">{addr.address}, {addr.district}</p>
                                  <p className="text-xs text-gray-400">{addr.phone}</p>
                                </div>
                              </div>
                              {selectedAddressId === addr.id && <CheckCircle2 className="w-5 h-5 text-blue-500 flex-shrink-0" />}
                            </div>
                          </button>
                        ))}
                        {savedAddresses.length > 3 && (
                          <button onClick={() => setShowAddrsPanel(p => !p)} className="text-sm text-blue-600 hover:underline text-center py-1">
                            {showAddrsPanel ? 'Show less' : `Show ${savedAddresses.length - 3} more`}
                          </button>
                        )}
                      </div>
                    </Card>
                  )}

                  <Card title="Delivery Information" icon={<Truck className="w-4 h-4" />}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Field label="Full Name" required error={errors.customerName}>
                        <FieldInput icon={<User className="w-4 h-4" />} type="text" value={form.customerName} onChange={v => handleField('customerName', v)} placeholder="Your full name" hasError={!!errors.customerName} />
                      </Field>
                      <Field label="Mobile Number" required error={errors.customerPhone}>
                        <FieldInput icon={<Phone className="w-4 h-4" />} type="tel" value={form.customerPhone} onChange={v => handleField('customerPhone', v)} placeholder="01XXXXXXXXX" hasError={!!errors.customerPhone} />
                      </Field>
                      <Field label="Email (Optional)" className="sm:col-span-2">
                        <FieldInput icon={<Mail className="w-4 h-4" />} type="email" value={form.customerEmail} onChange={v => handleField('customerEmail', v)} placeholder="example@email.com" hasError={false} />
                      </Field>
                      <Field label="Division" required error={errors.division}>
                        <SelectInput value={form.division} onChange={v => handleField('division', v)} placeholder="Please select a division" options={divisions} hasError={!!errors.division} />
                      </Field>
                      <Field label="District" required error={errors.district}>
                        <SelectInput value={form.district} onChange={v => handleField('district', v)} placeholder={form.division ? 'Select district' : 'Select division first'} options={districts} disabled={!form.division} hasError={!!errors.district} />
                      </Field>
                      <Field label="Upazila / Thana">
                        <SelectInput value={form.upazila} onChange={v => handleField('upazila', v)} placeholder={form.district ? 'Select upazila' : 'Select district first'} options={upazilas} disabled={!form.district} hasError={false} />
                      </Field>
                      <Field label="Full Address" required error={errors.shippingAddress} className="sm:col-span-2">
                        <textarea value={form.shippingAddress} onChange={e => handleField('shippingAddress', e.target.value)} placeholder="House no., road, area..." rows={3}
                          className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-50 focus:bg-white resize-none ${errors.shippingAddress ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}
                        />
                      </Field>
                      <Field label="Order Note (Optional)" className="sm:col-span-2">
                        <textarea value={form.orderNote} onChange={e => handleField('orderNote', e.target.value)} placeholder="Special delivery instructions..." rows={2}
                          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-50 focus:bg-white resize-none"
                        />
                      </Field>
                    </div>
                  </Card>

                  {/* Delivery speed cards */}
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { icon: <Zap className="w-4 h-4 text-amber-500" />, label: 'Inside Dhaka', info: '1–2 Days • ৳60', active: form.division === 'Dhaka' },
                      { icon: <Truck className="w-4 h-4 text-blue-500" />, label: 'Outside Dhaka', info: '3–5 Days • ৳120', active: form.division !== '' && form.division !== 'Dhaka' },
                    ].map(opt => (
                      <div key={opt.label} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${opt.active ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-white'}`}>
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${opt.active ? 'bg-blue-100' : 'bg-gray-100'}`}>{opt.icon}</div>
                        <div>
                          <p className="text-xs font-semibold text-gray-800">{opt.label}</p>
                          <p className="text-xs text-gray-500">{opt.info}</p>
                        </div>
                        {opt.active && <CheckCircle2 className="w-4 h-4 text-blue-500 ml-auto" />}
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-3">
                    <button onClick={() => setStep(1)} className="flex items-center gap-1.5 px-5 py-3.5 bg-white border-2 border-gray-200 hover:border-gray-300 text-gray-700 font-bold rounded-2xl transition-colors text-sm">
                      <ChevronLeft className="w-4 h-4" /> Back
                    </button>
                    <button onClick={() => goToStep(3)} className="flex-1 py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold rounded-2xl transition-all shadow-lg shadow-blue-100 flex items-center justify-center gap-2">
                      Payment Method <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ── STEP 3: Payment ──────────────────────── */}
              {step === 3 && (
                <motion.div key="step3" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }} transition={{ duration: 0.22 }} className="space-y-4">

                  {/* Delivery summary pill */}
                  <div className="bg-white border border-gray-200 rounded-2xl p-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-gray-900">{form.customerName} • {form.customerPhone}</p>
                        <p className="text-xs text-gray-500 truncate max-w-[240px]">{form.shippingAddress}, {form.district}, {form.division}</p>
                      </div>
                    </div>
                    <button onClick={() => setStep(2)} className="text-blue-600 text-xs font-semibold hover:underline flex items-center gap-1 flex-shrink-0">
                      <Edit3 className="w-3.5 h-3.5" /> Edit
                    </button>
                  </div>

                  <Card title="Payment Method" icon={<CreditCard className="w-4 h-4" />}>
                    <div className="space-y-2.5">
                      <PayOption selected={paymentMethod === 'CASH'} onClick={() => setPaymentMethod('CASH')}
                        icon={<Banknote className="w-5 h-5 text-green-600" />} iconBg="bg-green-100"
                        title="Cash on Delivery" sub="Pay when you receive the product"
                        badge="Most Popular" badgeColor="bg-green-100 text-green-700"
                      />
                      <PayOption selected={paymentMethod === 'MOBILE_BANKING'} onClick={() => setPaymentMethod('MOBILE_BANKING')}
                        icon={<Smartphone className="w-5 h-5 text-pink-600" />} iconBg="bg-pink-100"
                        title="Mobile Banking" sub="bKash / Nagad / Rocket"
                      />
                      <PayOption selected={paymentMethod === 'CARD'} onClick={() => setPaymentMethod('CARD')}
                        icon={<Building2 className="w-5 h-5 text-blue-600" />} iconBg="bg-blue-100"
                        title="Bank Transfer" sub="Direct to bank account"
                      />
                      <PayOption selected={paymentMethod === 'ONLINE'} onClick={() => setPaymentMethod('ONLINE')}
                        icon={<CreditCard className="w-5 h-5 text-violet-600" />} iconBg="bg-violet-100"
                        title="Online Payment" sub="Credit / Debit Card, SSL Commerz"
                        badge="Secure" badgeColor="bg-violet-100 text-violet-700"
                      />
                    </div>

                    <AnimatePresence>
                      {paymentMethod === 'MOBILE_BANKING' && (
                        <motion.div key="mb" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.22 }} className="overflow-hidden">
                          <div className="mt-4 bg-gradient-to-br from-pink-50 to-rose-50 border border-pink-200 rounded-2xl p-4 space-y-4">
                            <div className="flex gap-2">
                              {(['bKash', 'Nagad', 'Rocket'] as MobileProvider[]).map(p => (
                                <button key={p} onClick={() => setMobileProvider(p)}
                                  className={`flex-1 py-2 text-sm font-bold rounded-xl border-2 transition-all ${mobileProvider === p ? `bg-gradient-to-r ${PROVIDER_COLORS[p]} text-white border-transparent shadow-sm` : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}
                                >
                                  {p}
                                </button>
                              ))}
                            </div>
                            <div className="bg-white border border-pink-200 rounded-xl p-3.5 flex items-center justify-between">
                              <div>
                                <p className="text-xs text-gray-500">{mobileProvider} number — Send to</p>
                                <p className="font-black text-lg text-gray-900 tracking-wide mt-0.5">{MOBILE_NUMBERS[mobileProvider]}</p>
                                <p className="text-xs text-gray-500 mt-0.5">Amount: <strong className="text-pink-600">৳{grandTotal.toLocaleString()}</strong></p>
                              </div>
                              <button onClick={() => copyText(MOBILE_NUMBERS[mobileProvider], 'mbnum')} className="w-9 h-9 bg-pink-50 hover:bg-pink-100 rounded-xl flex items-center justify-center transition-colors">
                                {copiedField === 'mbnum' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-gray-400" />}
                              </button>
                            </div>
                            <div>
                              <label className="text-xs font-semibold text-gray-700 block mb-1.5">Your {mobileProvider} number <span className="text-red-500">*</span></label>
                              <input type="tel" value={mobilePhone} onChange={e => { setMobilePhone(e.target.value); setPaymentErrors(p => ({ ...p, mobilePhone: '' })); }} placeholder="Number you sent payment from"
                                className={`w-full border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400 transition-all bg-white ${paymentErrors.mobilePhone ? 'border-red-400' : 'border-gray-200'}`}
                              />
                              {paymentErrors.mobilePhone && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{paymentErrors.mobilePhone}</p>}
                            </div>
                            <div>
                              <label className="text-xs font-semibold text-gray-700 block mb-1.5">Transaction ID (TrxID) <span className="text-red-500">*</span></label>
                              <input type="text" value={transactionId} onChange={e => { setTransactionId(e.target.value.toUpperCase()); setPaymentErrors(p => ({ ...p, transactionId: '' })); }} placeholder="e.g. ABC12345678"
                                className={`w-full border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400 transition-all font-mono bg-white ${paymentErrors.transactionId ? 'border-red-400' : 'border-gray-200'}`}
                              />
                              {paymentErrors.transactionId && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{paymentErrors.transactionId}</p>}
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {paymentMethod === 'CARD' && (
                        <motion.div key="bank" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.22 }} className="overflow-hidden">
                          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-2xl p-4 space-y-3">
                            <div className="flex items-start gap-2 text-blue-700 bg-blue-100 rounded-xl p-2.5">
                              <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                              <p className="text-xs leading-relaxed">Please transfer <strong>৳{grandTotal.toLocaleString()}</strong> to the account below and share your reference number with us.</p>
                            </div>
                            {[
                              { label: 'Bank', value: BANK_INFO.bankName, key: 'bk' },
                              { label: 'Account Name', value: BANK_INFO.accountName, key: 'ba' },
                              { label: 'Account No.', value: BANK_INFO.accountNumber, key: 'bn' },
                              { label: 'Branch', value: BANK_INFO.branchName, key: 'bb' },
                              { label: 'Routing', value: BANK_INFO.routing, key: 'br' },
                            ].map(row => (
                              <div key={row.key} className="bg-white rounded-xl px-3.5 py-2.5 border border-blue-200 flex items-center justify-between gap-2">
                                <div>
                                  <p className="text-[11px] text-gray-400">{row.label}</p>
                                  <p className="font-semibold text-sm text-gray-900">{row.value}</p>
                                </div>
                                <button onClick={() => copyText(row.value, row.key)} className="w-8 h-8 bg-blue-50 hover:bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                  {copiedField === row.key ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5 text-gray-400" />}
                                </button>
                              </div>
                            ))}
                            <div>
                              <label className="text-xs font-semibold text-gray-700 block mb-1.5">Reference Number (Optional)</label>
                              <input type="text" value={transactionId} onChange={e => setTransactionId(e.target.value)} placeholder="Transfer reference number"
                                className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white transition-all" />
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {paymentMethod === 'ONLINE' && (
                        <motion.div key="online" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.22 }} className="overflow-hidden">
                          <div className="mt-4 bg-violet-50 border border-violet-200 rounded-2xl p-4 flex items-start gap-3">
                            <div className="w-8 h-8 bg-violet-100 rounded-xl flex items-center justify-center flex-shrink-0">
                              <Shield className="w-4 h-4 text-violet-600" />
                            </div>
                            <div>
                              <p className="font-semibold text-violet-800 text-sm mb-1">SSL Commerz Secure Payment</p>
                              <p className="text-xs text-violet-600 leading-relaxed">After submitting, you'll be redirected to SSL Commerz gateway. Visa, Mastercard, net banking and all methods supported.</p>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Card>

                  {/* Errors */}
                  <AnimatePresence>
                    {stockError.length > 0 && (
                      <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="bg-amber-50 border border-amber-300 rounded-2xl p-4">
                        <p className="font-bold text-amber-800 text-sm mb-2 flex items-center gap-2"><AlertCircle className="w-4 h-4" /> Stock Issue</p>
                        {stockError.map((name, i) => <p key={i} className="text-amber-700 text-sm">• {name} — out of stock</p>)}
                        <button onClick={() => setStep(1)} className="mt-2 text-blue-600 text-xs font-semibold hover:underline">Update Cart</button>
                      </motion.div>
                    )}
                    {orderError && (
                      <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                        <p className="text-red-700 text-sm">{orderError}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Place order */}
                  <button onClick={handlePlaceOrder} disabled={placing}
                    className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-extrabold text-base rounded-2xl transition-all shadow-xl shadow-green-100 flex items-center justify-center gap-2.5"
                  >
                    {placing
                      ? <><Loader2 className="w-5 h-5 animate-spin" /> Processing order...</>
                      : <><Lock className="w-4 h-4" /> ৳{grandTotal.toLocaleString()} — Confirm Order</>
                    }
                  </button>

                  <button onClick={() => setStep(2)} className="w-full text-center text-sm text-gray-500 hover:text-gray-700 flex items-center justify-center gap-1">
                    <ChevronLeft className="w-4 h-4" /> Delivery Information Edit
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Trust badges row */}
            <div className="grid grid-cols-3 gap-2 pt-2">
              {[
                { icon: <Shield className="w-4 h-4 text-green-600" />, label: 'SSL Secured' },
                { icon: <RefreshCw className="w-4 h-4 text-blue-600" />, label: '7-Day Return' },
                { icon: <Award className="w-4 h-4 text-amber-500" />, label: 'Genuine Products' },
              ].map(b => (
                <div key={b.label} className="flex flex-col items-center gap-1 bg-white border border-gray-200 rounded-xl py-2.5 px-2">
                  {b.icon}
                  <span className="text-[11px] text-gray-500 font-medium text-center leading-tight">{b.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ═══════ RIGHT COLUMN — Sticky Summary ══════ */}
          <div className="lg:sticky lg:top-[72px] space-y-4">

            {/* Mobile summary toggle */}
            <div className="lg:hidden">
              <button onClick={() => setSummaryExpanded(p => !p)}
                className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-3 flex items-center justify-between shadow-sm"
              >
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-blue-600" />
                  <span className="font-semibold text-sm text-gray-900">Order Summary</span>
                  <span className="text-xs bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded-full">{totalItems} items</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-blue-600">৳{grandTotal.toLocaleString()}</span>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${summaryExpanded ? 'rotate-180' : ''}`} />
                </div>
              </button>
            </div>

            {/* Summary card */}
            <div className={`${summaryExpanded ? 'block' : 'hidden'} lg:block`}>
              <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/60 flex items-center justify-between">
                  <span className="font-bold text-gray-900 text-sm flex items-center gap-2"><ShoppingCart className="w-4 h-4 text-blue-600" /> Order Summary</span>
                  <span className="text-xs text-gray-400">{totalItems} items</span>
                </div>

                {/* Mini items */}
                <div className="px-5 py-3 max-h-64 overflow-y-auto divide-y divide-gray-50">
                  {cart.map((item: CartItem) => (
                    <div key={item.id} className="py-2.5 flex items-center gap-3">
                      <div className="relative w-10 h-10 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 border border-gray-100">
                        {item.image ? <Image src={item.image} alt={item.name} fill className="object-cover" sizes="40px" /> : <Package className="w-5 h-5 text-gray-300 m-auto" />}
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center">{item.quantity}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-800 line-clamp-1">{item.name}</p>
                        <p className="text-[11px] text-gray-400">{item.brand}</p>
                      </div>
                      <span className="text-xs font-bold text-gray-900 flex-shrink-0">৳{((item.offerPrice ?? item.price) * item.quantity).toLocaleString()}</span>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="px-5 py-4 border-t border-gray-100 space-y-2.5">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Subtotal</span>
                    <span className="font-semibold text-gray-900">৳{subTotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <Truck className="w-3.5 h-3.5" /> Delivery {form.division ? `(${form.division === 'Dhaka' ? 'Dhaka' : 'Outside'})` : ''}
                    </span>
                    <span className="font-semibold text-gray-900">৳{shippingCost}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span className="flex items-center gap-1"><Tag className="w-3.5 h-3.5" />Coupon Discount</span>
                      <span className="font-bold">-৳{discount}</span>
                    </div>
                  )}
                  {savings > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span className="flex items-center gap-1"><Gift className="w-3.5 h-3.5" />Offer Savings</span>
                      <span className="font-bold">-৳{savings.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="border-t border-gray-200 pt-2.5 flex justify-between">
                    <span className="font-extrabold text-gray-900">Total</span>
                    <span className="font-extrabold text-xl text-blue-600">৳{grandTotal.toLocaleString()}</span>
                  </div>
                </div>

                {/* Trust micro-badges */}
                <div className="px-5 pb-4 border-t border-gray-100 pt-3">
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { icon: <Lock className="w-3 h-3 text-green-500" />, text: 'Secure Payment' },
                      { icon: <Truck className="w-3 h-3 text-blue-500" />, text: 'Fast Delivery' },
                      { icon: <RefreshCw className="w-3 h-3 text-amber-500" />, text: 'Easy Returns' },
                      { icon: <Star className="w-3 h-3 text-yellow-500" />, text: 'Genuine Products' },
                    ].map(b => (
                      <div key={b.text} className="flex items-center gap-1.5 text-[11px] text-gray-500">{b.icon} {b.text}</div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Help */}
            <div className="bg-white border border-gray-200 rounded-2xl px-5 py-4">
              <p className="text-xs font-bold text-gray-700 mb-1 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-blue-600" /> Need help?
              </p>
              <p className="text-xs text-gray-500"><strong className="text-gray-700">01700-000000</strong> (9am–9pm, 7 days)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
//  Sub-components
// \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

function Card({ title, icon, badge, children }: {
  title: string; icon?: React.ReactNode; badge?: string; children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-3.5 border-b border-gray-100 bg-gray-50/60">
        {icon && <span className="text-blue-600">{icon}</span>}
        <span className="font-bold text-sm text-gray-900">{title}</span>
        {badge && <span className="ml-auto text-xs font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{badge}</span>}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function Field({ label, required, error, children, className = '' }: {
  label: string; required?: boolean; error?: string; children: React.ReactNode; className?: string;
}) {
  return (
    <div className={className}>
      <label className="block text-xs font-semibold text-gray-700 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      <AnimatePresence>
        {error && (
          <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex items-center gap-1 text-xs text-red-500 mt-1"
          >
            <AlertCircle className="w-3 h-3" /> {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

function FieldInput({ icon, type, value, onChange, placeholder, hasError }: {
  icon?: React.ReactNode; type: string; value: string;
  onChange: (v: string) => void; placeholder: string; hasError: boolean;
}) {
  return (
    <div className="relative">
      {icon && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{icon}</span>}
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className={`w-full ${icon ? 'pl-9' : 'pl-4'} pr-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-50 focus:bg-white ${hasError ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}
      />
    </div>
  );
}

function SelectInput({ value, onChange, placeholder, options, disabled, hasError }: {
  value: string; onChange: (v: string) => void; placeholder: string;
  options: string[]; disabled?: boolean; hasError: boolean;
}) {
  return (
    <div className="relative">
      <select value={value} onChange={e => onChange(e.target.value)} disabled={disabled}
        className={`w-full appearance-none pl-4 pr-9 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-50 focus:bg-white cursor-pointer disabled:cursor-not-allowed disabled:opacity-55 ${hasError ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}
      >
        <option value="">{placeholder}</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
    </div>
  );
}

function PayOption({ selected, onClick, icon, iconBg, title, sub, badge, badgeColor }: {
  selected: boolean; onClick: () => void; icon: React.ReactNode; iconBg: string;
  title: string; sub: string; badge?: string; badgeColor?: string;
}) {
  return (
    <button type="button" onClick={onClick}
      className={`w-full text-left p-3.5 rounded-xl border-2 transition-all ${selected ? 'border-blue-500 bg-blue-50/60 shadow-sm' : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-white'}`}
    >
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 flex-shrink-0 rounded-xl flex items-center justify-center ${iconBg}`}>{icon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`font-bold text-sm ${selected ? 'text-blue-700' : 'text-gray-800'}`}>{title}</span>
            {badge && <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${badgeColor}`}>{badge}</span>}
          </div>
          <p className="text-xs text-gray-500 mt-0.5">{sub}</p>
        </div>
        <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 transition-all flex items-center justify-center ${selected ? 'border-blue-500 bg-blue-500' : 'border-gray-300'}`}>
          {selected && <div className="w-2 h-2 rounded-full bg-white" />}
        </div>
      </div>
    </button>
  );
}
