'use client';

import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { processDueCollection } from '@/lib/actions/receivables-actions';
import { useConfirm } from '@/components/providers/confirm-provider';
import { Wallet, Calculator } from 'lucide-react';
import { PaymentMethod } from '@prisma/client';

interface Customer { id: string; name: string; balance: number; }
interface Invoice { id: string; orderNumber: string; createdAt: Date | string; dueAmount: number | null; ageDays: number; }

export function PaymentDrawer({ 
  open, 
  onClose, 
  onSuccess,
  customer, 
  outstandingInvoices 
}: { 
  open: boolean; 
  onClose: () => void; 
  onSuccess?: () => void;
  customer: Customer; 
  outstandingInvoices: Invoice[];
}) {
  const [amount, setAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [reference, setReference] = useState('');
  const [remarks, setRemarks] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const confirm = useConfirm();
  const [selectedInvoices, setSelectedInvoices] = useState<Set<string>>(new Set());

  // Mixed payment breakdown
  const [mixed, setMixed] = useState({
    CASH: '', BKASH: '', NAGAD: '', ROCKET: '', CARD: '', BANK: '', CHEQUE: ''
  });

  // Calculate total from mixed inputs
  const mixedTotal = Object.values(mixed).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
  
  // Auto-sync amount field when mixed changes
  useEffect(() => {
    if (paymentMethod === 'MIXED') {
      setAmount(mixedTotal > 0 ? mixedTotal.toString() : '');
    }
  }, [mixedTotal, paymentMethod]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedInvoices(new Set(outstandingInvoices.map(i => i.id)));
    } else {
      setSelectedInvoices(new Set());
    }
  };

  const handleSelect = (id: string, checked: boolean) => {
    const next = new Set(selectedInvoices);
    if (checked) next.add(id);
    else next.delete(id);
    setSelectedInvoices(next);
  };

  // Preview Allocation (FIFO logic)
  const numericAmount = parseFloat(amount) || 0;
  const allocations: { orderId: string, amount: number, orderNumber: string }[] = [];
  let remainingAmount = numericAmount;

  // Only allocate to selected invoices, sorted by oldest first
  const selectedList = outstandingInvoices
    .filter(i => selectedInvoices.has(i.id))
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  for (const inv of selectedList) {
    if (remainingAmount <= 0) break;
    const alloc = Math.min(remainingAmount, inv.dueAmount || 0);
    allocations.push({ orderId: inv.id, amount: alloc, orderNumber: inv.orderNumber });
    remainingAmount -= alloc;
  }

  const handleCollect = async () => {
    if (numericAmount <= 0) {
      return toast.error('Enter a valid amount');
    }
    if (numericAmount > customer.balance) {
      // It's an advance payment
      // Confirm with user
      if (!(await confirm(`Amount is greater than total due. ৳${(numericAmount - customer.balance).toLocaleString()} will be saved as Advance. Proceed?`))) {
        return;
      }
    }
    if (paymentMethod === 'MIXED' && Math.abs(mixedTotal - numericAmount) > 0.01) {
       return toast.error('Mixed payment breakdown does not match total amount');
    }

    setIsProcessing(true);
    
    // Generate idempotency key to prevent double clicks
    // eslint-disable-next-line react-hooks/purity
    const idempotencyKey = `pay_${customer.id}_${Date.now()}`;

    const res = await processDueCollection({
      customerId: customer.id,
      amount: numericAmount,
      paymentMethod,
      reference,
      remarks,
      allocations: allocations.map(a => ({ orderId: a.orderId, amount: a.amount })),
      idempotencyKey,
      cashAmount: parseFloat(mixed.CASH) || 0,
      bkashAmount: parseFloat(mixed.BKASH) || 0,
      nagadAmount: parseFloat(mixed.NAGAD) || 0,
      rocketAmount: parseFloat(mixed.ROCKET) || 0,
      cardAmount: parseFloat(mixed.CARD) || 0,
      bankAmount: parseFloat(mixed.BANK) || 0,
      chequeAmount: parseFloat(mixed.CHEQUE) || 0,
    });

    if (res.success) {
      toast.success(`Payment successful! Receipt: ${res.receiptNumber}`);
      setAmount('');
      setReference('');
      setRemarks('');
      setMixed({ CASH: '', BKASH: '', NAGAD: '', ROCKET: '', CARD: '', BANK: '', CHEQUE: '' });
      setSelectedInvoices(new Set());
      if (onSuccess) onSuccess();
      else onClose();
    } else {
      toast.error(res.error || 'Payment failed');
    }
    setIsProcessing(false);
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto sm:border-l sm:border-slate-200">
        <SheetHeader className="pb-6 border-b">
          <SheetTitle className="text-2xl flex items-center gap-2">
            <Wallet className="h-6 w-6 text-green-600" />
            Collect Payment
          </SheetTitle>
          <SheetDescription>
            {customer?.name} • Total Due: <span className="font-bold text-red-600">৳{customer?.balance.toLocaleString()}</span>
          </SheetDescription>
        </SheetHeader>

        <div className="py-6 space-y-8">
          
          {/* SECTION: Outstanding Invoices */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-lg text-slate-900">1. Select Invoices</h3>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="select-all" 
                  checked={selectedInvoices.size === outstandingInvoices.length && outstandingInvoices.length > 0}
                  onCheckedChange={handleSelectAll}
                />
                <label htmlFor="select-all" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Select All
                </label>
              </div>
            </div>
            
            {outstandingInvoices.length === 0 ? (
              <div className="p-4 border rounded bg-slate-50 text-center text-slate-500 text-sm">
                No outstanding invoices. You can still accept Advance Payments.
              </div>
            ) : (
              <div className="border rounded-md overflow-hidden bg-white">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b">
                    <tr>
                      <th className="px-3 py-2 text-left w-10"></th>
                      <th className="px-3 py-2 text-left font-medium">Invoice</th>
                      <th className="px-3 py-2 text-center font-medium">Age</th>
                      <th className="px-3 py-2 text-right font-medium">Due Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {outstandingInvoices.map((inv) => (
                      <tr key={inv.id} className={`hover:bg-slate-50 ${selectedInvoices.has(inv.id) ? 'bg-blue-50/50' : ''}`}>
                        <td className="px-3 py-2">
                          <Checkbox 
                            checked={selectedInvoices.has(inv.id)}
                            onCheckedChange={(c) => handleSelect(inv.id, c as boolean)}
                          />
                        </td>
                        <td className="px-3 py-2 font-medium">{inv.orderNumber}</td>
                        <td className="px-3 py-2 text-center">
                           <span className={inv.ageDays > 30 ? 'text-red-600 font-medium' : 'text-slate-500'}>{inv.ageDays}d</span>
                        </td>
                        <td className="px-3 py-2 text-right font-semibold">৳{(inv.dueAmount || 0).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* SECTION: Payment Entry */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg text-slate-900">2. Payment Details</h3>
            
            <div>
              <Label className="text-xs font-semibold text-slate-500 uppercase">Payment Method</Label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mt-2">
                {['CASH', 'BKASH', 'NAGAD', 'CARD', 'MIXED'].map(m => (
                  <div 
                    key={m} 
                    onClick={() => setPaymentMethod(m as PaymentMethod)}
                    className={`cursor-pointer border rounded-md text-center py-2 text-xs font-medium transition-colors ${paymentMethod === m ? 'bg-primary text-primary-foreground border-primary' : 'bg-white hover:bg-slate-50 text-slate-600'}`}
                  >
                    {m}
                  </div>
                ))}
              </div>
            </div>

            {paymentMethod === 'MIXED' ? (
               <div className="grid grid-cols-2 gap-4 p-4 border rounded-md bg-slate-50 mt-4">
                 {Object.keys(mixed).map((k) => (
                   <div key={k}>
                     <Label className="text-xs mb-1 block">{k}</Label>
                     <Input 
                       type="number" 
                       min="0"
                       value={mixed[k as keyof typeof mixed]} 
                       onChange={e => setMixed({...mixed, [k]: e.target.value})}
                       className="bg-white h-9"
                     />
                   </div>
                 ))}
                 <div className="col-span-2 flex justify-between items-center pt-2 border-t mt-2">
                   <span className="font-medium text-slate-700">Total Mixed Amount:</span>
                   <span className="text-xl font-bold text-primary">৳{mixedTotal.toLocaleString()}</span>
                 </div>
               </div>
            ) : (
               <div className="mt-4">
                  <Label>Amount Received (৳)</Label>
                  <Input 
                    type="number" 
                    placeholder="Enter amount" 
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="text-2xl font-bold h-14 mt-1"
                    autoFocus
                  />
                  <div className="flex gap-2 mt-2">
                    <Button variant="outline" size="sm" onClick={() => setAmount(customer.balance.toString())}>Full Due</Button>
                     <Button variant="outline" size="sm" onClick={() => setAmount(selectedList.reduce((s,i) => s + (i.dueAmount || 0), 0).toString())}>Selected Invoices</Button>
                  </div>
               </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div>
                <Label>Reference / TrxID (Optional)</Label>
                <Input value={reference} onChange={e => setReference(e.target.value)} placeholder="e.g. Trx ID or Cheque No" className="mt-1" />
              </div>
              <div>
                <Label>Remarks (Optional)</Label>
                <Input value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="Any note..." className="mt-1" />
              </div>
            </div>
          </div>

          {/* SECTION: Allocation Preview */}
          {numericAmount > 0 && (
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 space-y-2">
              <h4 className="font-semibold text-blue-900 flex items-center gap-2">
                <Calculator className="h-4 w-4" /> Auto-Allocation Preview
              </h4>
              <div className="text-sm text-blue-800 space-y-1">
                {allocations.map(a => (
                  <div key={a.orderId} className="flex justify-between">
                    <span>Invoice {a.orderNumber}</span>
                    <span className="font-medium">৳{a.amount.toLocaleString()}</span>
                  </div>
                ))}
                {remainingAmount > 0.01 && (
                  <div className="flex justify-between pt-2 border-t border-blue-200 mt-2">
                    <span className="font-semibold">Advance / Unallocated</span>
                    <span className="font-bold text-green-700">৳{remainingAmount.toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        <SheetFooter className="border-t pt-4 sm:justify-between flex-row items-center w-full">
           <Button variant="ghost" onClick={onClose} disabled={isProcessing}>Cancel</Button>
           <Button 
             size="lg" 
             onClick={handleCollect} 
             disabled={isProcessing || numericAmount <= 0}
             className="bg-green-600 hover:bg-green-700 w-full sm:w-auto text-base px-8"
           >
             {isProcessing ? 'Processing...' : `Collect ৳${numericAmount.toLocaleString()}`}
           </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
