'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Printer, ArrowLeft, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrder() {
      try {
        const { getOrderById } = await import('@/lib/actions/order-actions');
        const result = await getOrderById(id);
        if (result.success && result.order) {
          setOrder(result.order);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchOrder();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-gray-400">
        <AlertTriangle className="w-16 h-16 mb-4" />
        <p className="text-lg font-semibold text-gray-600">Invoice not found</p>
        <Button variant="outline" className="mt-4" onClick={() => router.back()}>
          Go Back
        </Button>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  const PAYMENT_METHOD_LABELS: Record<string, string> = {
    CASH: 'Cash on Delivery',
    CARD: 'Card Payment',
    MOBILE_BANKING: 'Mobile Banking',
    ONLINE: 'Online Payment',
    MIXED: 'Mixed Payment',
  };

  const formatDate = (d: string) => {
    return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const formatPrice = (p: number) => {
    return `৳${p.toLocaleString('en-BD')}`;
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* Top action bar (Hidden in print) */}
      <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-gray-200 print:hidden">
        <Button variant="ghost" onClick={() => router.back()} className="text-gray-600">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        <div className="flex items-center gap-3">
          <Button onClick={handlePrint} className="bg-gray-900 text-white hover:bg-gray-800">
            <Printer className="w-4 h-4 mr-2" /> Print Invoice
          </Button>
        </div>
      </div>

      {/* Invoice Document (A4 size wrapper) */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden print:border-none print:shadow-none print:m-0 print:p-0">
        {/* We use an explicit container that mimics A4 width in normal view and fills the page in print view */}
        <div className="mx-auto w-full max-w-[210mm] min-h-[297mm] bg-white text-gray-900 p-8 sm:p-12">
          {/* Header */}
          <div className="flex justify-between items-start border-b-2 border-gray-900 pb-6 mb-8">
            <div>
              <h1 className="text-4xl font-black tracking-tight">
                <span className="text-red-600">TECH</span> HAT
              </h1>
              <p className="text-xs text-gray-500 italic mt-1 font-medium">Trusted Place of Technology</p>
            </div>
            <div className="text-right">
              <h2 className="text-3xl font-bold tracking-widest text-gray-800 uppercase">Invoice</h2>
              <p className="text-lg font-bold text-gray-900 mt-1">{order.orderNumber}</p>
              <p className="text-sm text-gray-600 mt-1">Date: {formatDate(order.createdAt)}</p>
            </div>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-8 mb-10">
            <div>
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Bill To</h4>
              <p className="font-bold text-lg text-gray-900">{order.customerName || 'N/A'}</p>
              <p className="text-sm text-gray-700">{order.customerPhone}</p>
              {order.customerEmail && <p className="text-sm text-gray-700">{order.customerEmail}</p>}
              {order.shippingAddress && <p className="text-sm text-gray-700 mt-1">{order.shippingAddress}</p>}
            </div>
            <div className="text-right">
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Payment Details</h4>
              <p className="text-sm text-gray-700">Method: <span className="font-semibold">{PAYMENT_METHOD_LABELS[order.paymentMethod] || order.paymentMethod}</span></p>
              <p className="text-sm text-gray-700">Status: <span className="font-semibold">{order.paymentStatus}</span></p>
              {order.transactionId && <p className="text-sm text-gray-700">TrxID: {order.transactionId}</p>}
            </div>
          </div>

          {/* Items Table */}
          <table className="w-full mb-10 border-collapse">
            <thead>
              <tr className="bg-gray-100 border-b-2 border-gray-300">
                <th className="py-3 px-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Product</th>
                <th className="py-3 px-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Qty</th>
                <th className="py-3 px-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">Price</th>
                <th className="py-3 px-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {order.items.map((item: any) => (
                <tr key={item.id}>
                  <td className="py-4 px-4">
                    <p className="font-semibold text-gray-900 text-sm">{item.productName}</p>
                    {item.variant && <p className="text-xs text-gray-500 mt-1">{item.variant.name}</p>}
                  </td>
                  <td className="py-4 px-4 text-center text-sm">{item.quantity}</td>
                  <td className="py-4 px-4 text-right text-sm">{formatPrice(item.unitPrice)}</td>
                  <td className="py-4 px-4 text-right font-semibold text-gray-900 text-sm">{formatPrice(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-72 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium text-gray-900">{formatPrice(order.totalAmount)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span className="font-medium">-{formatPrice(order.discount)}</span>
                </div>
              )}
              {order.tax > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>Tax</span>
                  <span className="font-medium">{formatPrice(order.tax)}</span>
                </div>
              )}
              {order.shippingCost > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span className="font-medium">{formatPrice(order.shippingCost)}</span>
                </div>
              )}
              <div className="flex justify-between border-t-2 border-gray-900 pt-3 mt-3">
                <span className="font-bold text-lg text-gray-900">Grand Total</span>
                <span className="font-bold text-lg text-gray-900">{formatPrice(order.grandTotal)}</span>
              </div>
            </div>
          </div>

          {/* Note */}
          {order.orderNote && (
            <div className="mt-12 bg-amber-50 border border-amber-200 rounded-lg p-4">
              <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-1">Order Note</h4>
              <p className="text-sm text-amber-900">{order.orderNote}</p>
            </div>
          )}

          {/* Footer */}
          <div className="mt-20 pt-8 border-t border-gray-200 text-center space-y-2">
            <p className="text-sm font-bold text-gray-800">Thank you for your business!</p>
            <p className="text-xs text-gray-500">TechHat • Haildhani Bazar, Jhenaidah Sadar, Jhenaidah</p>
          </div>
        </div>
      </div>
    </div>
  );
}
