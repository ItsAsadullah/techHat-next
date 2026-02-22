'use client';

import { DollarSign, ShoppingCart, Package, Clock } from 'lucide-react';

interface DailySummaryProps {
  totalSales: number;
  totalOrders: number;
  totalItems: number;
}

export function POSDailySummary({ totalSales, totalOrders, totalItems }: DailySummaryProps) {
  return (
    <div className="flex items-center gap-6 px-4 py-2 bg-gray-50/80 border-b border-gray-100">
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 text-gray-400" />
        <span className="text-xs font-semibold text-gray-500">
          {new Date().toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
          })}
        </span>
      </div>
      <div className="h-4 w-px bg-gray-200" />
      <div className="flex items-center gap-1.5">
        <DollarSign className="h-3.5 w-3.5 text-green-600" />
        <span className="text-xs font-bold text-gray-700">৳{totalSales.toLocaleString()}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <ShoppingCart className="h-3.5 w-3.5 text-blue-600" />
        <span className="text-xs font-bold text-gray-700">{totalOrders} orders</span>
      </div>
      <div className="flex items-center gap-1.5">
        <Package className="h-3.5 w-3.5 text-purple-600" />
        <span className="text-xs font-bold text-gray-700">{totalItems} items</span>
      </div>
    </div>
  );
}
