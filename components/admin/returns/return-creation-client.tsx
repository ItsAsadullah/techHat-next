'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, ArrowLeft, Loader2, Package, CheckCircle2, AlertCircle } from 'lucide-react';
import { searchOrderForReturn, processReturn, ProcessReturnInput } from '@/lib/actions/return-actions';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

type ReturnCondition = 'SEALED' | 'LIKE_NEW' | 'GOOD' | 'USED' | 'DAMAGED' | 'DEFECTIVE' | 'NEEDS_INSPECTION';
type ReturnType = 'FULL' | 'PARTIAL' | 'EXCHANGE' | 'WARRANTY' | 'DEFECTIVE' | 'DAMAGED' | 'WRONG_ITEM' | 'STORE_CREDIT';

const CONDITIONS: { label: string; value: ReturnCondition }[] = [
  { label: 'Sealed', value: 'SEALED' },
  { label: 'Like New', value: 'LIKE_NEW' },
  { label: 'Good', value: 'GOOD' },
  { label: 'Used', value: 'USED' },
  { label: 'Damaged', value: 'DAMAGED' },
  { label: 'Defective', value: 'DEFECTIVE' },
  { label: 'Needs Inspection', value: 'NEEDS_INSPECTION' },
];

const REASONS = [
  'Customer Changed Mind',
  'Wrong Product',
  'Wrong Variant',
  'Defective',
  'Damaged',
  'Warranty Claim',
  'Packaging Issue',
  'Other'
];

const TYPES: { label: string; value: ReturnType }[] = [
  { label: 'Full/Partial Return', value: 'PARTIAL' },
  { label: 'Store Credit', value: 'STORE_CREDIT' },
  { label: 'Exchange', value: 'EXCHANGE' },
  { label: 'Warranty Return', value: 'WARRANTY' },
];

export default function ReturnCreationClient() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [order, setOrder] = useState<any>(null);

  // Return Form State
  const [returnType, setReturnType] = useState<ReturnType>('PARTIAL');
  const [globalReason, setGlobalReason] = useState('Customer Changed Mind');
  const [itemsToReturn, setItemsToReturn] = useState<Record<string, { qty: number; condition: ReturnCondition; reason: string }>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    const res = await searchOrderForReturn(searchQuery);
    setIsSearching(false);

    if (res.success && res.order) {
      setOrder(res.order);
      // Initialize items state
      const initial: any = {};
      res.order.items.forEach((item: any) => {
        initial[item.id] = { qty: 0, condition: 'GOOD', reason: 'Customer Changed Mind' };
      });
      setItemsToReturn(initial);
    } else {
      toast.error(res.error || 'Order not found');
      setOrder(null);
    }
  };

  const handleQtyChange = (itemId: string, max: number, value: string) => {
    let qty = parseInt(value) || 0;
    if (qty < 0) qty = 0;
    if (qty > max) qty = max;
    setItemsToReturn(p => ({ ...p, [itemId]: { ...p[itemId], qty } }));
  };

  const calculateTotals = () => {
    let refundAmount = 0;
    if (!order) return { refundAmount, storeCredit: 0 };

    order.items.forEach((item: any) => {
      const returning = itemsToReturn[item.id]?.qty || 0;
      refundAmount += returning * item.unitPrice;
    });

    return {
      refundAmount: returnType === 'STORE_CREDIT' ? 0 : refundAmount,
      storeCredit: returnType === 'STORE_CREDIT' ? refundAmount : 0,
    };
  };

  const handleSubmit = async () => {
    if (!order) return;

    const itemsToProcess = order.items
      .filter((item: any) => itemsToReturn[item.id]?.qty > 0)
      .map((item: any) => ({
        productId: item.productId,
        variantId: item.variantId,
        quantity: itemsToReturn[item.id].qty,
        unitPrice: item.unitPrice,
        condition: itemsToReturn[item.id].condition,
        reason: itemsToReturn[item.id].reason,
      }));

    if (itemsToProcess.length === 0) {
      return toast.error('Please select at least one item to return');
    }

    if (returnType === 'STORE_CREDIT' && !order.userId) {
      return toast.error('Store Credit is only available for registered customers with a wallet.');
    }

    setIsSubmitting(true);
    const totals = calculateTotals();

    const payload: ProcessReturnInput = {
      orderId: order.id,
      type: returnType,
      reason: globalReason,
      items: itemsToProcess,
      refundMethod: returnType === 'STORE_CREDIT' ? 'STORE_CREDIT' : 'CASH',
      storeCreditAmount: totals.storeCredit,
      refundToWallet: returnType === 'STORE_CREDIT'
    };

    const res = await processReturn(payload);
    setIsSubmitting(false);

    if (res.success) {
      toast.success(`Return Processed Successfully: ${res.returnNumber}`);
      router.push('/admin/returns');
    } else {
      toast.error(res.error || 'Failed to process return');
    }
  };

  const totals = calculateTotals();

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Process Return / Exchange</h1>
          <p className="text-sm text-gray-500">Scan invoice barcode or search by order number / phone</p>
        </div>
      </div>

      {!order ? (
        <Card className="p-8 max-w-xl mx-auto border-gray-200 shadow-sm bg-white dark:bg-gray-900">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Invoice Number or Phone</label>
              <div className="flex gap-2">
                <Input 
                  placeholder="e.g. INV-..., 017..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1"
                  autoFocus
                />
                <Button type="submit" disabled={isSearching || !searchQuery.trim()} className="bg-blue-600 hover:bg-blue-700">
                  {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                </Button>
              </div>
            </div>
            <div className="text-center p-6 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50 dark:bg-gray-800/50">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500 font-medium">Scan Barcode or Enter Details to Start</p>
            </div>
          </form>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Items */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-5 border-gray-200 shadow-sm bg-white">
              <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-100">
                <div>
                  <h3 className="font-bold text-gray-900">Invoice: {order.orderNumber}</h3>
                  <p className="text-sm text-gray-500">Customer: {order.customerName} ({order.customerPhone})</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setOrder(null)}>Change Invoice</Button>
              </div>

              <div className="space-y-4">
                {order.items.map((item: any) => {
                  const state = itemsToReturn[item.id] || { qty: 0, condition: 'GOOD', reason: '' };
                  const maxReturn = item.availableToReturn;

                  return (
                    <div key={item.id} className="flex flex-col sm:flex-row gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50">
                      <div className="w-16 h-16 bg-white rounded-lg border border-gray-200 shrink-0 overflow-hidden flex items-center justify-center">
                        {item.product.images?.[0] ? (
                          <Image src={item.product.images[0]} alt={item.product.name} width={64} height={64} className="object-cover" />
                        ) : (
                          <Package className="w-6 h-6 text-gray-300" />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-gray-900 truncate">{item.product.name}</h4>
                        {item.variant && <p className="text-xs text-gray-500">{item.variant.name}</p>}
                        <div className="flex items-center gap-4 mt-2 text-sm">
                          <span className="font-semibold">৳{item.unitPrice}</span>
                          <span className="text-gray-500">Sold: {item.quantity}</span>
                          {item.alreadyReturned > 0 && (
                            <span className="text-amber-600 font-medium">Already Returned: {item.alreadyReturned}</span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 w-full sm:w-auto shrink-0">
                        <div className="flex items-center gap-2">
                          <label className="text-xs font-semibold text-gray-600 w-16">Rtn Qty:</label>
                          <Input 
                            type="number" 
                            min="0" max={maxReturn} 
                            value={state.qty || ''}
                            onChange={(e) => handleQtyChange(item.id, maxReturn, e.target.value)}
                            className="w-24 h-8 text-center"
                          />
                          <span className="text-xs text-gray-400">/ {maxReturn}</span>
                        </div>
                        
                        {state.qty > 0 && (
                          <>
                            <div className="flex items-center gap-2">
                              <label className="text-xs font-semibold text-gray-600 w-16">Cond:</label>
                              <Select value={state.condition} onValueChange={(val: any) => setItemsToReturn(p => ({...p, [item.id]: {...p[item.id], condition: val}}))}>
                                <SelectTrigger className="h-8 text-xs w-36">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {CONDITIONS.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <label className="text-xs font-semibold text-gray-600 w-16">Reason:</label>
                              <Select value={state.reason} onValueChange={(val: any) => setItemsToReturn(p => ({...p, [item.id]: {...p[item.id], reason: val}}))}>
                                <SelectTrigger className="h-8 text-xs w-36">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {REASONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* Right Column: Summary & Actions */}
          <div className="space-y-6">
            <Card className="p-5 border-gray-200 shadow-sm bg-white sticky top-20">
              <h3 className="font-bold text-gray-900 mb-4">Return Settings</h3>
              
              <div className="space-y-4 mb-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Return Action</label>
                  <Select value={returnType} onValueChange={(val: any) => setReturnType(val)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Global Reason (Optional)</label>
                  <Select value={globalReason} onValueChange={setGlobalReason}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {REASONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 space-y-3 mb-6">
                <h4 className="font-semibold text-gray-900 text-sm uppercase tracking-wider">Summary</h4>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Cash Refund</span>
                  <span className="font-bold text-gray-900">৳{totals.refundAmount.toLocaleString()}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Store Credit</span>
                  <span className="font-bold text-purple-600">৳{totals.storeCredit.toLocaleString()}</span>
                </div>
                
                {returnType === 'STORE_CREDIT' && !order.userId && (
                  <div className="mt-2 flex gap-2 text-xs text-red-600 bg-red-50 p-2 rounded-lg items-start">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <p>Walk-in customers cannot receive Store Credit. Please select another action.</p>
                  </div>
                )}
              </div>

              <Button 
                onClick={handleSubmit}
                disabled={isSubmitting || (totals.refundAmount === 0 && totals.storeCredit === 0)}
                className="w-full py-6 text-lg font-bold shadow-md bg-blue-600 hover:bg-blue-700"
              >
                {isSubmitting ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5 mr-2" />
                    Confirm & Process
                  </>
                )}
              </Button>
            </Card>
          </div>

        </div>
      )}
    </div>
  );
}
