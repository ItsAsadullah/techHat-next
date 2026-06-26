'use client';

import { X, RotateCcw, ArrowLeftRight, User, Phone, CreditCard, Package, Shield, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import Image from 'next/image';
import { useEffect } from 'react';

function useHideMobileNav() {
  useEffect(() => {
    const nav = document.getElementById('admin-bottom-nav');
    if (nav) nav.style.display = 'none';
    return () => { if (nav) nav.style.display = ''; };
  }, []);
}

interface OrderDetailPanelProps {
  order: any;
  onClose: () => void;
  onReturn: (item: any) => void;
  onExchange: (item: any) => void;
}

export default function OrderDetailPanel({ order, onClose, onReturn, onExchange }: OrderDetailPanelProps) {
  useHideMobileNav();
  const alreadyReturnedMap: Record<string, number> = {};
  order.returns?.forEach((ret: any) => {
    ret.items?.forEach((ri: any) => {
      const key = `${ri.productId}__${ri.variantId || ''}`;
      alreadyReturnedMap[key] = (alreadyReturnedMap[key] || 0) + ri.quantity;
    });
  });

  return (
    /* Full-screen on mobile, centered modal on desktop */
    <div className="fixed inset-0 z-[55] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white w-full sm:rounded-2xl sm:shadow-2xl sm:w-full sm:max-w-2xl lg:max-w-4xl max-h-[95dvh] sm:max-h-[90vh] flex flex-col overflow-hidden rounded-t-2xl">

        {/* Header */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-700 text-white px-4 sm:px-6 py-4 flex items-center justify-between shrink-0">
          <div>
            <h2 className="font-bold text-base sm:text-lg tracking-tight">Invoice: {order.orderNumber}</h2>
            <p className="text-slate-300 text-xs mt-0.5">{format(new Date(order.createdAt), 'dd MMM yyyy, hh:mm a')}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Info Cards — horizontal scroll on mobile, grid on sm+ */}
        <div className="flex gap-3 px-4 sm:px-6 py-3 border-b border-gray-100 overflow-x-auto shrink-0 sm:grid sm:grid-cols-3 sm:overflow-x-visible">
          <InfoBlock
            icon={<User className="w-4 h-4 text-blue-500" />}
            label="Customer"
            value={order.customerName || 'Walk-in Customer'}
            sub={order.customerPhone}
          />
          <InfoBlock
            icon={<CreditCard className="w-4 h-4 text-green-500" />}
            label="Payment"
            value={`৳${order.grandTotal?.toLocaleString()}`}
            sub={order.paymentMethod}
          />
          <InfoBlock
            icon={<Package className="w-4 h-4 text-purple-500" />}
            label="Items"
            value={`${order.items?.length || 0} Products`}
            sub={`Status: ${order.status}`}
          />
        </div>

        {/* Product List — mobile cards, desktop table */}
        <div className="flex-1 overflow-auto px-4 sm:px-6 py-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Package className="w-4 h-4" /> Product List
          </h3>

          {/* ── Mobile Card List (< sm) ──────────────────────────── */}
          <div className="block sm:hidden space-y-3">
            {order.items?.map((item: any) => {
              const key = `${item.productId}__${item.variantId || ''}`;
              const returned = alreadyReturnedMap[key] || 0;
              const available = item.quantity - returned;
              const fullyReturned = available <= 0;
              const image = item.variant?.image || item.product?.productImages?.[0]?.url || item.product?.images?.[0];
              const sku = item.variant?.sku || item.product?.sku || null;
              const warrantyLabel = item.product?.warrantyMonths
                ? `${item.product.warrantyMonths}M ${item.product.warrantyType || ''}`.trim()
                : null;

              return (
                <div
                  key={item.id}
                  className={`rounded-xl border p-3 ${fullyReturned ? 'border-gray-100 bg-gray-50 opacity-60' : 'border-gray-200'}`}
                >
                  {/* Product info row */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden shrink-0 flex items-center justify-center border border-gray-200">
                      {image ? (
                        <Image src={image} alt={item.productName} width={48} height={48} className="object-cover w-full h-full" />
                      ) : (
                        <Package className="w-6 h-6 text-gray-300" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm leading-tight line-clamp-2">{item.productName}</p>
                      {item.variant?.name && <p className="text-xs text-gray-400 mt-0.5">{item.variant.name}</p>}
                      {sku && <p className="text-[10px] font-mono text-gray-400 mt-0.5">SKU: {sku}</p>}
                    </div>
                  </div>

                  {/* Stats row */}
                  <div className="flex items-center gap-3 flex-wrap mb-3">
                    <span className="text-xs text-gray-600">
                      Qty: <strong className="text-gray-900">{item.quantity}</strong>
                    </span>
                    <span className="text-xs text-gray-600">
                      Price: <strong className="text-gray-900">৳{item.unitPrice?.toLocaleString()}</strong>
                    </span>
                    {warrantyLabel && (
                      <Badge className="bg-green-100 text-green-700 border-green-200 text-[10px] gap-1">
                        <Shield className="w-3 h-3" /> {warrantyLabel}
                      </Badge>
                    )}
                    {fullyReturned ? (
                      <Badge className="bg-gray-100 text-gray-500 text-[10px] gap-1">
                        <CheckCircle className="w-3 h-3" /> Returned
                      </Badge>
                    ) : returned > 0 ? (
                      <Badge className="bg-amber-100 text-amber-700 text-[10px]">
                        {returned}/{item.quantity} returned
                      </Badge>
                    ) : (
                      <Badge className="bg-blue-100 text-blue-700 text-[10px]">Available</Badge>
                    )}
                  </div>

                  {/* Action buttons */}
                  {!fullyReturned && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onReturn({ ...item, availableToReturn: available, alreadyReturned: returned })}
                        className="flex-1 h-9 text-xs gap-1.5 text-blue-600 border-blue-200 hover:bg-blue-50 font-semibold"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Return
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onExchange({ ...item, availableToReturn: available, alreadyReturned: returned })}
                        className="flex-1 h-9 text-xs gap-1.5 text-indigo-600 border-indigo-200 hover:bg-indigo-50 font-semibold"
                      >
                        <ArrowLeftRight className="w-3.5 h-3.5" /> Exchange
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* ── Desktop Table (≥ sm) ────────────────────────────── */}
          <div className="rounded-xl border border-gray-200 overflow-hidden hidden sm:block">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                <tr className="border-b border-gray-100">
                  <th className="px-4 py-2.5 text-left font-semibold">Product</th>
                  <th className="px-4 py-2.5 text-left font-semibold">SKU</th>
                  <th className="px-4 py-2.5 text-center font-semibold">Qty</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Price</th>
                  <th className="px-4 py-2.5 text-center font-semibold hidden md:table-cell">Warranty</th>
                  <th className="px-4 py-2.5 text-center font-semibold">Status</th>
                  <th className="px-4 py-2.5 text-center font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {order.items?.map((item: any) => {
                  const key = `${item.productId}__${item.variantId || ''}`;
                  const returned = alreadyReturnedMap[key] || 0;
                  const available = item.quantity - returned;
                  const fullyReturned = available <= 0;
                  const image = item.variant?.image || item.product?.productImages?.[0]?.url || item.product?.images?.[0];
                  const sku = item.variant?.sku || item.product?.sku || '—';
                  const warrantyLabel = item.product?.warrantyMonths
                    ? `${item.product.warrantyMonths}M ${item.product.warrantyType || ''}`.trim()
                    : null;

                  return (
                    <tr key={item.id} className={`${fullyReturned ? 'opacity-50 bg-gray-50' : 'hover:bg-slate-50'}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden shrink-0 flex items-center justify-center">
                            {image ? (
                              <Image src={image} alt={item.productName} width={40} height={40} className="object-cover w-full h-full" />
                            ) : (
                              <Package className="w-5 h-5 text-gray-300" />
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 text-xs leading-tight line-clamp-1">{item.productName}</p>
                            {item.variant?.name && <p className="text-xs text-gray-400 mt-0.5">{item.variant.name}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs text-gray-500">{sku}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="font-bold text-gray-900">{item.quantity}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-semibold text-gray-900">৳{item.unitPrice?.toLocaleString()}</span>
                      </td>
                      <td className="px-4 py-3 text-center hidden md:table-cell">
                        {warrantyLabel ? (
                          <Badge className="bg-green-100 text-green-700 border-green-200 text-[10px] gap-1">
                            <Shield className="w-3 h-3" /> {warrantyLabel}
                          </Badge>
                        ) : (
                          <span className="text-gray-300 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {fullyReturned ? (
                          <Badge className="bg-gray-100 text-gray-500 text-[10px] gap-1">
                            <CheckCircle className="w-3 h-3" /> Returned
                          </Badge>
                        ) : returned > 0 ? (
                          <Badge className="bg-amber-100 text-amber-700 text-[10px]">
                            {returned}/{item.quantity} returned
                          </Badge>
                        ) : (
                          <Badge className="bg-blue-100 text-blue-700 text-[10px]">Available</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {!fullyReturned && (
                          <div className="flex items-center justify-center gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onReturn({ ...item, availableToReturn: available, alreadyReturned: returned })}
                              className="h-7 px-2 text-xs gap-1 text-blue-600 border-blue-200 hover:bg-blue-50"
                            >
                              <RotateCcw className="w-3 h-3" /> Return
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onExchange({ ...item, availableToReturn: available, alreadyReturned: returned })}
                              className="h-7 px-2 text-xs gap-1 text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                            >
                              <ArrowLeftRight className="w-3 h-3" /> Exchange
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-3 border-t border-gray-100 flex justify-end shrink-0">
          <Button variant="outline" onClick={onClose} className="text-sm w-full sm:w-auto h-11 sm:h-9">Close</Button>
        </div>
      </div>
    </div>
  );
}

function InfoBlock({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl shrink-0 min-w-[160px] sm:min-w-0">
      <div className="mt-0.5">{icon}</div>
      <div>
        <p className="text-xs text-gray-400 font-medium">{label}</p>
        <p className="font-bold text-gray-900 text-sm leading-tight">{value}</p>
        {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}
