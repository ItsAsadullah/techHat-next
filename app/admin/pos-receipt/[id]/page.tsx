'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Printer, ArrowLeft, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function POSReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [invoiceSettings, setInvoiceSettings] = useState<any>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const { getOrderById } = await import('@/lib/actions/order-actions');
        const { getInvoiceSettings } = await import('@/lib/actions/invoice-settings-actions');
        
        const [orderRes, settingsRes] = await Promise.all([
          getOrderById(id),
          getInvoiceSettings()
        ]);
        
        if (orderRes.success && orderRes.order) {
          setOrder(orderRes.order);
        }
        setInvoiceSettings(settingsRes);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
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
        <p className="text-lg font-semibold text-gray-600">Receipt not found</p>
        <Button variant="outline" className="mt-4" onClick={() => router.back()}>
          Go Back
        </Button>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  const formatDate = (d: string) => {
    return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const companyName = invoiceSettings?.invoiceCompanyName || 'TechHat';
  const companyAddress = invoiceSettings?.invoiceCompanyAddress || 'Haildhani Bazar, Jhenaidah';
  const companyPhone = invoiceSettings?.invoiceCompanyPhone || '+880 1911-777694';

  return (
    <div className="max-w-md mx-auto p-4 space-y-6">
      {/* Action Bar (Hidden when printing) */}
      <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-gray-200 print:hidden">
        <Button variant="ghost" onClick={() => router.back()} className="text-gray-600">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        <Button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700 text-white">
          <Printer className="w-4 h-4 mr-2" /> Print Receipt
        </Button>
      </div>

      {/* POS Thermal Receipt Format (80mm width standard) */}
      <div className="bg-white mx-auto shadow-sm print:shadow-none print:m-0" style={{ width: '80mm', minHeight: '100mm', padding: '10mm 5mm', color: '#000', fontFamily: 'monospace' }}>
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold uppercase mb-1">{companyName}</h1>
          <p className="text-xs">{companyAddress}</p>
          <p className="text-xs">Tel: {companyPhone}</p>
          <div className="mt-4 text-sm font-bold border-b border-dashed border-gray-400 pb-2">
            SALES RECEIPT
          </div>
        </div>

        {/* Meta Info */}
        <div className="text-xs mb-4 space-y-1">
          <div className="flex justify-between">
            <span>Date:</span>
            <span>{formatDate(order.createdAt)}</span>
          </div>
          <div className="flex justify-between">
            <span>Invoice No:</span>
            <span className="font-bold">{order.orderNumber}</span>
          </div>
          <div className="flex justify-between">
            <span>Cashier:</span>
            <span>{order.posStaffName || 'Admin'}</span>
          </div>
          {order.customerName && (
            <div className="flex justify-between mt-2 pt-2 border-t border-dashed border-gray-300">
              <span>Customer:</span>
              <span className="font-bold">{order.customerName}</span>
            </div>
          )}
          {order.customerPhone && (
            <div className="flex justify-between">
              <span>Phone:</span>
              <span>{order.customerPhone}</span>
            </div>
          )}
        </div>

        {/* Items */}
        <table className="w-full text-xs mb-4">
          <thead>
            <tr className="border-y border-dashed border-gray-400">
              <th className="py-1 text-left">Item</th>
              <th className="py-1 text-center">Qty</th>
              <th className="py-1 text-right">Price</th>
              <th className="py-1 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="border-b border-dashed border-gray-400">
            {order.items.map((item: any) => (
              <tr key={item.id}>
                <td className="py-2 pr-2">
                  <div className="font-semibold">{item.productName}</div>
                  {item.variant && <div className="text-[10px] text-gray-500">{item.variant.name}</div>}
                </td>
                <td className="py-2 text-center align-top">{item.quantity}</td>
                <td className="py-2 text-right align-top">{item.unitPrice}</td>
                <td className="py-2 text-right align-top font-bold">{item.total}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="text-xs space-y-1 mb-6">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>{order.totalAmount}</span>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between">
              <span>Discount:</span>
              <span>-{order.discount}</span>
            </div>
          )}
          {order.tax > 0 && (
            <div className="flex justify-between">
              <span>Tax/VAT:</span>
              <span>{order.tax}</span>
            </div>
          )}
          <div className="flex justify-between text-sm font-bold border-t border-dashed border-gray-400 pt-1 mt-1">
            <span>Grand Total:</span>
            <span>{order.grandTotal}</span>
          </div>
          
          <div className="flex justify-between pt-2">
            <span>Paid Amount ({order.paymentMethod}):</span>
            <span>{order.paidAmount}</span>
          </div>
          {order.dueAmount > 0 && (
            <div className="flex justify-between font-bold text-red-600">
              <span>Due Amount:</span>
              <span>{order.dueAmount}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center text-xs space-y-2 border-t border-dashed border-gray-400 pt-4">
          <p className="font-bold">Thank you for shopping with us!</p>
          <p className="text-[10px]">Returns accepted within 7 days with original receipt.</p>
          <p className="text-[10px] mt-4 font-mono">Powered by TechHat ERP</p>
        </div>

      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * {
            visibility: hidden;
          }
          .max-w-md > div:last-child, .max-w-md > div:last-child * {
            visibility: visible;
          }
          .max-w-md > div:last-child {
            position: absolute;
            left: 0;
            top: 0;
            width: 80mm;
          }
          @page {
            size: 80mm auto;
            margin: 0;
          }
        }
      `}} />
    </div>
  );
}
