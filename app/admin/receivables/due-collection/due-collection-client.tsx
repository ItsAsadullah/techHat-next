'use client';

import { useState, useEffect, useMemo } from 'react';
import { getOutstandingInvoices, processDueCollection } from '@/lib/actions/receivables-actions';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { User, DollarSign, Search, Calendar, FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface CustomerOption {
  id: string;
  name: string;
  phone: string | null;
  balance: number;
}

interface Invoice {
  id: string;
  orderNumber: string;
  createdAt: Date;
  grandTotal: number;
  paidAmount: number | null;
  dueAmount: number | null;
}

export function DueCollectionClient({ customers }: { customers: CustomerOption[] }) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  
  const [amount, setAmount] = useState<number | ''>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('CASH');
  const [reference, setReference] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const filteredCustomers = useMemo(() => {
    if (!search) return customers.slice(0, 5);
    const lowerSearch = search.toLowerCase();
    return customers.filter(c => 
      c.name.toLowerCase().includes(lowerSearch) || 
      (c.phone && c.phone.includes(lowerSearch))
    ).slice(0, 10);
  }, [customers, search]);

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

  useEffect(() => {
    if (selectedCustomerId) {
      setLoadingInvoices(true);
      getOutstandingInvoices(selectedCustomerId).then((res) => {
        if (res.success && res.data) {
          setInvoices(res.data);
        } else {
          toast.error(res.error || 'Failed to fetch invoices');
        }
        setLoadingInvoices(false);
      });
    } else {
      setInvoices([]);
    }
  }, [selectedCustomerId]);

  // Auto-calculate allocations
  const allocations = useMemo(() => {
    const allocs: { orderId: string, orderNumber: string, amount: number, remainingDue: number }[] = [];
    let remainingPayment = Number(amount) || 0;

    for (const inv of invoices) {
      const due = inv.dueAmount || 0;
      if (remainingPayment <= 0) {
        allocs.push({ orderId: inv.id, orderNumber: inv.orderNumber, amount: 0, remainingDue: due });
        continue;
      }
      const payToThis = Math.min(due, remainingPayment);
      allocs.push({ orderId: inv.id, orderNumber: inv.orderNumber, amount: payToThis, remainingDue: due - payToThis });
      remainingPayment -= payToThis;
    }

    return { allocs, unallocated: remainingPayment };
  }, [amount, invoices]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId) return toast.error('Please select a customer');
    if (!amount || Number(amount) <= 0) return toast.error('Please enter a valid amount');

    setIsProcessing(true);
    try {
      const result = await processDueCollection({
        customerId: selectedCustomerId,
        amount: Number(amount),
        paymentMethod: paymentMethod as any,
        reference,
        allocations: allocations.allocs.map(a => ({ orderId: a.orderId, amount: a.amount })),
        idempotencyKey: `col-${Date.now()}`
      });

      if (result.success) {
        toast.success(`Payment processed! Ref: ${result.paymentNumber}`);
        // Reset form
        setSelectedCustomerId(null);
        setSearch('');
        setAmount('');
        setReference('');
        router.refresh(); // Refresh page to update customer list balances
      } else {
        toast.error(result.error || 'Failed to process payment');
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* Left Column: Customer Selection & Payment Form */}
      <div className="lg:col-span-5 space-y-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-blue-500" />
            1. Select Customer
          </h2>

          {!selectedCustomerId ? (
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input 
                  type="text" 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name or phone..."
                  className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm"
                />
              </div>

              <div className="space-y-2">
                {filteredCustomers.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">No customers found</p>
                ) : (
                  filteredCustomers.map(c => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedCustomerId(c.id)}
                      className="w-full flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-all text-left"
                    >
                      <div>
                        <p className="font-bold text-gray-900 text-sm">{c.name}</p>
                        <p className="text-xs text-gray-500">{c.phone}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Total Due</p>
                        <p className="font-bold text-red-600 text-sm">৳{c.balance.toLocaleString()}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="font-bold text-blue-900">{selectedCustomer?.name}</p>
                <p className="text-sm text-blue-700">{selectedCustomer?.phone}</p>
              </div>
              <div className="text-right flex flex-col items-end">
                <p className="text-xs text-blue-600 font-medium">Total Outstanding</p>
                <p className="font-black text-red-600 text-lg">৳{selectedCustomer?.balance.toLocaleString()}</p>
                <button 
                  onClick={() => { setSelectedCustomerId(null); setAmount(''); }}
                  className="mt-1 text-xs font-semibold text-blue-600 hover:text-blue-800 underline"
                >
                  Change Customer
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Payment Details Form */}
        <div className={`bg-white rounded-2xl shadow-sm border border-gray-200 p-6 transition-opacity ${!selectedCustomerId ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-500" />
            2. Payment Details
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Amount Received (৳) *</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input 
                  type="number"
                  min="1"
                  step="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : '')}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition-all text-lg font-bold"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Payment Method *</label>
                <select 
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-sm"
                >
                  <option value="CASH">Cash</option>
                  <option value="MOBILE_BANKING">Mobile Banking</option>
                  <option value="CARD">Credit/Debit Card</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="CHEQUE">Cheque</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Reference / TrxID</label>
                <input 
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="Optional"
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isProcessing || !amount || Number(amount) <= 0}
              className="w-full py-3.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl font-bold text-base flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              {isProcessing ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</>
              ) : (
                <><CheckCircle2 className="w-5 h-5" /> Confirm Payment</>
              )}
            </button>
          </form>
        </div>

      </div>

      {/* Right Column: Invoice Allocation Preview */}
      <div className="lg:col-span-7">
        <div className={`bg-white rounded-2xl shadow-sm border border-gray-200 p-6 h-full transition-opacity ${!selectedCustomerId ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-500" />
              Invoice Allocation (FIFO)
            </h2>
            {Number(amount) > 0 && allocations.unallocated > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-bold rounded-full">
                <AlertCircle className="w-3.5 h-3.5" />
                Unallocated Advance: ৳{allocations.unallocated.toLocaleString()}
              </span>
            )}
          </div>

          {loadingInvoices ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400">
              <Loader2 className="w-8 h-8 animate-spin mb-2" />
              <p className="text-sm">Loading invoices...</p>
            </div>
          ) : !selectedCustomerId ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400 text-sm">
              Select a customer to view outstanding invoices
            </div>
          ) : invoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-green-500 bg-green-50 rounded-xl border border-green-100">
              <CheckCircle2 className="w-8 h-8 mb-2" />
              <p className="font-bold">No outstanding invoices!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {allocations.allocs.map((alloc, idx) => {
                const inv = invoices.find(i => i.id === alloc.orderId)!;
                const isPaid = alloc.amount > 0;
                const isFullyPaid = alloc.remainingDue <= 0;

                return (
                  <div 
                    key={alloc.orderId} 
                    className={`flex flex-wrap sm:flex-nowrap items-center justify-between p-4 rounded-xl border transition-all ${isPaid ? 'border-green-200 bg-green-50/50' : 'border-gray-100 hover:border-gray-200'}`}
                  >
                    <div className="w-full sm:w-auto mb-2 sm:mb-0">
                      <p className="font-bold text-sm text-gray-900">{inv.orderNumber}</p>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(inv.createdAt), 'PP')}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-4 sm:gap-8 w-full sm:w-auto justify-between sm:justify-end">
                      <div className="text-left sm:text-right">
                        <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Total Due</p>
                        <p className="font-bold text-red-600 text-sm">৳{inv.dueAmount?.toLocaleString()}</p>
                      </div>

                      {alloc.amount > 0 && (
                        <div className="flex items-center justify-center bg-white border border-green-200 shadow-sm rounded-lg px-3 py-1.5 animate-in zoom-in-95">
                          <p className="text-xs font-bold text-green-600">- ৳{alloc.amount.toLocaleString()}</p>
                        </div>
                      )}

                      <div className="text-right w-20">
                        <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">New Due</p>
                        <p className={`font-black text-sm ${isFullyPaid ? 'text-green-600' : 'text-gray-900'}`}>
                          ৳{alloc.remainingDue.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
