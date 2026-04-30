'use client';

import { useState } from 'react';
import {
  Minus,
  Plus,
  Trash2,
  CreditCard,
  Banknote,
  Smartphone,
  ShoppingCart,
  Pause,
  X,
  Receipt,
  User,
  Percent,
  DollarSign,
  Package,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  UserCheck,
  PlusCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { CartItem } from '@/lib/actions/pos-actions';
import type { POSCartState } from '@/lib/hooks/use-pos-cart';
import { DeleteItemDialog } from './delete-item-dialog';
import { CustomerSearchCombobox, type POSCustomerOption } from './customer-search-combobox';
import Image from 'next/image';

interface POSCartPanelProps {
  cart: POSCartState;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  grandTotal: number;
  change: number;
  totalItems: number;
  heldOrders: POSCartState[];
  onUpdateQuantity: (index: number, quantity: number) => void;
  onRemoveItem: (index: number) => void;
  onClearCart: () => void;
  onRequestClear: () => void;
  onHoldOrder: () => void;
  onResumeOrder: (index: number) => void;
  onSetDiscount: (amount: number, type: 'fixed' | 'percent') => void;
  onSetPaymentMethod: (method: 'CASH' | 'MOBILE_BANKING' | 'CARD' | 'MIXED') => void;
  onSetAmountReceived: (amount: number) => void;
  onSetCustomerInfo: (name: string, phone: string) => void;
  onSetNote: (note: string) => void;
  onSetPaidAmount: (amount: number | null) => void;
  onSetGuarantorInfo: (name: string, phone: string, relation: string, address: string) => void;
  onSetItemPrice?: (index: number, price: number) => void;
  onResetItemPrice?: (index: number) => void;
  onCompleteSale: () => void;
  isProcessing: boolean;
  customers: POSCustomerOption[];
  onCustomerCreated?: () => void;
}

const paymentMethods = [
  { id: 'CASH' as const, label: 'Cash', icon: Banknote, color: 'bg-green-50 text-green-700 border-green-200' },
  { id: 'MOBILE_BANKING' as const, label: 'Mobile Banking', icon: Smartphone, color: 'bg-pink-50 text-pink-700 border-pink-200' },
  { id: 'CARD' as const, label: 'Card', icon: CreditCard, color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { id: 'MIXED' as const, label: 'Mixed', icon: DollarSign, color: 'bg-purple-50 text-purple-700 border-purple-200' },
];

export function POSCartPanel({
  cart,
  subtotal,
  discountAmount,
  taxAmount,
  grandTotal,
  change,
  totalItems,
  heldOrders,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onRequestClear,
  onHoldOrder,
  onResumeOrder,
  onSetDiscount,
  onSetPaymentMethod,
  onSetAmountReceived,
  onSetCustomerInfo,
  onSetNote,
  onSetPaidAmount,
  onSetGuarantorInfo,
  onSetItemPrice,
  onResetItemPrice,
  onCompleteSale,
  isProcessing,
  customers,
  onCustomerCreated,
}: POSCartPanelProps) {
  const [showCustomer, setShowCustomer] = useState(false);
  const [showDiscount, setShowDiscount] = useState(false);
  const [showDueForm, setShowDueForm] = useState(false);
  const [showGuarantor, setShowGuarantor] = useState(false);
  const [discountInput, setDiscountInput] = useState('');
  const [discountTypeLocal, setDiscountTypeLocal] = useState<'fixed' | 'percent'>('fixed');
  const [paidInput, setPaidInput] = useState('');
  const [guarantorName, setGuarantorName] = useState('');
  const [guarantorPhone, setGuarantorPhone] = useState('');
  const [guarantorRelation, setGuarantorRelation] = useState('');
  const [guarantorAddress, setGuarantorAddress] = useState('');
  const [editingPriceIndex, setEditingPriceIndex] = useState<number | null>(null);
  const [priceInput, setPriceInput] = useState('');
  
  // State for delete confirmation
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);

  const handleApplyDiscount = () => {
    const val = parseFloat(discountInput) || 0;
    onSetDiscount(val, discountTypeLocal);
    setShowDiscount(false);
  };

  const handleApplyPaid = () => {
    const val = parseFloat(paidInput);
    if (!isNaN(val) && val >= 0) {
      onSetPaidAmount(val);
    } else {
      onSetPaidAmount(null);
    }
  };

  const handleGuarantorChange = (field: 'name' | 'phone' | 'relation' | 'address', value: string) => {
    const n = field === 'name' ? value : guarantorName;
    const p = field === 'phone' ? value : guarantorPhone;
    const r = field === 'relation' ? value : guarantorRelation;
    const a = field === 'address' ? value : guarantorAddress;
    if (field === 'name') setGuarantorName(value);
    if (field === 'phone') setGuarantorPhone(value);
    if (field === 'relation') setGuarantorRelation(value);
    if (field === 'address') setGuarantorAddress(value);
    onSetGuarantorInfo(n, p, r, a);
  };

  const quickAmounts = [100, 500, 1000, 2000, 5000];

  // Due calculation based on amount received
  const cashDueAmount = cart.paymentMethod === 'CASH' && cart.amountReceived > 0 && cart.amountReceived < grandTotal
    ? grandTotal - cart.amountReceived
    : 0;

  // For manual due (via the Due toggle) — paidAmount=0 means fully on due
  const manualDueAmount = cart.paidAmount !== null && cart.paidAmount <= grandTotal
    ? grandTotal - cart.paidAmount
    : 0;

  const activeDueAmount = cashDueAmount > 0 ? cashDueAmount : manualDueAmount;

  // Due form validity check
  const dueFormFilled =
    cart.customerName.trim().length > 0 &&
    cart.customerPhone.trim().length > 0 &&
    guarantorName.trim().length > 0 &&
    guarantorPhone.trim().length > 0;

  // Complete sale button should be disabled when there's due and form not filled
  const hasDue = activeDueAmount > 0;
  const canCompleteSale = !hasDue || dueFormFilled;

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-bold text-gray-900">Cart</h2>
          {totalItems > 0 && (
            <Badge className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
              {totalItems}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          {heldOrders.length > 0 && (
            <div className="relative group">
              <Button variant="ghost" size="sm" className="text-amber-600 hover:bg-amber-50 gap-1 text-xs font-semibold">
                <Pause className="h-3.5 w-3.5" />
                Held ({heldOrders.length})
              </Button>
              <div className="absolute right-0 top-full mt-1 w-56 bg-white border border-gray-200 rounded-xl shadow-xl z-50 hidden group-hover:block p-2 space-y-1">
                {heldOrders.map((order, idx) => (
                  <button
                    key={idx}
                    onClick={() => onResumeOrder(idx)}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-blue-50 text-sm transition-colors"
                  >
                    <span className="font-semibold text-gray-900">Order #{idx + 1}</span>
                    <span className="text-gray-500 ml-2">
                      {order.items.length} items • ৳{order.items.reduce((s, i) => s + i.price * i.quantity, 0).toLocaleString()}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onHoldOrder}
            disabled={cart.items.length === 0}
            className="text-gray-500 hover:bg-gray-100 gap-1 text-xs"
          >
            <Pause className="h-3.5 w-3.5" />
            Hold
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRequestClear}
            disabled={cart.items.length === 0}
            className="text-red-500 hover:bg-red-50 gap-1 text-xs"
          >
            <X className="h-3.5 w-3.5" />
            Clear
          </Button>
        </div>
      </div>

      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {cart.items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 py-16">
            <Package className="h-16 w-16 mb-4 opacity-20" />
            <p className="text-base font-semibold">Cart is empty</p>
            <p className="text-sm mt-1">Scan or search products to add</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {cart.items.map((item, index) => (
              <div
                key={`${item.productId}-${item.variantId || ''}`}
                className="px-4 py-3 flex items-start gap-3 hover:bg-gray-50/50 transition-colors group"
              >
                {/* Remove */}
                <button
                  onClick={() => setItemToDelete(index)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-red-500 hover:text-white hover:bg-red-500 bg-red-50 transition-colors shrink-0 mt-1 active:scale-90"
                  title="Remove Item"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>

                {/* Image */}
                <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-100 shrink-0 border border-gray-200">
                  {item.image ? (
                    <Image src={item.image} alt={item.name} fill className="object-cover" sizes="48px" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="h-5 w-5 text-gray-300" />
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0 flex flex-col gap-1">
                  <p className="text-sm font-bold text-gray-900 truncate leading-tight min-h-[1.1rem]">
                    {item.name}
                  </p>
                  {item.variantName && (
                    <p className="text-[11px] text-gray-500">{item.variantName}</p>
                  )}

                  {/* Price (editable) and quantity summary */}
                  <div className="flex items-center gap-3 min-w-0 whitespace-nowrap flex-wrap sm:flex-nowrap">
                    {editingPriceIndex === index ? (
                      <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap min-w-0">
                        <Input
                          type="number"
                          value={priceInput}
                          onChange={(e) => setPriceInput(e.target.value)}
                          className="h-8 w-24 text-sm shrink-0"
                        />
                        <button
                          onClick={() => {
                            const val = parseFloat(priceInput) || 0;
                            if (val > 0 && typeof onSetItemPrice === 'function') {
                              onSetItemPrice(index, val);
                              setEditingPriceIndex(null);
                            }
                          }}
                          className="px-2 py-1 bg-green-600 text-white rounded-lg text-xs font-semibold shrink-0"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            if (typeof onResetItemPrice === 'function') {
                              onResetItemPrice(index);
                              setPriceInput(String(item.originalPrice));
                            }
                          }}
                          className="px-2 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-semibold shrink-0"
                        >
                          Reset
                        </button>
                        <button
                          onClick={() => {
                            setEditingPriceIndex(null);
                            setPriceInput('');
                          }}
                          className="px-2 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-semibold shrink-0"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <>
                        <span className="text-xs font-semibold text-blue-600 shrink-0 leading-none">
                          ৳{item.price.toLocaleString()}
                        </span>
                        <span className="text-xs text-gray-500 shrink-0 leading-none">× {item.quantity}</span>
                        <button
                          onClick={() => {
                            setEditingPriceIndex(index);
                            setPriceInput(String(item.price));
                          }}
                          className="text-xs text-gray-400 px-2 py-0.5 rounded hover:bg-gray-50 shrink-0 leading-none"
                        >
                          Edit
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center gap-2 shrink-0 self-start mt-1">
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => onUpdateQuantity(index, item.quantity - 1)}
                      className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors active:scale-90"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-8 text-center text-sm font-bold text-gray-900">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => onUpdateQuantity(index, item.quantity + 1)}
                      disabled={item.quantity >= item.maxStock}
                      className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed active:scale-90"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Line Total */}
                <div className="text-right shrink-0 self-start mt-1 ml-auto">
                  <p className="text-sm font-black text-gray-900 leading-none">
                    ৳{(item.price * item.quantity).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Section - Summary & Checkout */}
      {cart.items.length > 0 && (
        <div className="border-t-2 border-gray-100 overflow-y-auto max-h-[60vh] shrink-0">
          {/* Customer & Discount toggles */}
          <div className="px-4 pt-3 flex gap-2 flex-wrap">
            <button
              onClick={() => setShowCustomer(!showCustomer)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors',
                showCustomer
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
              )}
            >
              <User className="h-3.5 w-3.5" />
              Customer
              {showCustomer ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
            <button
              onClick={() => setShowDiscount(!showDiscount)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors',
                showDiscount || discountAmount > 0
                  ? 'bg-green-50 text-green-700 border-green-200'
                  : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
              )}
            >
              <Percent className="h-3.5 w-3.5" />
              Discount
              {discountAmount > 0 && <span className="bg-green-200 text-green-800 px-1.5 py-0 rounded text-[10px]">-৳{discountAmount.toLocaleString()}</span>}
            </button>
          </div>

          {/* Customer Info */}
          {showCustomer && (
            <div className="px-4 py-2 space-y-2 animate-in slide-in-from-top-2 fade-in duration-200">
              <CustomerSearchCombobox
                customers={customers}
                selectedName={cart.customerName}
                selectedPhone={cart.customerPhone}
                onSelect={(name, phone) => onSetCustomerInfo(name, phone)}
                onClear={() => onSetCustomerInfo('', '')}
                onCustomerCreated={onCustomerCreated}
              />
              {/* Phone input shown only when name entered but no phone yet */}
              {cart.customerName && !cart.customerPhone && (
                <Input
                  placeholder="Phone number"
                  value={cart.customerPhone}
                  onChange={(e) => onSetCustomerInfo(cart.customerName, e.target.value)}
                  className="h-9 text-sm"
                />
              )}
            </div>
          )}

          {/* Discount Section */}
          {showDiscount && (
            <div className="px-4 py-2 flex gap-2 items-center animate-in slide-in-from-top-2 fade-in duration-200">
              <div className="flex border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => setDiscountTypeLocal('fixed')}
                  className={cn(
                    'px-3 py-1.5 text-xs font-semibold transition-colors',
                    discountTypeLocal === 'fixed' ? 'bg-gray-900 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'
                  )}
                >
                  ৳
                </button>
                <button
                  onClick={() => setDiscountTypeLocal('percent')}
                  className={cn(
                    'px-3 py-1.5 text-xs font-semibold transition-colors',
                    discountTypeLocal === 'percent' ? 'bg-gray-900 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'
                  )}
                >
                  %
                </button>
              </div>
              <Input
                type="number"
                placeholder="Amount"
                value={discountInput}
                onChange={(e) => setDiscountInput(e.target.value)}
                className="h-9 text-sm flex-1"
              />
              <Button size="sm" onClick={handleApplyDiscount} className="h-9 bg-green-600 hover:bg-green-700 text-white text-xs">
                Apply
              </Button>
            </div>
          )}

          {/* Summary */}
          <div className="px-4 py-3 space-y-1.5">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal ({totalItems} items)</span>
              <span className="font-semibold">৳{subtotal.toLocaleString()}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Discount</span>
                <span className="font-semibold">-৳{discountAmount.toLocaleString()}</span>
              </div>
            )}
            {taxAmount > 0 && (
              <div className="flex justify-between text-sm text-gray-600">
                <span>Tax</span>
                <span className="font-semibold">৳{taxAmount.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between text-xl font-black text-gray-900 pt-2 border-t border-gray-200">
              <span>Total</span>
              <span>৳{grandTotal.toLocaleString()}</span>
            </div>
          </div>

          {/* Payment Method */}
          <div className="px-4 pb-2">
            <div className="grid grid-cols-4 gap-1.5">
              {paymentMethods.map((method) => (
                <button
                  key={method.id}
                  onClick={() => onSetPaymentMethod(method.id)}
                  className={cn(
                    'flex flex-col items-center gap-1 px-2 py-2 rounded-xl border-2 transition-all text-xs font-semibold',
                    cart.paymentMethod === method.id
                      ? `${method.color} border-current shadow-sm`
                      : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                  )}
                >
                  <method.icon className="h-4 w-4" />
                  {method.label}
                </button>
              ))}
            </div>
          </div>

          {/* Cash Received */}
          {cart.paymentMethod === 'CASH' && (
            <div className="px-4 pb-2 space-y-2 animate-in fade-in duration-150">
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Amount received"
                  value={cart.amountReceived || ''}
                  onChange={(e) => onSetAmountReceived(parseFloat(e.target.value) || 0)}
                  className="h-11 text-base font-bold flex-1"
                />
                <Button
                  variant="outline"
                  className="h-11 px-4 font-bold text-sm"
                  onClick={() => onSetAmountReceived(grandTotal)}
                >
                  Exact
                </Button>
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {quickAmounts.map((amt) => (
                  <button
                    key={amt}
                    onClick={() => onSetAmountReceived(amt)}
                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-bold text-gray-700 transition-colors active:scale-95"
                  >
                    ৳{amt.toLocaleString()}
                  </button>
                ))}
              </div>
              {cart.amountReceived > 0 && (
                cashDueAmount > 0 ? (
                  /* Due detected - show warning with Add Due button */
                  <div className="border border-red-200 bg-red-50 rounded-xl px-4 py-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm font-bold text-red-600 uppercase tracking-wider">Due Amount</span>
                        <p className="text-2xl font-black text-red-700 mt-0.5">৳{cashDueAmount.toLocaleString()}</p>
                        <p className="text-xs text-red-500 mt-0.5">
                          Paid: ৳{cart.amountReceived.toLocaleString()} / Total: ৳{grandTotal.toLocaleString()}
                        </p>
                      </div>
                      {!showDueForm && (
                        <button
                          onClick={() => {
                            setShowDueForm(true);
                            setShowCustomer(false);
                          }}
                          className="flex items-center gap-1.5 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-colors active:scale-95"
                        >
                          <PlusCircle className="h-3.5 w-3.5" />
                          Add Due
                        </button>
                      )}
                    </div>

                    {/* Due Form (customer + guarantor) */}
                    {showDueForm && (
                      <div className="space-y-2 pt-1 border-t border-red-200 animate-in slide-in-from-top-2 fade-in duration-200">
                        <p className="text-xs font-bold text-red-700 flex items-center gap-1">
                          <User className="h-3 w-3" /> Customer Information
                        </p>
                        <CustomerSearchCombobox
                          customers={customers}
                          selectedName={cart.customerName}
                          selectedPhone={cart.customerPhone}
                          onSelect={(name, phone) => onSetCustomerInfo(name, phone)}
                          onClear={() => onSetCustomerInfo('', '')}
                          onCustomerCreated={onCustomerCreated}
                        />
                        {/* If name set but phone missing, show phone input */}
                        {cart.customerName && !cart.customerPhone && (
                          <Input
                            placeholder="Phone number *"
                            value={cart.customerPhone}
                            onChange={(e) => onSetCustomerInfo(cart.customerName, e.target.value)}
                            className="h-8 text-xs"
                          />
                        )}
                        <p className="text-xs font-bold text-amber-700 flex items-center gap-1 mt-1">
                          <UserCheck className="h-3 w-3" /> Guarantor Information
                        </p>
                        <Input
                          placeholder="Guarantor name *"
                          value={guarantorName}
                          onChange={(e) => handleGuarantorChange('name', e.target.value)}
                          className="h-8 text-xs"
                        />
                        <Input
                          placeholder="Guarantor phone *"
                          value={guarantorPhone}
                          onChange={(e) => handleGuarantorChange('phone', e.target.value)}
                          className="h-8 text-xs"
                        />
                        <Input
                          placeholder="Relation (optional)"
                          value={guarantorRelation}
                          onChange={(e) => handleGuarantorChange('relation', e.target.value)}
                          className="h-8 text-xs"
                        />
                        <Input
                          placeholder="Address (optional)"
                          value={guarantorAddress}
                          onChange={(e) => handleGuarantorChange('address', e.target.value)}
                          className="h-8 text-xs"
                        />
                        {dueFormFilled && (
                          <p className="text-xs text-green-700 font-semibold flex items-center gap-1">
                            ✓ Due details filled — you can complete the sale
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  /* No due / change */
                  <div className="flex flex-col items-center justify-center border rounded-xl px-4 py-3 bg-green-50 border-green-200">
                    <span className="text-sm font-bold uppercase tracking-wider text-green-700">Change</span>
                    <span className="text-3xl font-black mt-0.5 text-green-800">
                      ৳{change.toLocaleString()}
                    </span>
                  </div>
                )
              )}
            </div>
          )}

          {/* Full Due (বাকিতে বিক্রি) — shown when no cash amount entered and no manual paidAmount set */}
          {cart.paymentMethod !== 'CASH' || cart.amountReceived === 0 ? (
            manualDueAmount > 0 ? (
              /* Manual due form active */
              <div className="px-4 pb-2">
                <div className="border border-red-200 bg-red-50 rounded-xl px-4 py-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-bold text-red-600 uppercase tracking-wider">বাকি পরিমাণ</span>
                      <p className="text-2xl font-black text-red-700 mt-0.5">৳{manualDueAmount.toLocaleString()}</p>
                      <p className="text-xs text-red-500 mt-0.5">
                        নগদ: ৳{(cart.paidAmount ?? 0).toLocaleString()} / মোট: ৳{grandTotal.toLocaleString()}
                      </p>
                    </div>
                    <button
                      onClick={() => { onSetPaidAmount(null); setShowDueForm(false); }}
                      className="flex items-center gap-1 px-2 py-1.5 bg-white border border-red-300 hover:bg-red-100 text-red-600 rounded-lg text-xs font-bold transition-colors"
                    >
                      <X className="h-3 w-3" /> বাতিল
                    </button>
                  </div>
                  {/* Due Form */}
                  <div className="space-y-2 pt-1 border-t border-red-200">
                    <p className="text-xs font-bold text-red-700 flex items-center gap-1">
                      <User className="h-3 w-3" /> কাস্টমার তথ্য
                    </p>
                    <CustomerSearchCombobox
                      customers={customers}
                      selectedName={cart.customerName}
                      selectedPhone={cart.customerPhone}
                      onSelect={(name, phone) => onSetCustomerInfo(name, phone)}
                      onClear={() => onSetCustomerInfo('', '')}
                      onCustomerCreated={onCustomerCreated}
                    />
                    <p className="text-xs font-bold text-amber-700 flex items-center gap-1 mt-1">
                      <UserCheck className="h-3 w-3" /> জামিনদার তথ্য
                    </p>
                    <Input placeholder="জামিনদারের নাম *" value={guarantorName} onChange={(e) => handleGuarantorChange('name', e.target.value)} className="h-8 text-xs" />
                    <Input placeholder="জামিনদারের ফোন *" value={guarantorPhone} onChange={(e) => handleGuarantorChange('phone', e.target.value)} className="h-8 text-xs" />
                    <Input placeholder="সম্পর্ক (ঐচ্ছিক)" value={guarantorRelation} onChange={(e) => handleGuarantorChange('relation', e.target.value)} className="h-8 text-xs" />
                    <Input placeholder="ঠিকানা (ঐচ্ছিক)" value={guarantorAddress} onChange={(e) => handleGuarantorChange('address', e.target.value)} className="h-8 text-xs" />
                    {dueFormFilled && (
                      <p className="text-xs text-green-700 font-semibold flex items-center gap-1">✓ তথ্য পূরণ হয়েছে — বিক্রি সম্পন্ন করতে পারবেন</p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* Show 'বাকিতে বিক্রি' button */
              <div className="px-4 pb-2">
                <button
                  onClick={() => { onSetPaidAmount(0); setShowDueForm(true); }}
                  className="w-full flex items-center justify-center gap-2 h-10 border-2 border-dashed border-red-300 hover:border-red-500 hover:bg-red-50 text-red-500 hover:text-red-700 rounded-xl text-sm font-semibold transition-colors"
                >
                  <PlusCircle className="h-4 w-4" />
                  বাকিতে বিক্রি করুন
                </button>
              </div>
            )
          ) : null}

          {/* Complete Sale Button */}
          <div className="px-4 pb-4 pt-2">
            {hasDue && !dueFormFilled && (
              <p className="text-xs text-red-600 font-semibold text-center mb-2 flex items-center justify-center gap-1">
                <AlertCircle className="h-3.5 w-3.5" />
                Fill customer &amp; guarantor details to complete sale with due
              </p>
            )}
            <Button
              onClick={() => onCompleteSale()}
              disabled={
                isProcessing ||
                cart.items.length === 0 ||
                !canCompleteSale
              }
              className="w-full h-14 bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-black text-lg shadow-xl shadow-blue-200 transition-all disabled:opacity-50 disabled:shadow-none active:scale-[0.98]"
            >
              {isProcessing ? (
                <span className="flex items-center gap-2">
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Receipt className="h-5 w-5" />
                  Complete Sale • ৳{grandTotal.toLocaleString()}
                  <span className="text-xs opacity-70 font-medium ml-1">(Ctrl+Enter)</span>
                </span>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteItemDialog
        open={itemToDelete !== null}
        onOpenChange={(open) => !open && setItemToDelete(null)}
        onConfirm={() => {
          if (itemToDelete !== null) {
            onRemoveItem(itemToDelete);
            setItemToDelete(null);
          }
        }}
        itemName={itemToDelete !== null ? cart.items[itemToDelete]?.name : undefined}
      />
    </div>
  );
}

