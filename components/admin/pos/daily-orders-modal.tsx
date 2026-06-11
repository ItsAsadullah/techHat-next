'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ShoppingCart, Package, DollarSign, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { getDailyPOSOrders } from '@/lib/actions/pos-actions';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface DailyOrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetDate: string; // ISO string
}

export function DailyOrdersModal({ isOpen, onClose, targetDate }: DailyOrdersModalProps) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      getDailyPOSOrders(targetDate).then((data) => {
        setOrders(data);
        setLoading(false);
      });
    }
  }, [isOpen, targetDate]);

  const totalSales = orders.reduce((sum, o) => sum + o.grandTotal, 0);
  const totalItems = orders.reduce((sum, o) => sum + o.items.reduce((s: number, i: any) => s + i.quantity, 0), 0);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col p-0 overflow-hidden border-0 shadow-2xl rounded-2xl">
        <DialogHeader className="px-6 py-5 border-b border-gray-100 shrink-0 bg-white pr-14 relative">
          {/* A subtle gradient line at the top to make it look premium */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-blue-500 via-purple-500 to-blue-500 opacity-80" />
          
          <DialogTitle className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-lg sm:text-xl font-black">
            <div className="flex items-center gap-2.5 text-gray-900">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                <ShoppingCart className="h-4 w-4 text-blue-600" />
              </div>
              <span className="truncate">Daily Sales History</span>
            </div>
            <div className="text-xs sm:text-sm font-bold text-gray-500 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100 self-start sm:self-auto shrink-0">
              {new Date(targetDate).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </div>
          </DialogTitle>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-5">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 bg-blue-50/50 p-3 sm:px-4 sm:py-2.5 rounded-xl border border-blue-100/50">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-[10px] sm:text-[11px] text-blue-600/80 font-bold uppercase tracking-wider">Orders</p>
                <p className="text-base sm:text-lg font-black text-blue-900 leading-none mt-0.5">{orders.length}</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 bg-purple-50/50 p-3 sm:px-4 sm:py-2.5 rounded-xl border border-purple-100/50">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                <Package className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-[10px] sm:text-[11px] text-purple-600/80 font-bold uppercase tracking-wider">Items</p>
                <p className="text-base sm:text-lg font-black text-purple-900 leading-none mt-0.5">{totalItems}</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 bg-green-50/50 p-3 sm:px-4 sm:py-2.5 rounded-xl border border-green-100/50 col-span-2 sm:col-span-1">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
              </div>
              <div>
                <p className="text-[10px] sm:text-[11px] text-green-600/80 font-bold uppercase tracking-wider">Revenue</p>
                <p className="text-base sm:text-lg font-black text-green-900 leading-none mt-0.5">৳{totalSales.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gray-50/50">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No sales recorded on this date</p>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => {
                const isExpanded = expandedOrderId === order.id;
                const itemsCount = order.items.reduce((s: number, i: any) => s + i.quantity, 0);
                
                return (
                  <div key={order.id} className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all duration-200">
                    <div 
                      className="px-4 sm:px-5 py-4 cursor-pointer hover:bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                    >
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div className={cn(
                          "w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                          isExpanded ? "bg-blue-600 text-white shadow-md shadow-blue-200" : "bg-gray-50 text-gray-400 border border-gray-100"
                        )}>
                          <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 text-sm sm:text-base">{order.orderNumber}</p>
                          <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-gray-500">
                            <span className="flex items-center gap-1 font-medium bg-gray-100 px-2 py-0.5 rounded-md"><Clock className="w-3 h-3 text-gray-400"/> {new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                            <span className="font-bold text-gray-400 uppercase tracking-wide text-[10px] bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-md">{order.paymentMethod}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-6 w-full sm:w-auto mt-2 sm:mt-0 pt-3 sm:pt-0 border-t border-gray-50 sm:border-0">
                        <div className="text-left sm:text-right">
                          <p className="text-[10px] sm:text-[11px] text-gray-400 font-bold uppercase tracking-wider">Items</p>
                          <p className="text-sm sm:text-base font-black text-gray-700">{itemsCount}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] sm:text-[11px] text-gray-400 font-bold uppercase tracking-wider">Total</p>
                          <p className="text-base sm:text-lg font-black text-blue-600 leading-tight">৳{order.grandTotal.toLocaleString()}</p>
                        </div>
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center transition-colors shrink-0",
                          isExpanded ? "bg-gray-100 text-gray-900" : "text-gray-400 hover:bg-gray-50 hover:text-gray-900"
                        )}>
                          {isExpanded ? <ChevronUp className="w-5 h-5"/> : <ChevronDown className="w-5 h-5"/>}
                        </div>
                      </div>
                    </div>
                    
                    {isExpanded && (
                      <div className="border-t border-gray-50 bg-gray-50/50 p-5 sm:px-6">
                        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Purchased Items</h4>
                        <div className="grid sm:grid-cols-2 gap-3">
                          {order.items.map((item: any) => {
                            const imgUrl = item.variant?.image || item.product?.productImages?.[0]?.url;
                            return (
                              <div key={item.id} className="flex items-center gap-3.5 bg-white p-3 rounded-xl border border-gray-100 shadow-xs hover:border-blue-100 transition-colors">
                                <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-gray-50 shrink-0 border border-gray-100/50">
                                  {imgUrl ? (
                                    <Image src={imgUrl} alt={item.productName} fill className="object-cover" sizes="56px" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <Package className="h-6 w-6 text-gray-200" />
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-bold text-gray-800 truncate">{item.productName}</p>
                                  {item.variantName && item.variantName !== 'Default' && (
                                    <p className="text-xs font-semibold text-blue-600 mt-0.5">{item.variantName}</p>
                                  )}
                                  <div className="flex items-center justify-between mt-2">
                                    <span className="text-[11px] font-bold text-gray-400 bg-gray-50 px-2 py-0.5 rounded-md border border-gray-100">
                                      ৳{item.unitPrice.toLocaleString()} × {item.quantity}
                                    </span>
                                    <span className="text-sm font-black text-gray-900">
                                      ৳{item.total.toLocaleString()}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
