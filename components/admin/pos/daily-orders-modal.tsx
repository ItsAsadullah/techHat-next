'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ShoppingCart, Package, DollarSign, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { getDailyPOSOrders } from '@/lib/actions/pos-actions';
import Image from 'next/image';

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
      <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b border-gray-100 shrink-0 bg-gray-50/50">
          <DialogTitle className="flex items-center justify-between text-lg font-bold">
            <div className="flex items-center gap-2 text-gray-900">
              <ShoppingCart className="h-5 w-5 text-blue-600" />
              Daily Sales History
            </div>
            <div className="text-sm font-semibold text-gray-500">
              {new Date(targetDate).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </div>
          </DialogTitle>
          
          <div className="flex items-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <ShoppingCart className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-semibold">Orders</p>
                <p className="text-sm font-bold text-gray-900">{orders.length}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                <Package className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-semibold">Items Sold</p>
                <p className="text-sm font-bold text-gray-900">{totalItems}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-semibold">Total Revenue</p>
                <p className="text-sm font-bold text-gray-900">৳{totalSales.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 bg-gray-50/30">
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
                  <div key={order.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    <div 
                      className="px-5 py-4 cursor-pointer hover:bg-gray-50 flex flex-wrap items-center justify-between gap-4"
                      onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                          <ShoppingCart className="h-4 w-4 text-gray-500" />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 text-sm">{order.orderNumber}</p>
                          <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3"/> {new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                            <span>•</span>
                            <span className="font-medium">{order.paymentMethod}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-6">
                        <div className="text-right hidden sm:block">
                          <p className="text-xs text-gray-500 font-semibold">Items</p>
                          <p className="text-sm font-bold text-gray-900">{itemsCount}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500 font-semibold">Total</p>
                          <p className="text-sm font-black text-blue-600">৳{order.grandTotal.toLocaleString()}</p>
                        </div>
                        <div className="text-gray-400">
                          {isExpanded ? <ChevronUp className="w-5 h-5"/> : <ChevronDown className="w-5 h-5"/>}
                        </div>
                      </div>
                    </div>
                    
                    {isExpanded && (
                      <div className="border-t border-gray-100 bg-gray-50/50 p-5">
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Items Purchased</h4>
                        <div className="space-y-3">
                          {order.items.map((item: any) => {
                            const imgUrl = item.variant?.image || item.product?.productImages?.[0]?.url;
                            return (
                              <div key={item.id} className="flex items-center gap-3 bg-white p-3 rounded-lg border border-gray-100 shadow-xs">
                                <div className="relative w-12 h-12 rounded-md overflow-hidden bg-gray-100 shrink-0 border border-gray-200">
                                  {imgUrl ? (
                                    <Image src={imgUrl} alt={item.productName} fill className="object-cover" sizes="48px" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <Package className="h-5 w-5 text-gray-300" />
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-bold text-gray-900 truncate">{item.productName}</p>
                                  <div className="flex items-center justify-between mt-1">
                                    <span className="text-xs font-semibold text-gray-500">
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
