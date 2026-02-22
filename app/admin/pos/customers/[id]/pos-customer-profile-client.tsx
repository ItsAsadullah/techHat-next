'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Phone, MapPin, ShoppingBag, AlertCircle, Printer, Plus, CheckCircle2 } from 'lucide-react';
import { recordDuePayment } from '@/lib/actions/pos-customer-actions';
import { toast } from 'sonner';

type OrderStatus = 'PAID' | 'PARTIAL' | 'DUE' | null;

interface CustomerOrder {
  id: string;
  orderNumber: string;
  grandTotal: number;
  paidAmount: number | null;
  dueAmount: number | null;
  posPaymentStatus: OrderStatus;
  createdAt: Date;
  items: { productName: string; quantity: number; unitPrice: number }[];
  guarantor: { name: string; phone: string; relation: string | null } | null;
}

interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  address?: string | null;
  totalPurchase: number;
  totalDue: number;
  orders: CustomerOrder[];
}

interface Props {
  customer: Customer;
}

const statusBadge = (status: OrderStatus) => {
  if (status === 'PAID') return <Badge className="bg-green-100 text-green-700 border-0">PAID</Badge>;
  if (status === 'PARTIAL') return <Badge className="bg-yellow-100 text-yellow-700 border-0">PARTIAL</Badge>;
  if (status === 'DUE') return <Badge className="bg-red-100 text-red-700 border-0">DUE</Badge>;
  return <Badge variant="secondary">PAID</Badge>;
};

export function POSCustomerProfileClient({ customer }: Props) {
  const router = useRouter();
  const [payingOrderId, setPayingOrderId] = useState<string | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRecordPayment = async (orderId: string) => {
    const amount = parseFloat(payAmount);
    if (!amount || amount <= 0) return toast.error('Enter a valid amount');
    setIsSubmitting(true);
    try {
      await recordDuePayment(orderId, amount);
      toast.success('Payment recorded!');
      setPayingOrderId(null);
      setPayAmount('');
      router.refresh();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Back */}
      <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-2">
        <ArrowLeft className="h-4 w-4" /> Back to Customers
      </Button>

      {/* Profile Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gray-900 flex items-center justify-center text-white text-2xl font-bold">
                {customer.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{customer.name}</h1>
                <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                  <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{customer.phone}</span>
                  {customer.address && (
                    <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{customer.address}</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-1">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">{customer.orders.length}</p>
            </div>
            <div className="bg-green-50 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-1">Total Purchase</p>
              <p className="text-2xl font-bold text-green-700">৳{customer.totalPurchase.toLocaleString()}</p>
            </div>
            <div className={`rounded-xl p-4 ${customer.totalDue > 0 ? 'bg-red-50' : 'bg-gray-50'}`}>
              <p className="text-xs text-gray-500 mb-1">Total Due</p>
              <p className={`text-2xl font-bold ${customer.totalDue > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                ৳{customer.totalDue.toLocaleString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invoice History */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ShoppingBag className="h-4 w-4" />
            Invoice History
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Invoice</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Date</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Total</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Paid</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Due</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600">Status</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {customer.orders.map((order) => (
                  <React.Fragment key={order.id}>
                    <tr className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono font-semibold text-gray-700">{order.orderNumber}</td>
                      <td className="px-4 py-3 text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString('en-US', { dateStyle: 'medium' })}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold">৳{order.grandTotal.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-green-600 font-semibold">
                        ৳{(order.paidAmount ?? order.grandTotal).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {(order.dueAmount ?? 0) > 0 ? (
                          <span className="text-red-600 font-semibold">৳{order.dueAmount!.toLocaleString()}</span>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3 text-center">{statusBadge(order.posPaymentStatus)}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
                            <Printer className="h-3 w-3" /> Print
                          </Button>
                          {(order.dueAmount ?? 0) > 0 && (
                            <Button
                              size="sm"
                              className="h-7 text-xs gap-1 bg-red-600 hover:bg-red-700 text-white"
                              onClick={() => setPayingOrderId(payingOrderId === order.id ? null : order.id)}
                            >
                              <Plus className="h-3 w-3" /> Pay Due
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {/* Guarantor row */}
                    {order.guarantor && (
                      <tr className="bg-amber-50">
                        <td colSpan={7} className="px-4 py-2 text-xs text-amber-700">
                          <span className="font-semibold">Guarantor:</span> {order.guarantor.name} — {order.guarantor.phone}
                          {order.guarantor.relation && ` (${order.guarantor.relation})`}
                        </td>
                      </tr>
                    )}
                    {/* Pay Due inline */}
                    {payingOrderId === order.id && (
                      <tr>
                        <td colSpan={7} className="px-4 py-3 bg-red-50">
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              placeholder="Payment amount"
                              value={payAmount}
                              onChange={(e) => setPayAmount(e.target.value)}
                              className="max-w-[200px] h-8 text-sm"
                            />
                            <Button
                              size="sm"
                              className="h-8 bg-green-600 hover:bg-green-700 text-white gap-1"
                              disabled={isSubmitting}
                              onClick={() => handleRecordPayment(order.id)}
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" /> Confirm
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8"
                              onClick={() => setPayingOrderId(null)}
                            >
                              Cancel
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
