'use client';

import { Eye, RotateCcw, ArrowLeftRight, FileText, User, Phone, Package, MoreHorizontal, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import Image from 'next/image';

interface RecentSalesTableProps {
  orders: any[];
  isLoading: boolean;
  onViewOrder: (order: any) => void;
  onReturnOrder: (order: any) => void;
  onExchangeOrder: (order: any) => void;
}

export default function RecentSalesTable({
  orders,
  isLoading,
  onViewOrder,
  onReturnOrder,
  onExchangeOrder,
}: RecentSalesTableProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-full">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between shrink-0">
        <h2 className="font-semibold text-gray-800 text-sm flex items-center gap-2">
          <FileText className="w-4 h-4 text-gray-400" />
          Recent Invoices
        </h2>
        <span className="text-xs text-gray-400">{orders.length} results</span>
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : orders.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 p-8">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
            <Package className="w-8 h-8 text-gray-300" />
          </div>
          <p className="text-sm font-medium text-gray-500">No invoices found</p>
          <p className="text-xs text-gray-400">Try adjusting your search or date filter</p>
        </div>
      ) : (
        <div className="overflow-auto flex-1">
          {/* ── Mobile Card List (< md) ─────────────────────────────────── */}
          <div className="block md:hidden divide-y divide-gray-100">
            {orders.map((order) => {
              const hasReturn = order.returns?.length > 0;
              const firstItem = order.items?.[0];
              const img =
                firstItem?.variant?.image ||
                firstItem?.product?.productImages?.[0]?.url ||
                firstItem?.product?.images?.[0];
              const totalItems = order.items?.length ?? 0;

              return (
                <div
                  key={order.id}
                  className="px-4 py-3.5 active:bg-blue-50/40 transition-colors"
                  onClick={() => onViewOrder(order)}
                >
                  {/* Row 1: Date + Invoice + Status */}
                  <div className="flex items-start justify-between gap-2 mb-2.5">
                    <div className="flex flex-col">
                      <span className="font-bold text-gray-900 text-xs font-mono">{order.orderNumber}</span>
                      <span className="text-[10px] text-gray-400 mt-0.5">
                        {format(new Date(order.createdAt), 'dd MMM yyyy · hh:mm a')}
                      </span>
                      {hasReturn && (
                        <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full w-fit">
                          <RotateCcw className="w-2.5 h-2.5" /> Partial Return
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <PaymentStatusBadge status={order.posPaymentStatus || order.paymentStatus} />
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuLabel className="text-xs text-gray-400">Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onViewOrder(order); }} className="gap-2 cursor-pointer">
                            <Eye className="w-4 h-4" /> View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onReturnOrder(order); }} className="gap-2 cursor-pointer text-blue-600 focus:text-blue-600">
                            <RotateCcw className="w-4 h-4" /> Return Item
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onExchangeOrder(order); }} className="gap-2 cursor-pointer text-indigo-600 focus:text-indigo-600">
                            <ArrowLeftRight className="w-4 h-4" /> Exchange Item
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Row 2: Product + Customer + Amount */}
                  <div className="flex items-center gap-3">
                    {/* Product thumb */}
                    <div className="w-10 h-10 bg-gray-100 rounded-lg border border-gray-200 overflow-hidden shrink-0 flex items-center justify-center">
                      {img ? (
                        <Image src={img} alt={firstItem?.productName || ''} width={40} height={40} className="object-cover w-full h-full" />
                      ) : (
                        <Package className="w-4 h-4 text-gray-300" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-800 line-clamp-1">
                        {firstItem?.productName || 'No items'}
                      </p>
                      {totalItems > 1 && (
                        <p className="text-[10px] text-gray-400">+{totalItems - 1} more</p>
                      )}
                      <div className="flex items-center gap-1 mt-1">
                        <User className="w-3 h-3 text-gray-300 shrink-0" />
                        <span className="text-[11px] text-gray-500 truncate">{order.customerName || 'Walk-in'}</span>
                        {order.customerPhone && (
                          <>
                            <span className="text-gray-200">·</span>
                            <Phone className="w-3 h-3 text-gray-300 shrink-0" />
                            <span className="text-[11px] text-gray-500">{order.customerPhone}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <span className="font-bold text-gray-900 text-sm shrink-0">
                      ৳{order.grandTotal.toLocaleString()}
                    </span>
                  </div>

                  {/* Row 3: Quick Action Buttons */}
                  <div className="flex gap-2 mt-3" onClick={(e) => e.stopPropagation()}>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => { e.stopPropagation(); onViewOrder(order); }}
                      className="flex-1 h-8 text-[11px] gap-1 text-gray-600"
                    >
                      <Eye className="w-3 h-3" /> Details
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => { e.stopPropagation(); onReturnOrder(order); }}
                      className="flex-1 h-8 text-[11px] gap-1 text-blue-600 border-blue-200 hover:bg-blue-50"
                    >
                      <RotateCcw className="w-3 h-3" /> Return
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => { e.stopPropagation(); onExchangeOrder(order); }}
                      className="flex-1 h-8 text-[11px] gap-1 text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                    >
                      <ArrowLeftRight className="w-3 h-3" /> Exchange
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Desktop Table (≥ md) ─────────────────────────────────────── */}
          <table className="w-full border-collapse text-sm hidden md:table">
            <thead className="sticky top-0 bg-gray-50 z-10">
              <tr className="text-xs text-gray-500 uppercase tracking-wider border-b border-gray-100">
                <th className="px-4 py-2.5 text-left font-semibold">Date</th>
                <th className="px-4 py-2.5 text-left font-semibold">Invoice No</th>
                <th className="px-4 py-2.5 text-left font-semibold hidden lg:table-cell">Product</th>
                <th className="px-4 py-2.5 text-left font-semibold">Customer</th>
                <th className="px-4 py-2.5 text-right font-semibold">Total</th>
                <th className="px-4 py-2.5 text-left font-semibold">Status</th>
                <th className="px-4 py-2.5 text-center font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {orders.map((order) => {
                const hasReturn = order.returns?.length > 0;
                const totalItems = order.items?.length ?? 0;

                return (
                  <tr
                    key={order.id}
                    className="hover:bg-blue-50/40 transition-colors group cursor-pointer"
                    onClick={() => onViewOrder(order)}
                  >
                    <td className="px-4 py-3">
                      <div className="text-xs text-gray-600">
                        <div className="font-medium">{format(new Date(order.createdAt), 'dd MMM yyyy')}</div>
                        <div className="text-gray-400">{format(new Date(order.createdAt), 'hh:mm a')}</div>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-bold text-gray-900 text-xs font-mono">{order.orderNumber}</span>
                        {hasReturn && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full w-fit">
                            <RotateCcw className="w-2.5 h-2.5" /> Partial Return
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3 hidden lg:table-cell">
                      <div className="flex items-center gap-2">
                        {order.items && order.items.length > 0 ? (() => {
                          const firstItem = order.items[0];
                          const img = firstItem.variant?.image || firstItem.product?.productImages?.[0]?.url || firstItem.product?.images?.[0];
                          return (
                            <>
                              <div className="w-8 h-8 bg-gray-100 rounded border border-gray-200 overflow-hidden flex items-center justify-center shrink-0">
                                {img ? (
                                  <Image src={img} alt={firstItem.productName} width={32} height={32} className="object-cover w-full h-full" />
                                ) : (
                                  <Package className="w-4 h-4 text-gray-300" />
                                )}
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="text-xs font-semibold text-gray-800 line-clamp-1">{firstItem.productName}</span>
                                {(firstItem.variant?.sku || firstItem.product?.sku) && (
                                  <span className="text-[10px] text-gray-500 font-mono mt-0.5">SKU: {firstItem.variant?.sku || firstItem.product?.sku}</span>
                                )}
                                {totalItems > 1 && (
                                  <span className="text-[10px] text-gray-400 font-medium mt-0.5">
                                    +{totalItems - 1} more item{totalItems - 1 !== 1 ? 's' : ''}
                                  </span>
                                )}
                              </div>
                            </>
                          );
                        })() : (
                          <span className="text-xs text-gray-400">No items</span>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-0.5">
                        <span className="flex items-center gap-1 text-xs font-semibold text-gray-800">
                          <User className="w-3 h-3 text-gray-400 shrink-0" />
                          {order.customerName || 'Walk-in'}
                        </span>
                        {order.customerPhone && (
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            <Phone className="w-3 h-3 text-gray-300 shrink-0" />
                            {order.customerPhone}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3 text-right">
                      <span className="font-bold text-gray-900 text-sm">৳{order.grandTotal.toLocaleString()}</span>
                    </td>

                    <td className="px-4 py-3">
                      <PaymentStatusBadge status={order.posPaymentStatus || order.paymentStatus} />
                    </td>

                    <td className="px-4 py-3 text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8 opacity-60 group-hover:opacity-100">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuLabel className="text-xs text-gray-400">Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onViewOrder(order); }} className="gap-2 cursor-pointer">
                            <Eye className="w-4 h-4" /> View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onReturnOrder(order); }} className="gap-2 cursor-pointer text-blue-600 focus:text-blue-600">
                            <RotateCcw className="w-4 h-4" /> Return Item
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onExchangeOrder(order); }} className="gap-2 cursor-pointer text-indigo-600 focus:text-indigo-600">
                            <ArrowLeftRight className="w-4 h-4" /> Exchange Item
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function PaymentStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    PAID: { label: 'Paid', className: 'bg-green-100 text-green-700 border-green-200' },
    PARTIAL: { label: 'Partial', className: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
    DUE: { label: 'Due', className: 'bg-red-100 text-red-700 border-red-200' },
    PARTIALLY_PAID: { label: 'Part. Paid', className: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
    UNPAID: { label: 'Unpaid', className: 'bg-red-100 text-red-700 border-red-200' },
  };
  const s = map[status] || { label: status, className: 'bg-gray-100 text-gray-600 border-gray-200' };
  return <Badge className={`text-[10px] px-2 py-0.5 border font-semibold ${s.className}`}>{s.label}</Badge>;
}
