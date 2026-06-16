const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../app/admin/pos/pos-client.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// 1. Add states
content = content.replace(
  `  const [showReceipt, setShowReceipt] = useState(false);`,
  `  const [showReceipt, setShowReceipt] = useState(false);\n  const [receiptStatus, setReceiptStatus] = useState<'processing' | 'success' | 'error'>('processing');\n  const [receiptError, setReceiptError] = useState<string>('');\n  const [lastCheckoutBreakdown, setLastCheckoutBreakdown] = useState<any>(null);`
);

// 2. Update handleCompleteSale
const oldHandleCompleteSale = `    setIsProcessing(true);
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
          mobileCashOutCharge: mixedBreakdown.mobileCashOutCharge,
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
            mobileCashOutCharge: mixedBreakdown.mobileCashOutCharge,
            cardTrxId: mixedBreakdown.cardTrxId,
            cardLast4: mixedBreakdown.cardLast4,
          }),
        });
        setShowReceipt(true);
        clearCart();
        setIsProcessing(false);
        toast.success(\`Sale completed: \${result.orderNumber}\`);

        // Fetch stats in background so UI doesn't block
        Promise.all([
          getDailySalesSummary(selectedDate),
          getPOSSalesDates(),
        ]).then(([summary, dates]) => {
          setDailySummary(summary);
          setSalesDates(dates);
          // Refresh server data to get updated stock
          router.refresh();
        }).catch(console.error);

      } else {
        toast.error(result.error || 'Failed to complete sale');
        setIsProcessing(false);
      }
    } catch (error: any) {
      toast.error(error.message || 'An error occurred');
      setIsProcessing(false);
    }`;

const newHandleCompleteSale = `    setIsProcessing(true);
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
          mobileCashOutCharge: mixedBreakdown.mobileCashOutCharge,
          cardTrxId: mixedBreakdown.cardTrxId,
          cardLast4: mixedBreakdown.cardLast4,
        }),
      };

      // Store breakdown for retries
      setLastCheckoutBreakdown(mixedBreakdown || null);

      // SHOW OPTIMISTIC RECEIPT IMMEDIATELY
      setReceiptData({
        orderNumber: '...', // Placeholder during processing
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

      const result = await completeSale(input);

      if (result.success) {
        // Update with real order number
        setReceiptData((prev: any) => ({ ...prev, orderNumber: result.orderNumber! }));
        setReceiptStatus('success');
        clearCart();
        setIsProcessing(false);
        // Do not block UI, just toast success
        toast.success(\`Sale completed: \${result.orderNumber}\`);

        // Fetch stats in background so UI doesn't block
        Promise.all([
          getDailySalesSummary(selectedDate),
          getPOSSalesDates(),
        ]).then(([summary, dates]) => {
          setDailySummary(summary);
          setSalesDates(dates);
          // Refresh server data to get updated stock
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
    }`;

content = content.replace(oldHandleCompleteSale, newHandleCompleteSale);

// 3. Update POSReceipt JSX
const oldReceiptJSX = `      {/* Receipt Modal */}
      <POSReceipt
        isOpen={showReceipt}
        onClose={() => setShowReceipt(false)}
        receipt={receiptData}
        invoiceSettings={invoiceSettings}
      />`;

const newReceiptJSX = `      {/* Receipt Modal */}
      <POSReceipt
        isOpen={showReceipt}
        onClose={() => {
          setShowReceipt(false);
          if (receiptStatus === 'error') {
            setReceiptStatus('processing'); // Reset on close
          }
        }}
        receipt={receiptData}
        invoiceSettings={invoiceSettings}
        status={receiptStatus}
        errorMessage={receiptError}
        onRetry={() => handleCompleteSale(lastCheckoutBreakdown || undefined)}
      />`;

content = content.replace(oldReceiptJSX, newReceiptJSX);

fs.writeFileSync(targetFile, content);
console.log('Updated pos-client.tsx successfully');
