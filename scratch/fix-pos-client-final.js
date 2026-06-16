const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../app/admin/pos/pos-client.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// Fix 1: Add state variables if missing
if (!content.includes('const [receiptStatus, setReceiptStatus]')) {
  content = content.replace(
    `const [showReceipt, setShowReceipt] = useState(false);`,
    `const [showReceipt, setShowReceipt] = useState(false);\n  const [receiptStatus, setReceiptStatus] = useState<'processing' | 'success' | 'error'>('processing');\n  const [receiptError, setReceiptError] = useState<string>('');\n  const [lastCheckoutBreakdown, setLastCheckoutBreakdown] = useState<any>(null);`
  );
}

// Fix 2: Replace dynamic import for POSReceipt with static import (if not already done)
if (content.includes('const POSReceipt = dynamic(() => import(')) {
  content = content.replace(
    /const POSReceipt = dynamic\(\(\) => import\('@\/components\/admin\/pos\/pos-receipt'\).then\(m => \(\{ default: m\.POSReceipt \}\)\), \{ ssr: false \}\);/,
    `import { POSReceipt } from '@/components/admin/pos/pos-receipt';`
  );
}

// Fix 3: Rewrite handleCompleteSale for optimistic UI
const handleCompleteSaleRegex = /const handleCompleteSale = useCallback\(async \([\s\S]*?toast\.error\(error\.message \|\| 'An error occurred'\);\s*setIsProcessing\(false\);\s*\}\s*\}, \[.*?\]\);/;

const newHandleCompleteSale = `const handleCompleteSale = useCallback(async (mixedBreakdown?: { 
    cash: number; 
    card: number; 
    mobile: number;
    mobileTrxId?: string;
    mobileNumber?: string;
    mobileProvider?: string;
    mobileCashOutCharge?: number;
    cardTrxId?: string;
    cardLast4?: string;
  }) => {
    if (cart.items.length === 0) return;
    
    // Check if it's mixed payment and show modal if not provided
    if (cart.paymentMethod === 'MIXED' && !mixedBreakdown) {
      setShowMixedPayment(true);
      return;
    }

    if ((cart.paymentMethod === 'MOBILE_BANKING' || cart.paymentMethod === 'CARD') && !mixedBreakdown) {
       setShowPaymentDetails(true);
       return;
    }
    
    if (cart.paymentMethod === 'CASH' && cart.amountReceived < grandTotal) {
      const hasCustomerInfo = cart.customerName.trim().length > 0 && cart.customerPhone.trim().length > 0;
      const hasGuarantorInfo = cart.guarantorName.trim().length > 0 && cart.guarantorPhone.trim().length > 0;

      if (!hasCustomerInfo || !hasGuarantorInfo) {
        toast.error('Please fill customer and guarantor details for due payment');
        return;
      }
    }

    setIsProcessing(true);
    try {
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

      const input = {
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
          mobileCashOutCharge: mixedBreakdown.mobileCashOutCharge,
          cardTrxId: mixedBreakdown.cardTrxId,
          cardLast4: mixedBreakdown.cardLast4,
        }),
      };

      setLastCheckoutBreakdown(mixedBreakdown || null);

      setReceiptData({
        orderNumber: '...',
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
          mobileCashOutCharge: mixedBreakdown.mobileCashOutCharge,
          cardTrxId: mixedBreakdown.cardTrxId,
          cardLast4: mixedBreakdown.cardLast4,
        }),
      });
      setReceiptStatus('processing');
      setShowReceipt(true);

      // Timeout to ensure React paints the receipt modal BEFORE blocking on the server action call
      setTimeout(async () => {
        try {
          const result = await completeSale(input);

          if (result.success) {
            setReceiptData((prev: any) => ({ ...prev, orderNumber: result.orderNumber! }));
            setReceiptStatus('success');
            clearCart();
            setIsProcessing(false);
            
            Promise.all([
              getDailySalesSummary(selectedDate),
              getPOSSalesDates(),
            ]).then(([summary, dates]) => {
              setDailySummary(summary);
              setSalesDates(dates);
              router.refresh();
            }).catch(console.error);
          } else {
            setReceiptStatus('error');
            setReceiptError(result.error || 'Failed to complete sale');
            setIsProcessing(false);
          }
        } catch (error: any) {
          setReceiptStatus('error');
          setReceiptError(error.message || 'An error occurred');
          setIsProcessing(false);
        }
      }, 50);

    } catch (error: any) {
      setReceiptStatus('error');
      setReceiptError(error.message || 'An error occurred');
      setIsProcessing(false);
    }
  }, [cart, subtotal, discountAmount, taxAmount, grandTotal, change, clearCart, router, selectedDate]);`;

content = content.replace(handleCompleteSaleRegex, newHandleCompleteSale);

// Fix 4: Add cartItems to POSProductGrid
if (!content.includes('cartItems={cart.items}')) {
  content = content.replace(
    `<POSProductGrid
            categories={categories}
            onProductSelect={handleProductSelect}
            searchInputRef={searchInputRef}
            initialProducts={initialProducts}
          />`,
    `<POSProductGrid
            categories={categories}
            onProductSelect={handleProductSelect}
            searchInputRef={searchInputRef}
            initialProducts={initialProducts}
            cartItems={cart.items}
          />`
  );
}

// Fix 5: Update ReceiptModal JSX
if (content.includes('invoiceSettings={invoiceSettings}\n      />')) {
  content = content.replace(
    /onClose=\{\(\) => setShowReceipt\(false\)\}\s*receipt=\{receiptData\}\s*invoiceSettings=\{invoiceSettings\}\s*\/>/,
    `onClose={() => {
          setShowReceipt(false);
          if (receiptStatus === 'error') {
            setReceiptStatus('processing');
          }
        }}
        receipt={receiptData}
        invoiceSettings={invoiceSettings}
        status={receiptStatus}
        errorMessage={receiptError}
        onRetry={() => handleCompleteSale(lastCheckoutBreakdown || undefined)}
      />`
  );
}

fs.writeFileSync(targetFile, content);
console.log('Fixed pos-client.tsx completely!');
