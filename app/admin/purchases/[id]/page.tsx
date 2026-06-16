'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Printer, Download, CheckCircle, XCircle, Send, Package, Edit, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getPurchaseOrderById, updatePurchaseOrderStatus } from '@/lib/actions/po-actions';
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

  useEffect(() => {
    async function load() {
      const res = await getPurchaseOrderById(params.id as string);
      if (res.success) setPo(res.data);
      else toast.error('Failed to load Purchase Order');
      setLoading(false);
    }
    load();
  }, [params.id]);

  const handleStatusChange = async (newStatus: 'SUBMITTED' | 'APPROVED' | 'CANCELLED') => {
    if (!confirm(`Are you sure you want to mark this PO as ${newStatus}?`)) return;
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
      <div className="flex items-center justify-between sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b py-3 -mx-6 px-6 shadow-sm">
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
          <Button variant="outline" size="sm">
            <Printer className="mr-2 h-4 w-4" /> Print
          </Button>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" /> PDF
          </Button>

          {po.status === 'DRAFT' && (
            <>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/admin/purchases/edit/${po.id}`}>
                  <Edit className="mr-2 h-4 w-4" /> Edit
                </Link>
              </Button>
              <Button size="sm" onClick={() => handleStatusChange('SUBMITTED')} disabled={actionLoading}>
                <Send className="mr-2 h-4 w-4" /> Submit PO
              </Button>
            </>
          )}

          {po.status === 'SUBMITTED' && (
            <Button size="sm" onClick={() => handleStatusChange('APPROVED')} disabled={actionLoading}>
              <CheckCircle className="mr-2 h-4 w-4" /> Approve PO
            </Button>
          )}

          {po.status === 'APPROVED' && (
            <Button size="sm" asChild>
              <Link href={`/admin/inventory/grn/new?poId=${po.id}`}>
                <Package className="mr-2 h-4 w-4" /> Receive Goods (GRN)
              </Link>
            </Button>
          )}

          {['DRAFT', 'SUBMITTED', 'APPROVED'].includes(po.status) && (
            <Button variant="destructive" size="sm" onClick={() => handleStatusChange('CANCELLED')} disabled={actionLoading}>
              <XCircle className="mr-2 h-4 w-4" /> Cancel
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                {po.discount > 0 && (
                  <div className="flex justify-between text-red-500">
                    <span>Discount</span>
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
    </div>
  );
}
