'use client';

import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Loader2, ArrowLeft, RefreshCcw, Printer, CheckCircle2, AlertCircle, Package } from 'lucide-react';
import { searchOrderForReturn, processReturn, type ProcessReturnInput } from '@/lib/actions/return-actions';
import Image from 'next/image';
import { useReactToPrint } from 'react-to-print';

interface POSReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReturnComplete: () => void;
}

export function POSReturnModal({ isOpen, onClose, onReturnComplete }: POSReturnModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [order, setOrder] = useState<any>(null);
  const [error, setError] = useState('');

  // Form states
  const [returnItems, setReturnItems] = useState<{
    productId: string;
    variantId: string | null;
    quantity: number;
    unitPrice: number;
    maxQty: number;
    restock: boolean;
  }[]>([]);
  const [reason, setReason] = useState('Customer Change of Mind');
  const [customRefund, setCustomRefund] = useState<number | null>(null);
  const [note, setNote] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Receipt
  const [successReturnId, setSuccessReturnId] = useState<string | null>(null);
  const [returnNumber, setReturnNumber] = useState<string | null>(null);
  const [refundedAmount, setRefundedAmount] = useState<number>(0);
  const receiptRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: receiptRef,
    documentTitle: `Return_Receipt_${returnNumber || 'Draft'}`,
  });

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setError('');
    try {
      const result = await searchOrderForReturn(searchQuery);
      if (!result || !result.success || !result.order) {
        setError(result?.error || 'Order not found or not eligible for return (must be POS and PAID).');
        setOrder(null);
      } else if (result.order.items.every((i: any) => i.returnableQuantity === 0)) {
        setError('All items in this order have already been returned.');
        setOrder(null);
      } else {
        setOrder(result.order);
        setReturnItems(
          result.order.items.map((i: any) => ({
            productId: i.productId,
            variantId: i.variantId,
            quantity: 0,
            unitPrice: i.unitPrice,
            maxQty: i.returnableQuantity,
            restock: true,
          }))
        );
      }
    } catch (err: any) {
      setError(err.message || 'Failed to search order');
    } finally {
      setIsSearching(false);
    }
  };

  const calculateAutoRefund = () => {
    return returnItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  };

  const totalRefund = customRefund !== null ? customRefund : calculateAutoRefund();
  const hasItemsToReturn = returnItems.some(i => i.quantity > 0);

  const handleProcessReturn = async () => {
    if (!hasItemsToReturn) {
      setError('Please select at least one item to return');
      return;
    }

    setIsProcessing(true);
    setError('');
    try {
      const payload: ProcessReturnInput = {
        orderId: order.id,
        type: 'PARTIAL',
        items: returnItems
          .filter((i) => i.quantity > 0)
          .map((i) => ({
            productId: i.productId,
            variantId: i.variantId,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            condition: 'GOOD',
            reason: reason,
          })),
        reason,
        note,
        refundMethod: 'CASH',
      };

      const result = await processReturn(payload);
      if (result.success) {
        setSuccessReturnId(result.returnId || null);
        setReturnNumber(result.returnNumber || null);
        setRefundedAmount(totalRefund);
        onReturnComplete(); // Refresh daily sales
      } else {
        setError(result.error || 'Failed to process return');
      }
    } catch (err: any) {
      setError(err.message || 'Error processing return');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setSearchQuery('');
    setOrder(null);
    setReturnItems([]);
    setError('');
    setReason('Customer Change of Mind');
    setCustomRefund(null);
    setNote('');
    setSuccessReturnId(null);
    setReturnNumber(null);
    setRefundedAmount(0);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gray-50 p-0">
        <DialogHeader className="p-6 bg-white border-b sticky top-0 z-10">
          <DialogTitle className="text-xl flex items-center gap-2">
            <RefreshCcw className="w-5 h-5 text-blue-600" />
            Process POS Return
          </DialogTitle>
          <DialogDescription>
            Search by order number or customer phone to process a return.
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 space-y-6">
          {successReturnId ? (
            <div className="flex flex-col items-center justify-center py-10 space-y-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900">Return Processed Successfully</h3>
                <p className="text-gray-500 mt-2">Refund Amount: <span className="font-bold text-gray-900">৳{refundedAmount.toLocaleString()}</span></p>
                <p className="text-gray-500">Return Number: {returnNumber}</p>
              </div>

              {/* Hidden Receipt for Printing */}
              <div className="hidden">
                <div ref={receiptRef} className="w-[80mm] p-4 text-black bg-white font-mono text-sm leading-tight">
                  <div className="text-center mb-4">
                    <h2 className="font-bold text-lg">TechHat</h2>
                    <p>Return Receipt</p>
                    <p className="text-xs mt-1">{new Date().toLocaleString()}</p>
                  </div>
                  <div className="border-b border-dashed border-gray-400 pb-2 mb-2">
                    <p>Order: {order?.orderNumber}</p>
                    <p>Return: {returnNumber}</p>
                    <p>Reason: {reason}</p>
                  </div>
                  <div className="space-y-2 mb-2 pb-2 border-b border-dashed border-gray-400">
                    {returnItems.filter(i => i.quantity > 0).map((item, idx) => {
                      const orderItem = order?.items.find((oi: any) => oi.productId === item.productId && oi.variantId === item.variantId);
                      return (
                        <div key={idx} className="flex justify-between text-xs">
                          <div className="w-2/3 pr-2">
                            {orderItem?.product?.name}
                            {orderItem?.variant?.name && ` - ${orderItem.variant.name}`}
                            <br/>
                            {item.quantity} x ৳{item.unitPrice}
                          </div>
                          <div className="w-1/3 text-right">
                            ৳{item.quantity * item.unitPrice}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex justify-between font-bold text-base mt-2">
                    <span>TOTAL REFUND:</span>
                    <span>৳{refundedAmount.toLocaleString()}</span>
                  </div>
                  <div className="text-center text-xs mt-6">
                    <p>Thank you!</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <Button onClick={() => handlePrint()} className="bg-blue-600 hover:bg-blue-700">
                  <Printer className="w-4 h-4 mr-2" />
                  Print Receipt
                </Button>
                <Button variant="outline" onClick={handleClose}>
                  Done
                </Button>
              </div>
            </div>
          ) : !order ? (
            <div className="max-w-xl mx-auto space-y-6">
              <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Scan receipt barcode or enter Phone Number..."
                    className="pl-9 h-12"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoFocus
                  />
                </div>
                <Button type="submit" disabled={isSearching} className="h-12 px-8">
                  {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
                </Button>
              </form>
              
              {error && (
                <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg flex gap-3 items-start">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <p>{error}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
              <div className="flex items-center justify-between">
                <div>
                  <Button variant="ghost" size="sm" onClick={() => setOrder(null)} className="-ml-3 mb-2 text-gray-500">
                    <ArrowLeft className="w-4 h-4 mr-1" /> Back to Search
                  </Button>
                  <h3 className="text-lg font-bold text-gray-900">Order {order.orderNumber}</h3>
                  <p className="text-sm text-gray-500">
                    {order.customerName} ({order.customerPhone}) • {new Date(order.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-500">Total Amount</p>
                  <p className="text-xl font-black text-gray-900">৳{order.grandTotal.toLocaleString()}</p>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="p-4 font-semibold text-gray-700">Item</th>
                      <th className="p-4 font-semibold text-gray-700">Price</th>
                      <th className="p-4 font-semibold text-gray-700 text-center">Purchased</th>
                      <th className="p-4 font-semibold text-gray-700 text-center">Returned</th>
                      <th className="p-4 font-semibold text-gray-700 text-center w-32">Return Qty</th>
                      <th className="p-4 font-semibold text-gray-700 text-center w-24">Restock?</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {order.items.map((item: any, idx: number) => {
                      const returnState = returnItems[idx];
                      if (!returnState || returnState.maxQty <= 0) return null;

                      return (
                        <tr key={idx} className={returnState.quantity > 0 ? 'bg-blue-50/50' : ''}>
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              {item.variant?.image ? (
                                <Image src={item.variant.image} alt="" width={40} height={40} className="rounded-lg object-cover bg-gray-100" />
                              ) : (
                                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                  <Package className="w-5 h-5 text-gray-400" />
                                </div>
                              )}
                              <div>
                                <p className="font-semibold text-gray-900">{item.product.name}</p>
                                {item.variant && <p className="text-xs text-gray-500">{item.variant.name}</p>}
                                <p className="text-xs text-gray-400">SKU: {item.product.sku}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 text-gray-600 font-medium">৳{item.unitPrice.toLocaleString()}</td>
                          <td className="p-4 text-center text-gray-600 font-bold">{item.quantity}</td>
                          <td className="p-4 text-center text-gray-400">{item.alreadyReturned}</td>
                          <td className="p-4">
                            <Input
                              type="number"
                              min="0"
                              max={returnState.maxQty}
                              value={returnState.quantity || ''}
                              onChange={(e) => {
                                const val = parseInt(e.target.value) || 0;
                                const newQty = Math.min(Math.max(0, val), returnState.maxQty);
                                const newItems = [...returnItems];
                                newItems[idx].quantity = newQty;
                                setReturnItems(newItems);
                              }}
                              className="text-center font-bold"
                            />
                          </td>
                          <td className="p-4 text-center">
                            <input
                              type="checkbox"
                              checked={returnState.restock}
                              onChange={(e) => {
                                const newItems = [...returnItems];
                                newItems[idx].restock = e.target.checked;
                                setReturnItems(newItems);
                              }}
                              disabled={returnState.quantity === 0}
                              className="w-5 h-5 rounded border-gray-300 text-blue-600 cursor-pointer"
                              title="Restock to inventory?"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Return</label>
                    <select
                      className="w-full h-10 px-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                    >
                      <option>Customer Change of Mind</option>
                      <option>Defective / Damaged</option>
                      <option>Wrong Item Sent</option>
                      <option>Exchange</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Internal Note (Optional)</label>
                    <Input
                      placeholder="Add any extra details..."
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                    />
                  </div>
                </div>

                <div className="bg-blue-50 rounded-xl p-6 border border-blue-100 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-sm font-medium text-blue-800">
                      <span>Calculated Refund:</span>
                      <span>৳{calculateAutoRefund().toLocaleString()}</span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-blue-900 mb-1">Custom Refund Amount (৳)</label>
                      <Input
                        type="number"
                        min="0"
                        placeholder={calculateAutoRefund().toString()}
                        value={customRefund === null ? '' : customRefund}
                        onChange={(e) => setCustomRefund(e.target.value ? parseFloat(e.target.value) : null)}
                        className="bg-white"
                      />
                      <p className="text-xs text-blue-600 mt-1">Leave empty to use calculated refund.</p>
                    </div>
                  </div>
                  <div className="mt-6 pt-4 border-t border-blue-200 flex justify-between items-end">
                    <span className="text-blue-900 font-bold">Total to Refund:</span>
                    <span className="text-3xl font-black text-blue-700">৳{totalRefund.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg flex gap-3 items-start">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <p>{error}</p>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={handleClose}>Cancel</Button>
                <Button 
                  onClick={handleProcessReturn} 
                  disabled={!hasItemsToReturn || isProcessing}
                  className="bg-blue-600 hover:bg-blue-700 min-w-[150px]"
                >
                  {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Return'}
                </Button>
              </div>

            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
