'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { usePOSCart } from '@/lib/hooks/use-pos-cart';
import { POSProductGrid } from '@/components/admin/pos/pos-product-grid';
import { POSCartPanel } from '@/components/admin/pos/pos-cart-panel';
import { POSReceipt } from '@/components/admin/pos/pos-receipt';
import { POSDailySummary } from '@/components/admin/pos/pos-daily-summary';
import { MixedPaymentModal } from '@/components/admin/pos/mixed-payment-modal';
import { PaymentDetailsModal } from '@/components/admin/pos/payment-details-modal';
import { VariantPickerModal } from '@/components/admin/pos/variant-picker-modal';
import { ClearCartDialog } from '@/components/admin/pos/clear-cart-dialog';
import { completeSale, type POSProduct, type CompleteSaleInput } from '@/lib/actions/pos-actions';
import { getPOSCustomerList } from '@/lib/actions/ledger-actions';
import type { POSCustomerOption } from '@/components/admin/pos/customer-search-combobox';
import type { InvoiceSettings } from '@/lib/actions/invoice-settings-actions';
import { toast } from 'sonner';
import { Maximize, Minimize, Keyboard, BarChart2, Users, CreditCard, Grid3X3, ShoppingCart } from 'lucide-react';
import { cn } from '@/lib/utils';

interface POSClientProps {
  categories: { id: string; name: string }[];
  initialDailySummary: {
    totalSales: number;
    totalOrders: number;
    totalItems: number;
  };
  invoiceSettings: InvoiceSettings;
}

export function POSClient({ categories, initialDailySummary, invoiceSettings }: POSClientProps) {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [dailySummary, setDailySummary] = useState(initialDailySummary);
  const [posCustomers, setPosCustomers] = useState<POSCustomerOption[]>([]);

  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
      // `isFullscreen` is synced via the `fullscreenchange` listener below.
    } catch {
      // Ignore (e.g., request not initiated by a user gesture)
      setIsFullscreen(Boolean(document.fullscreenElement));
    }
  }, []);

  // Keep fullscreen UI state in sync even if user exits with Esc
  useEffect(() => {
    const sync = () => setIsFullscreen(Boolean(document.fullscreenElement));
    sync();
    document.addEventListener('fullscreenchange', sync);
    return () => document.removeEventListener('fullscreenchange', sync);
  }, []);

  // Fetch POS customers for the combobox
  useEffect(() => {
    getPOSCustomerList().then((data) => setPosCustomers(data)).catch(() => {});
  }, []);

  const [receiptData, setReceiptData] = useState<any>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [showMixedPayment, setShowMixedPayment] = useState(false);
  const [showPaymentDetails, setShowPaymentDetails] = useState(false);
  const [showVariantPicker, setShowVariantPicker] = useState(false);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<POSProduct | null>(null);
  const [mobileView, setMobileView] = useState<'products' | 'cart'>('products');

  const {
    cart,
    heldOrders,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    holdOrder,
    resumeOrder,
    setDiscount,
    setPaymentMethod,
    setAmountReceived,
    setCustomerInfo,
    setNote,
    setPaidAmount,
    setGuarantorInfo,
    subtotal,
    discountAmount,
    taxAmount,
    grandTotal,
    change,
    totalItems,
  } = usePOSCart();

  const handleProductSelect = useCallback(
    (product: POSProduct, variantId?: string) => {
      // If product has multiple variants and no variant selected, show picker
      if (!variantId && product.variants.length > 1) {
        setSelectedProduct(product);
        setShowVariantPicker(true);
        return;
      }
      
      addItem(product, variantId);
      setMobileView('cart'); // auto-switch to cart on mobile
      // Play a subtle sound effect (optional)
      try {
        const audio = new Audio('/sounds/beep.mp3');
        audio.volume = 0.3;
        audio.play().catch(() => {});
      } catch {}
    },
    [addItem]
  );

  const handleCompleteSale = useCallback(async (mixedBreakdown?: { 
    cash: number; 
    card: number; 
    mobile: number;
    mobileTrxId?: string;
    mobileNumber?: string;
    mobileProvider?: string;
    cardTrxId?: string;
    cardLast4?: string;
  }) => {
    if (cart.items.length === 0) return;
    
    console.log('Payment method:', cart.paymentMethod);
    console.log('Mixed breakdown:', mixedBreakdown);
    
    // Check if it's mixed payment and show modal if not provided
    if (cart.paymentMethod === 'MIXED' && !mixedBreakdown) {
      console.log('Opening mixed payment modal');
      setShowMixedPayment(true);
      return;
    }

    // Check if it's Mobile or Card payment and details not provided (we check if mobileTrxId is missing for Mobile)
    // For Card, we might just want to show confirmation even if no extra data needed yet
    // Note: mixedBreakdown is reused here to pass single payment details for simplicity, or we can check logic
    if ((cart.paymentMethod === 'MOBILE_BANKING' || cart.paymentMethod === 'CARD') && !mixedBreakdown) {
       // Using mixedBreakdown arg to pass details from PaymentDetailsModal as well
       setShowPaymentDetails(true);
       return;
    }
    
    if (cart.paymentMethod === 'CASH' && cart.amountReceived < grandTotal) {
      // Check if it's a due/partial payment with customer info filled
      const hasCustomerInfo = cart.customerName.trim().length > 0 && cart.customerPhone.trim().length > 0;
      const hasGuarantorInfo = cart.guarantorName.trim().length > 0 && cart.guarantorPhone.trim().length > 0;

      if (!hasCustomerInfo || !hasGuarantorInfo) {
        toast.error('Please fill customer and guarantor details for due payment');
        return;
      }

      // Sale will proceed as partial/due payment — amounts computed below
    }

    setIsProcessing(true);
    try {
      // Determine paid/due amounts
      const isCashDue = cart.paymentMethod === 'CASH' && cart.amountReceived > 0 && cart.amountReceived < grandTotal;
      const effectivePaidAmount = isCashDue
        ? cart.amountReceived
        : (cart.paidAmount !== null ? cart.paidAmount : undefined);
      const effectiveDueAmount = isCashDue
        ? grandTotal - cart.amountReceived
        : (cart.paidAmount !== null && cart.paidAmount < grandTotal ? grandTotal - cart.paidAmount : undefined);
      const effectivePosStatus = isCashDue
        ? 'PARTIAL'
        : (cart.paidAmount !== null
            ? (cart.paidAmount <= 0 ? 'DUE' : cart.paidAmount < grandTotal ? 'PARTIAL' : 'PAID')
            : undefined);

      const input: CompleteSaleInput = {
        items: cart.items,
        paymentMethod: cart.paymentMethod,
        subtotal,
        discount: discountAmount,
        tax: taxAmount,
        grandTotal,
        amountReceived: cart.paymentMethod === 'CASH' ? cart.amountReceived : grandTotal,
        change: cart.paymentMethod === 'CASH' && cart.amountReceived >= grandTotal ? change : 0,
        customerName: cart.customerName || undefined,
        customerPhone: cart.customerPhone || undefined,
        note: cart.note || undefined,
        paidAmount: effectivePaidAmount,
        dueAmount: effectiveDueAmount,
        posPaymentStatus: effectivePosStatus,
        guarantorName: cart.guarantorName || undefined,
        guarantorPhone: cart.guarantorPhone || undefined,
        guarantorRelation: cart.guarantorRelation || undefined,
        guarantorAddress: cart.guarantorAddress || undefined,
        ...(mixedBreakdown && {
          cashPayment: mixedBreakdown.cash,
          cardPayment: mixedBreakdown.card,
          mobilePayment: mixedBreakdown.mobile,
          mobileTrxId: mixedBreakdown.mobileTrxId,
          mobileNumber: mixedBreakdown.mobileNumber,
          mobileProvider: mixedBreakdown.mobileProvider,
          cardTrxId: mixedBreakdown.cardTrxId,
          cardLast4: mixedBreakdown.cardLast4,
        }),
      };

      const result = await completeSale(input);

      if (result.success) {
        // Show receipt
        setReceiptData({
          orderNumber: result.orderNumber!,
          items: [...cart.items],
          subtotal,
          discount: discountAmount,
          discountType: cart.discountType,
          discountValue: cart.discount,
          tax: taxAmount,
          grandTotal,
          paymentMethod: cart.paymentMethod,
          amountReceived: cart.paymentMethod === 'CASH' ? cart.amountReceived : grandTotal,
          change: cart.paymentMethod === 'CASH' && cart.amountReceived >= grandTotal ? change : 0,
          customerName: cart.customerName,
          customerPhone: cart.customerPhone,
          paidAmount: effectivePaidAmount,
          dueAmount: effectiveDueAmount ?? 0,
          posPaymentStatus: effectivePosStatus ?? 'PAID',
          guarantorName: cart.guarantorName || undefined,
          guarantorPhone: cart.guarantorPhone || undefined,
          guarantorRelation: cart.guarantorRelation || undefined,
          date: new Date().toLocaleString('en-US', {
            dateStyle: 'medium',
            timeStyle: 'short',
          }),
          ...(mixedBreakdown && {
            cashPayment: mixedBreakdown.cash,
            cardPayment: mixedBreakdown.card,
            mobilePayment: mixedBreakdown.mobile,
            mobileTrxId: mixedBreakdown.mobileTrxId,
            mobileNumber: mixedBreakdown.mobileNumber,
            mobileProvider: mixedBreakdown.mobileProvider,
            cardTrxId: mixedBreakdown.cardTrxId,
            cardLast4: mixedBreakdown.cardLast4,
          }),
        });
        setShowReceipt(true);

        // Update daily summary
        setDailySummary((prev) => ({
          totalSales: prev.totalSales + grandTotal,
          totalOrders: prev.totalOrders + 1,
          totalItems: prev.totalItems + totalItems,
        }));

        clearCart();
        toast.success(`Sale completed: ${result.orderNumber}`);
      } else {
        toast.error(result.error || 'Failed to complete sale');
      }
    } catch (error: any) {
      toast.error(error.message || 'An error occurred');
    } finally {
      setIsProcessing(false);
    }
  }, [cart, subtotal, discountAmount, taxAmount, grandTotal, change, totalItems, clearCart]);

  const handleMixedPaymentConfirm = useCallback((breakdown: { 
    cash: number; 
    card: number; 
    mobile: number;
    mobileTrxId?: string;
    mobileNumber?: string;
    mobileProvider?: string;
    cardTrxId?: string;
    cardLast4?: string;
  }) => {
    setShowMixedPayment(false);
    handleCompleteSale(breakdown);
  }, [handleCompleteSale]);

  const handlePaymentDetailsConfirm = useCallback((details: {
    mobileTrxId?: string;
    mobileNumber?: string;
    mobileProvider?: string;
    cardTrxId?: string;
    cardLast4?: string;
  }) => {
    setShowPaymentDetails(false);
    // Pass as "mixedBreakdown" object format to reuse the function, 
    // even though it's single payment. The API handles optional fields.
    // For single payment, we don't need cash/card/mobile amounts split, 
    // but we pass the extra metadata.
    handleCompleteSale({
        cash: 0,
        card: 0,
        mobile: 0, // Amounts ignored for single payment in backend if method is not MIXED
        ...details
    });
  }, [handleCompleteSale]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      // F2 - Focus search
      if (e.key === 'F2') {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }

      // Escape - Clear cart (only when not in input)
      if (e.key === 'Escape' && !isInput) {
        e.preventDefault();
        if (cart.items.length > 0) {
          setShowClearDialog(true);
        }
        return;
      }

      // Ctrl + Enter - Complete sale
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleCompleteSale();
        return;
      }

      // F9 - Hold order
      if (e.key === 'F9') {
        e.preventDefault();
        holdOrder();
        toast.info('Order held');
        return;
      }

      // F11 - Toggle fullscreen
      if (e.key === 'F11' && !isInput) {
        e.preventDefault();
        toggleFullscreen();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart, clearCart, handleCompleteSale, holdOrder, toggleFullscreen]);

  return (
    <div className={cn(
      'flex flex-col bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden',
      isFullscreen ? 'fixed inset-0 z-100 rounded-none' : 'h-[calc(100dvh-5.5rem)] lg:h-[calc(100vh-8rem)]'
    )}>
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-linear-to-r from-blue-600 to-blue-700 text-white">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
            <span className="text-sm font-black">POS</span>
          </div>
          <div>
            <h1 className="text-sm font-bold">TechHat Point of Sale</h1>
            <p className="text-[10px] text-blue-200">Ready to sell</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/admin/pos/reports"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white text-xs font-semibold transition-colors"
          >
            <BarChart2 className="h-3.5 w-3.5" />
            Reports
          </a>
          <a
            href="/admin/pos/customers"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white text-xs font-semibold transition-colors"
          >
            <Users className="h-3.5 w-3.5" />
            Customers
          </a>
          <a
            href="/admin/pos/payments"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white text-xs font-semibold transition-colors"
          >
            <CreditCard className="h-3.5 w-3.5" />
            Payments
          </a>
          <button
            onClick={() => setShowShortcuts(!showShortcuts)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            title="Keyboard shortcuts"
          >
            <Keyboard className="h-4 w-4" />
          </button>
          <button
            onClick={toggleFullscreen}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            title="Toggle fullscreen (F11)"
          >
            {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Daily Summary */}
      <POSDailySummary
        totalSales={dailySummary.totalSales}
        totalOrders={dailySummary.totalOrders}
        totalItems={dailySummary.totalItems}
      />

      {/* Shortcuts Help */}
      {showShortcuts && (
        <div className="bg-gray-900 text-white px-4 py-3 text-xs flex items-center gap-6 flex-wrap animate-in slide-in-from-top-2 fade-in duration-200">
          <span className="font-bold text-gray-400">Shortcuts:</span>
          {[
            { key: 'F2', action: 'Search' },
            { key: 'Ctrl+Enter', action: 'Complete Sale' },
            { key: 'Esc', action: 'Clear Cart' },
            { key: 'F9', action: 'Hold Order' },
            { key: 'F11', action: 'Fullscreen' },
          ].map((s) => (
            <span key={s.key} className="flex items-center gap-1.5">
              <kbd className="bg-gray-700 px-2 py-0.5 rounded font-mono text-[10px]">{s.key}</kbd>
              <span className="text-gray-300">{s.action}</span>
            </span>
          ))}
          <button onClick={() => setShowShortcuts(false)} className="ml-auto text-gray-400 hover:text-white">
            ✕
          </button>
        </div>
      )}

      {/* Mobile Tab Bar */}
      <div className="lg:hidden flex border-b border-gray-200 bg-gray-50 shrink-0">
        <button
          onClick={() => setMobileView('products')}
          className={cn(
            'flex-1 py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors',
            mobileView === 'products'
              ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
              : 'text-gray-500'
          )}
        >
          <Grid3X3 className="w-4 h-4" />
          Products
        </button>
        <button
          onClick={() => setMobileView('cart')}
          className={cn(
            'flex-1 py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors relative',
            mobileView === 'cart'
              ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
              : 'text-gray-500'
          )}
        >
          <ShoppingCart className="w-4 h-4" />
          Cart
          {totalItems > 0 && (
            <span className="absolute top-1.5 right-6 w-4 h-4 bg-blue-600 text-white text-[10px] font-black rounded-full flex items-center justify-center">
              {totalItems}
            </span>
          )}
        </button>
      </div>

      {/* Main Content - Two Column */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Product Selection */}
        <div className={cn(
          'flex-1 flex flex-col border-r border-gray-200 min-w-0',
          mobileView === 'products' ? 'flex' : 'hidden lg:flex'
        )}>
          <POSProductGrid
            categories={categories}
            onProductSelect={handleProductSelect}
            searchInputRef={searchInputRef}
          />
        </div>

        {/* Right: Cart & Checkout */}
        <div className={cn(
          'shrink-0 flex flex-col',
          mobileView === 'cart' ? 'flex w-full lg:flex lg:w-105' : 'hidden lg:flex lg:w-105'
        )}>
          <POSCartPanel
            cart={cart}
            subtotal={subtotal}
            discountAmount={discountAmount}
            taxAmount={taxAmount}
            grandTotal={grandTotal}
            change={change}
            totalItems={totalItems}
            heldOrders={heldOrders}
            onUpdateQuantity={updateQuantity}
            onRemoveItem={removeItem}
            onClearCart={clearCart}
            onRequestClear={() => setShowClearDialog(true)}
            onHoldOrder={holdOrder}
            onResumeOrder={resumeOrder}
            onSetDiscount={setDiscount}
            onSetPaymentMethod={setPaymentMethod}
            onSetAmountReceived={setAmountReceived}
            onSetCustomerInfo={setCustomerInfo}
            onSetNote={setNote}
            onSetPaidAmount={setPaidAmount}
            onSetGuarantorInfo={setGuarantorInfo}
            onCompleteSale={handleCompleteSale}
            isProcessing={isProcessing}
            customers={posCustomers}
            onCustomerCreated={() => getPOSCustomerList().then((data) => setPosCustomers(data)).catch(() => {})}
          />
        </div>
      </div>

      {/* Receipt Modal */}
      <POSReceipt
        isOpen={showReceipt}
        onClose={() => setShowReceipt(false)}
        receipt={receiptData}
        invoiceSettings={invoiceSettings}
      />

      {/* Clear Cart Dialog */}
      <ClearCartDialog
        open={showClearDialog}
        onOpenChange={setShowClearDialog}
        onConfirm={() => {
          clearCart();
          toast.info('Cart cleared');
        }}
      />

      {/* Mixed Payment Modal */}
      <MixedPaymentModal
        isOpen={showMixedPayment}
        onClose={() => setShowMixedPayment(false)}
        grandTotal={grandTotal}
        onConfirm={handleMixedPaymentConfirm}
      />

      {/* Single Payment Details Modal */}
      <PaymentDetailsModal
        isOpen={showPaymentDetails}
        onClose={() => setShowPaymentDetails(false)}
        grandTotal={grandTotal}
        paymentMethod={cart.paymentMethod === 'MOBILE_BANKING' ? 'MOBILE_BANKING' : 'CARD'}
        onConfirm={handlePaymentDetailsConfirm}
      />

      {/* Variant Picker Modal */}
      <VariantPickerModal
        isOpen={showVariantPicker}
        onClose={() => {
          setShowVariantPicker(false);
          setSelectedProduct(null);
        }}
        product={selectedProduct}
        onSelectVariant={handleProductSelect}
      />
    </div>
  );
}
