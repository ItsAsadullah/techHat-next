'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Printer, Download, CheckCircle, XCircle, Send, Package, Edit, Loader2, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getPurchaseOrderById, updatePurchaseOrderStatus } from '@/lib/actions/po-actions';
import { useConfirm } from '@/components/providers/confirm-provider';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function PurchaseOrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [po, setPo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const confirm = useConfirm();

  useEffect(() => {
    async function load() {
      const res = await getPurchaseOrderById(params.id as string);
      if (res.success) setPo(res.data);
      else toast.error('Failed to load Purchase Order');
      setLoading(false);
    }
    load();
  }, [params.id]);

  const handleStatusChange = async (newStatus: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'CANCELLED') => {
    const isConfirmed = await confirm(`Are you sure you want to mark this PO as ${newStatus}?`);
    if (!isConfirmed) return;
    setActionLoading(true);
    const res = await updatePurchaseOrderStatus(po.id, newStatus);
    if (res.success) {
      toast.success(`Purchase Order marked as ${newStatus}`);
      setPo({ ...po, status: newStatus });
      router.refresh();
    } else {
      toast.error(res.error || 'Failed to update status');
    }
    setActionLoading(false);
  };

  if (loading) {
    return <div className="flex h-[400px] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  if (!po) {
    return <div className="p-12 text-center text-muted-foreground">Purchase Order not found.</div>;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'secondary';
      case 'SUBMITTED': return 'default';
      case 'APPROVED': return 'default';
      case 'PARTIALLY_RECEIVED': return 'warning';
      case 'RECEIVED': return 'success';
      case 'CLOSED': return 'success';
      case 'CANCELLED': return 'destructive';
      default: return 'secondary';
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6 pb-24 max-w-[1200px] mx-auto">
      {/* Header Actions */}
      <div className="flex items-center justify-between sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b py-3 -mx-6 px-6 shadow-sm print:hidden">
        <div className="flex items-center gap-3">
          <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => router.push('/admin/purchases')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold font-mono">{po.poNumber}</h1>
              <Badge variant={getStatusColor(po.status) as any} className="text-[10px] uppercase">
                {po.status.replace('_', ' ')}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">Created on {new Date(po.createdAt).toLocaleString()}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" /> Print
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Download className="mr-2 h-4 w-4" /> PDF
          </Button>

          {['DRAFT', 'SUBMITTED'].includes(po.status) && (
            <Button variant="outline" size="sm" asChild className="print:hidden">
              <Link href={`/admin/purchases/edit/${po.id}`}>
                <Edit className="mr-2 h-4 w-4" /> Edit
              </Link>
            </Button>
          )}

          {po.status === 'DRAFT' && (
            <Button size="sm" onClick={() => handleStatusChange('SUBMITTED')} disabled={actionLoading} className="print:hidden">
              <Send className="mr-2 h-4 w-4" /> Submit PO
            </Button>
          )}

          {['SUBMITTED', 'APPROVED'].includes(po.status) && (
            <Button variant="secondary" size="sm" onClick={() => handleStatusChange('DRAFT')} disabled={actionLoading} className="print:hidden">
              <RotateCcw className="mr-2 h-4 w-4" /> Revert to Draft
            </Button>
          )}

          {po.status === 'SUBMITTED' && (
            <Button size="sm" onClick={() => handleStatusChange('APPROVED')} disabled={actionLoading} className="print:hidden">
              <CheckCircle className="mr-2 h-4 w-4" /> Approve PO
            </Button>
          )}

          {po.status === 'APPROVED' && (
            <Button size="sm" asChild className="print:hidden">
              <Link href={`/admin/inventory/grn/new?poId=${po.id}`}>
                <Package className="mr-2 h-4 w-4" /> Receive Goods (GRN)
              </Link>
            </Button>
          )}

          {['DRAFT', 'SUBMITTED', 'APPROVED'].includes(po.status) && (
            <Button variant="destructive" size="sm" onClick={() => handleStatusChange('CANCELLED')} disabled={actionLoading} className="print:hidden">
              <XCircle className="mr-2 h-4 w-4" /> Cancel
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 print:hidden">
        {/* Main Details */}
        <div className="md:col-span-2 space-y-6">
          <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
            <div className="p-4 border-b bg-muted/20">
              <h3 className="font-semibold text-sm">Purchase Items</h3>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead className="text-center">Qty</TableHead>
                  <TableHead className="text-right">Unit Cost (৳)</TableHead>
                  <TableHead className="text-right">Total (৳)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {po.items.map((item: any) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="font-medium text-sm">{item.product.name}</div>
                      {item.variant && <div className="text-xs text-muted-foreground">{item.variant.name}</div>}
                      <div className="text-[10px] font-mono text-muted-foreground">{item.variant?.sku || item.product.sku}</div>
                    </TableCell>
                    <TableCell className="text-center font-mono">
                      {item.quantity}
                      {item.receivedQty > 0 && (
                        <div className="text-[10px] text-green-600 font-semibold">{item.receivedQty} Received</div>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {item.unitCost}
                      {(item.discount > 0 || item.tax > 0) && (
                        <div className="text-[10px] text-muted-foreground mt-0.5">
                          {item.discount > 0 && `-${item.discount} D`} {item.tax > 0 && `+${item.tax} T`}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono font-medium">{item.subtotal}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="p-4 border-t bg-muted/10 flex justify-end">
              <div className="w-[250px] space-y-2 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span className="font-mono">৳{po.totalAmount}</span>
                </div>
                {po.items.reduce((acc: number, item: any) => acc + (item.discount || 0), 0) > 0 && (
                  <div className="flex justify-between text-red-500">
                    <span>Item Discounts</span>
                    <span className="font-mono">-৳{po.items.reduce((acc: number, item: any) => acc + (item.discount || 0), 0)}</span>
                  </div>
                )}
                {po.discount > 0 && (
                  <div className="flex justify-between text-red-500">
                    <span>Global Discount</span>
                    <span className="font-mono">-৳{po.discount}</span>
                  </div>
                )}
                {po.tax > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Tax</span>
                    <span className="font-mono">+৳{po.tax}</span>
                  </div>
                )}
                {po.shippingCost > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Shipping</span>
                    <span className="font-mono">+৳{po.shippingCost}</span>
                  </div>
                )}
                {po.otherCost > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Other Costs</span>
                    <span className="font-mono">+৳{po.otherCost}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                  <span>Grand Total</span>
                  <span className="font-mono text-primary">৳{po.grandTotal}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="rounded-xl border bg-card p-5 shadow-sm space-y-4">
            <h3 className="font-semibold text-sm border-b pb-2">Supplier Details</h3>
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-muted-foreground block text-xs">Supplier Name</span>
                <span className="font-medium"><Link href={`/admin/suppliers/${po.supplierId}`} className="text-primary hover:underline">{po.supplier.name}</Link></span>
              </div>
              {po.supplier.companyName && (
                <div>
                  <span className="text-muted-foreground block text-xs">Company</span>
                  <span className="font-medium">{po.supplier.companyName}</span>
                </div>
              )}
              <div>
                <span className="text-muted-foreground block text-xs">Contact</span>
                <span className="font-medium">{po.supplier.phone}</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border bg-card p-5 shadow-sm space-y-4">
            <h3 className="font-semibold text-sm border-b pb-2">Delivery Details</h3>
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-muted-foreground block text-xs">Expected Delivery</span>
                <span className="font-medium">{po.expectedDeliveryDate ? new Date(po.expectedDeliveryDate).toLocaleDateString() : 'Not set'}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-xs">Target Warehouse</span>
                <span className="font-medium">{po.warehouse?.name || 'Main Warehouse'}</span>
              </div>
            </div>
          </div>

          {po.note && (
            <div className="rounded-xl border bg-card p-5 shadow-sm space-y-2">
              <h3 className="font-semibold text-sm border-b pb-2">Notes</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{po.note}</p>
            </div>
          )}
        </div>
      </div>

      {/* Printable Area - Hidden on Screen, Visible on Print */}
      <div className="hidden print:block font-sans text-black">
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            @page { size: A4; margin: 15mm; }
            body { margin: 0; padding: 0; background: white; }
            .print\\:hidden { display: none !important; }
            .print\\:block { display: block !important; }
          }
        `}} />
        
        <div className="flex justify-between items-start border-b-2 border-gray-900 pb-6 mb-8">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-wider text-gray-900 mb-1">Purchase Order</h1>
            <p className="text-gray-500 font-medium">TechHat ERP</p>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-bold">{po.poNumber}</h2>
            <div className="text-sm text-gray-600 mt-1">
              <p>Date: {new Date(po.createdAt).toLocaleDateString()}</p>
              <p>Status: {po.status.replace('_', ' ')}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-12 mb-8">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 border-b border-gray-300 pb-1 mb-3">Supplier Details</h3>
            <p className="font-bold text-lg">{po.supplier.name}</p>
            {po.supplier.companyName && <p className="text-gray-700">{po.supplier.companyName}</p>}
            <p className="text-gray-700">{po.supplier.phone}</p>
            {po.supplier.email && <p className="text-gray-700">{po.supplier.email}</p>}
            {po.supplier.address && <p className="text-gray-700 mt-1">{po.supplier.address}</p>}
          </div>
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 border-b border-gray-300 pb-1 mb-3">Shipping Details</h3>
            <p className="font-bold text-lg">TechHat Warehouse</p>
            <p className="text-gray-700">{po.warehouse?.name || 'Main Warehouse'}</p>
            <p className="text-gray-700 mt-2"><span className="font-semibold">Expected Delivery:</span> {po.expectedDeliveryDate ? new Date(po.expectedDeliveryDate).toLocaleDateString() : 'N/A'}</p>
          </div>
        </div>

        <div className="mb-8 border border-gray-300 rounded-lg overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-100 text-gray-800">
              <tr>
                <th className="py-3 px-4 font-bold text-sm border-b border-gray-300">#</th>
                <th className="py-3 px-4 font-bold text-sm border-b border-gray-300">Item Description</th>
                <th className="py-3 px-4 font-bold text-sm text-center border-b border-gray-300">Qty</th>
                <th className="py-3 px-4 font-bold text-sm text-right border-b border-gray-300">Unit Price</th>
                <th className="py-3 px-4 font-bold text-sm text-right border-b border-gray-300">Discount</th>
                <th className="py-3 px-4 font-bold text-sm text-right border-b border-gray-300">Line Total</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {po.items.map((item: any, idx: number) => (
                <tr key={item.id} className="border-b border-gray-200 last:border-0">
                  <td className="py-3 px-4 text-gray-600">{idx + 1}</td>
                  <td className="py-3 px-4">
                    <p className="font-semibold text-gray-900">{item.product.name}</p>
                    {item.variant && <p className="text-gray-600 text-xs mt-0.5">{item.variant.name}</p>}
                    <p className="text-gray-400 text-[10px] font-mono mt-0.5">SKU: {item.variant?.sku || item.product.sku}</p>
                  </td>
                  <td className="py-3 px-4 text-center font-mono">{item.quantity}</td>
                  <td className="py-3 px-4 text-right font-mono">৳{item.unitCost}</td>
                  <td className="py-3 px-4 text-right font-mono text-red-600">{item.discount > 0 ? `-৳${item.discount}` : '-'}</td>
                  <td className="py-3 px-4 text-right font-mono font-bold">৳{item.subtotal}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end mb-12">
          <div className="w-[300px]">
            <table className="w-full text-sm">
              <tbody>
                <tr>
                  <td className="py-1.5 text-gray-600 font-medium">Subtotal</td>
                  <td className="py-1.5 text-right font-mono">৳{po.totalAmount}</td>
                </tr>
                {po.items.reduce((acc: number, item: any) => acc + (item.discount || 0), 0) > 0 && (
                  <tr>
                    <td className="py-1.5 text-gray-600 font-medium">Item Discounts</td>
                    <td className="py-1.5 text-right font-mono text-red-600">-৳{po.items.reduce((acc: number, item: any) => acc + (item.discount || 0), 0)}</td>
                  </tr>
                )}
                {po.discount > 0 && (
                  <tr>
                    <td className="py-1.5 text-gray-600 font-medium">Global Discount</td>
                    <td className="py-1.5 text-right font-mono text-red-600">-৳{po.discount}</td>
                  </tr>
                )}
                {po.tax > 0 && (
                  <tr>
                    <td className="py-1.5 text-gray-600 font-medium">Tax</td>
                    <td className="py-1.5 text-right font-mono">+৳{po.tax}</td>
                  </tr>
                )}
                {po.shippingCost > 0 && (
                  <tr>
                    <td className="py-1.5 text-gray-600 font-medium">Shipping</td>
                    <td className="py-1.5 text-right font-mono">+৳{po.shippingCost}</td>
                  </tr>
                )}
                {po.otherCost > 0 && (
                  <tr>
                    <td className="py-1.5 text-gray-600 font-medium">Other Costs</td>
                    <td className="py-1.5 text-right font-mono">+৳{po.otherCost}</td>
                  </tr>
                )}
                <tr className="border-t-2 border-gray-900">
                  <td className="py-3 font-bold text-base">Grand Total</td>
                  <td className="py-3 text-right font-mono font-bold text-lg">৳{po.grandTotal}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {po.note && (
          <div className="mb-16">
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 border-b border-gray-300 pb-1 mb-3">Notes & Terms</h3>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{po.note}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-24 mt-24">
          <div className="border-t border-gray-400 pt-2 text-center">
            <p className="font-bold text-sm">Authorized Signature</p>
            <p className="text-xs text-gray-500 mt-1">TechHat Management</p>
          </div>
          <div className="border-t border-gray-400 pt-2 text-center">
            <p className="font-bold text-sm">Supplier Signature</p>
            <p className="text-xs text-gray-500 mt-1">Acceptance of Order</p>
          </div>
        </div>

        <div className="mt-12 text-center text-[10px] text-gray-400 border-t border-gray-200 pt-4">
          This is a computer-generated document. No signature is required for digital transmission.
        </div>
      </div>
    </div>
  );
}
