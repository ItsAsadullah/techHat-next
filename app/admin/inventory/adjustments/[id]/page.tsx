// @ts-nocheck
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Printer, Lock, CheckCircle, Settings2, Loader2, FileText } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getAdjustmentById, approveAdjustment } from '@/lib/actions/adjustment-actions';

export default function AdjustmentDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [adj, setAdj] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    async function load() {
      const res = await getAdjustmentById(params.id as string);
      if (res.success) setAdj(res.data);
      else toast.error('Failed to load Adjustment');
      setLoading(false);
    }
    load();
  }, [params.id]);

  const handleApprove = async () => {
    if (!confirm('Are you sure you want to Approve this Adjustment? This will IMMUTABLY update the Stock Ledger. This action cannot be undone.')) return;
    
    setActionLoading(true);
    const res = await approveAdjustment(adj.id);
    if (res.success) {
      toast.success('Stock Adjustment Approved & Ledger Updated!');
      setAdj({ ...adj, status: 'APPROVED' });
      router.refresh();
    } else {
      toast.error(res.error || 'Failed to approve adjustment');
    }
    setActionLoading(false);
  };

  if (loading) {
    return <div className="flex h-[400px] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  if (!adj) {
    return <div className="p-12 text-center text-muted-foreground">Adjustment not found.</div>;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'secondary';
      case 'PENDING_APPROVAL': return 'warning';
      case 'APPROVED': return 'success';
      case 'REJECTED': return 'destructive';
      default: return 'secondary';
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6 pb-24 max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b py-3 -mx-6 px-6 shadow-sm">
        <div className="flex items-center gap-3">
          <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => router.push('/admin/inventory/adjustments')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold font-mono">{adj.adjustmentNumber}</h1>
              <Badge variant={getStatusColor(adj.status) as any} className="text-[10px] uppercase">
                {adj.status === 'APPROVED' ? <><Lock className="mr-1 h-3 w-3" /> LOCKED (APPROVED)</> : adj.status}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">Drafted on {new Date(adj.date).toLocaleString()}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Printer className="mr-2 h-4 w-4" /> Print
          </Button>

          {adj.status === 'DRAFT' && (
            <Button size="sm" onClick={handleApprove} disabled={actionLoading} className="bg-green-600 hover:bg-green-700">
              {actionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
              Approve & Update Ledger
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Details */}
        <div className="md:col-span-2 space-y-6">
          <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
            <div className="p-4 border-b bg-muted/20">
              <h3 className="font-semibold text-sm">Adjusted Items</h3>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead className="text-center">System Qty</TableHead>
                  <TableHead className="text-center">Actual Qty</TableHead>
                  <TableHead className="text-center">Variance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {adj.items.map((item: any) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="font-medium text-sm"><Link href={`/admin/products/${item.productId}`} className="hover:underline text-primary">{item.product.name}</Link></div>
                      {item.variant && <div className="text-xs text-muted-foreground">{item.variant.name}</div>}
                      <div className="text-[10px] font-mono text-muted-foreground">{item.variant?.sku || item.product.sku}</div>
                    </TableCell>
                    <TableCell className="text-center font-mono text-muted-foreground">{item.systemQty}</TableCell>
                    <TableCell className="text-center font-mono font-medium">{item.actualQty}</TableCell>
                    <TableCell className={`text-center font-bold font-mono ${item.adjustedQty > 0 ? 'text-green-600' : item.adjustedQty < 0 ? 'text-red-600' : 'text-muted-foreground'}`}>
                      {item.adjustedQty > 0 ? `+${item.adjustedQty}` : item.adjustedQty}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="rounded-xl border bg-card p-5 shadow-sm space-y-4">
            <h3 className="font-semibold text-sm border-b pb-2">Record Details</h3>
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-muted-foreground block text-xs">Warehouse</span>
                <span className="font-medium">{adj.warehouse?.name}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-xs">Reason</span>
                <span className="font-medium">{adj.reason}</span>
              </div>
            </div>
          </div>

          {adj.note && (
            <div className="rounded-xl border bg-card p-5 shadow-sm space-y-2">
              <h3 className="font-semibold text-sm border-b pb-2">Notes</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{adj.note}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
