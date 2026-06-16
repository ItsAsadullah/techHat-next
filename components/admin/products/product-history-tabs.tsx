'use client';

import { format } from 'date-fns';
import { Package, Truck, Receipt } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

interface PurchaseHistoryProps {
  poItems: any[];
}

export function ProductPurchaseHistory({ poItems }: PurchaseHistoryProps) {
  if (!poItems || poItems.length === 0) {
    return (
      <div className="py-12 text-center border rounded-lg bg-card mt-4">
        <Receipt className="mx-auto h-8 w-8 text-muted-foreground/50 mb-3" />
        <h3 className="text-sm font-semibold text-foreground">No Purchase History</h3>
        <p className="text-xs text-muted-foreground mt-1">This product has not been included in any purchase orders yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-card border rounded-lg overflow-hidden mt-4">
      <div className="px-5 py-3 border-b bg-muted/20">
        <h3 className="text-sm font-semibold">Purchase Orders</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-muted-foreground bg-muted/50 uppercase">
            <tr>
              <th className="px-4 py-3 font-medium whitespace-nowrap">Date</th>
              <th className="px-4 py-3 font-medium">PO Number</th>
              <th className="px-4 py-3 font-medium">Supplier</th>
              <th className="px-4 py-3 font-medium">Variant</th>
              <th className="px-4 py-3 font-medium text-right">Qty</th>
              <th className="px-4 py-3 font-medium text-right">Received</th>
              <th className="px-4 py-3 font-medium text-right">Unit Cost</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {poItems.map((item) => (
              <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 whitespace-nowrap text-xs">
                  {format(new Date(item.purchaseOrder.orderDate), 'dd MMM yyyy')}
                </td>
                <td className="px-4 py-3">
                  <Link href={`/admin/purchases/${item.purchaseOrder.id}`} className="font-medium text-primary hover:underline">
                    {item.purchaseOrder.poNumber}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  {item.purchaseOrder.supplier?.name || '—'}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {item.variant?.name || '—'}
                </td>
                <td className="px-4 py-3 text-right font-mono">
                  {item.quantity}
                </td>
                <td className="px-4 py-3 text-right font-mono">
                  <span className={item.receivedQty >= item.quantity ? 'text-emerald-600' : item.receivedQty > 0 ? 'text-yellow-600' : 'text-muted-foreground'}>
                    {item.receivedQty}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-mono">
                  ৳{item.unitCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
                <td className="px-4 py-3">
                  <Badge variant="outline" className="text-[10px] font-semibold tracking-wider uppercase">
                    {item.purchaseOrder.status}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface GRNHistoryProps {
  grnItems: any[];
}

export function ProductGRNHistory({ grnItems }: GRNHistoryProps) {
  if (!grnItems || grnItems.length === 0) {
    return (
      <div className="py-12 text-center border rounded-lg bg-card mt-4">
        <Truck className="mx-auto h-8 w-8 text-muted-foreground/50 mb-3" />
        <h3 className="text-sm font-semibold text-foreground">No Receipt History</h3>
        <p className="text-xs text-muted-foreground mt-1">This product has not been received via any GRN yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-card border rounded-lg overflow-hidden mt-4">
      <div className="px-5 py-3 border-b bg-muted/20">
        <h3 className="text-sm font-semibold">Goods Receive Notes (GRN)</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-muted-foreground bg-muted/50 uppercase">
            <tr>
              <th className="px-4 py-3 font-medium whitespace-nowrap">Date</th>
              <th className="px-4 py-3 font-medium">GRN Number</th>
              <th className="px-4 py-3 font-medium">Warehouse</th>
              <th className="px-4 py-3 font-medium">Variant</th>
              <th className="px-4 py-3 font-medium text-right">Accepted Qty</th>
              <th className="px-4 py-3 font-medium text-right">Rejected Qty</th>
              <th className="px-4 py-3 font-medium text-right">Unit Cost</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {grnItems.map((item) => (
              <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 whitespace-nowrap text-xs">
                  {format(new Date(item.goodsReceiveNote.receivedDate), 'dd MMM yyyy')}
                </td>
                <td className="px-4 py-3 font-medium text-foreground">
                  {item.goodsReceiveNote.grnNumber}
                </td>
                <td className="px-4 py-3">
                  {item.goodsReceiveNote.warehouse?.name || '—'}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {item.variant?.name || '—'}
                </td>
                <td className="px-4 py-3 text-right font-mono text-emerald-600 font-medium">
                  +{item.acceptedQty}
                </td>
                <td className="px-4 py-3 text-right font-mono text-rose-500">
                  {item.rejectedQty > 0 ? item.rejectedQty : '-'}
                </td>
                <td className="px-4 py-3 text-right font-mono">
                  ৳{item.unitCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={item.goodsReceiveNote.status === 'RECEIVED' ? 'default' : 'secondary'} className="text-[10px] uppercase">
                    {item.goodsReceiveNote.status}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
