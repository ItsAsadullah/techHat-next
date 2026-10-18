'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Printer, Lock, CheckCircle, PackageSearch, Loader2 } from 'lucide-react';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { getGRNById, submitGRN } from '@/lib/actions/grn-actions';
import { getPOSConfig } from '@/lib/actions/settings-actions';
import { useConfirm } from '@/components/providers/confirm-provider';
import { printGRNLabels } from '../components/print-grn-labels';

export default function GRNDetailsPage() {
  const params = useParams();
  const router = useRouter();
  type GRNItem = { id: string; productId: string; product: { name: string; sku: string; category?: { name: string }; model?: string; costPrice?: number }; variant?: { name: string; sku: string } | null; receivedQty: number; rejectedQty: number; acceptedQty: number; unitCost?: number; serialNumber?: string; imei?: string; batchNumber?: string };
  type POSConfig = { pos_label_width?: string; pos_label_height?: string; pos_logo?: string } | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [grn, setGrn] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const confirm = useConfirm();
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [posConfig, setPosConfig] = useState<POSConfig>(null);

  const handlePrintLabels = () => {
    if (!grn) return;
    printGRNLabels({ grn, posConfig, origin: window.location.origin });
  };

  useEffect(() => {
    async function load() {
      const res = await getGRNById(params.id as string);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (res.success) setGrn((res as any).data);
      else toast.error('Failed to load GRN');

      const config = await getPOSConfig();
      setPosConfig(config);

      setLoading(false);
    }
    load();
  }, [params.id]);

  const handleSubmitGRN = async () => {
    if (!(await confirm('Are you sure you want to Submit this GRN? This will IMMUTABLY update the Stock Ledger and product stock quantities. This action cannot be undone.'))) return;

    setActionLoading(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await submitGRN((grn as any).id);
    setActionLoading(false);

    if (res.success) {
      toast.success('Goods Receive Note Submitted & Locked successfully!');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setGrn((prev: any) => prev ? { ...prev, status: 'SUBMITTED' } : prev);
      
      setTimeout(() => {
        setShowPrintModal(true);
        router.refresh();
      }, 300);
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      toast.error((res as any).error || 'Failed to submit GRN');
    }
  };

  if (loading) {
    return <div className="flex h-[400px] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  if (!grn) {
    return <div className="p-12 text-center text-muted-foreground">GRN not found.</div>;
  }



  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'secondary';
      case 'SUBMITTED': return 'success';
      case 'CANCELLED': return 'destructive';
      default: return 'secondary';
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6 pb-24 max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b py-3 -mx-6 px-6 shadow-sm">
        <div className="flex items-center gap-3">
          <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => router.push('/admin/inventory/grn')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold font-mono">{grn.grnNumber}</h1>
              <Badge variant={getStatusColor(grn.status) as 'secondary' | 'destructive' | 'default' | 'outline'} className="text-[10px] uppercase">
                {grn.status === 'SUBMITTED' ? <><Lock className="mr-1 h-3 w-3" /> LOCKED</> : grn.status}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">Received on {new Date(grn.receivedDate).toLocaleString()}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePrintLabels}>
            <Printer className="mr-2 h-4 w-4" /> Print Labels
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" /> Print GRN
          </Button>

          {grn.status === 'DRAFT' && (
            <Button size="sm" onClick={handleSubmitGRN} disabled={actionLoading} className="bg-green-600 hover:bg-green-700">
              {actionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
              Submit & Lock Ledger
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Details */}
        <div className="md:col-span-2 space-y-6">
          <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
            <div className="p-4 border-b bg-muted/20">
              <h3 className="font-semibold text-sm">Received Items</h3>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead className="text-center">Received</TableHead>
                  <TableHead className="text-center">Rejected</TableHead>
                  <TableHead className="text-center bg-green-500/5 text-green-700">Accepted</TableHead>
                  <TableHead>Identifications</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {grn.items.map((item: GRNItem) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="font-medium text-sm"><Link href={`/admin/products/${item.productId}`} className="hover:underline text-primary">{item.product.name}</Link></div>
                      {item.variant && <div className="text-xs text-muted-foreground">{item.variant.name}</div>}
                      <div className="text-[10px] font-mono text-muted-foreground">{item.variant?.sku || item.product.sku}</div>
                    </TableCell>
                    <TableCell className="text-center font-mono">{item.receivedQty}</TableCell>
                    <TableCell className="text-center font-mono text-red-500">{item.rejectedQty > 0 ? item.rejectedQty : '-'}</TableCell>
                    <TableCell className="text-center font-bold font-mono text-green-700 bg-green-500/5">{item.acceptedQty}</TableCell>
                    <TableCell>
                      {item.serialNumber && <div className="text-xs"><span className="text-muted-foreground">SN:</span> <span className="font-mono">{item.serialNumber}</span></div>}
                      {item.imei && <div className="text-xs"><span className="text-muted-foreground">IMEI:</span> <span className="font-mono">{item.imei}</span></div>}
                      {item.batchNumber && <div className="text-xs"><span className="text-muted-foreground">Batch:</span> <span className="font-mono">{item.batchNumber}</span></div>}
                      {!item.serialNumber && !item.imei && !item.batchNumber && <span className="text-muted-foreground text-xs">-</span>}
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
            <h3 className="font-semibold text-sm border-b pb-2">Reference Details</h3>
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-muted-foreground block text-xs">Purchase Order</span>
                <span className="font-mono font-medium"><Link href={`/admin/purchases/${grn.purchaseOrderId}`} className="text-primary hover:underline">{grn.purchaseOrder.poNumber}</Link></span>
              </div>
              <div>
                <span className="text-muted-foreground block text-xs">Supplier</span>
                <span className="font-medium"><Link href={`/admin/suppliers/${grn.supplierId}`} className="text-primary hover:underline">{grn.supplier.name}</Link></span>
              </div>
              <div>
                <span className="text-muted-foreground block text-xs">Receiving Warehouse</span>
                <span className="font-medium">{grn.warehouse?.name}</span>
              </div>
            </div>
          </div>

          {grn.note && (
            <div className="rounded-xl border bg-card p-5 shadow-sm space-y-2">
              <h3 className="font-semibold text-sm border-b pb-2">Receipt Notes</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{grn.note}</p>
            </div>
          )}
        </div>
      </div>

      {/* Print Confirmation Modal */}
      <AlertDialog open={showPrintModal} onOpenChange={setShowPrintModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>GRN Locked Successfully!</AlertDialogTitle>
            <AlertDialogDescription>
              The Goods Receive Note has been verified and locked into the ledger. Would you like to print barcode labels for these received items now?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowPrintModal(false)}>Maybe Later</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                setShowPrintModal(false);
                setTimeout(() => {
                  handlePrintLabels();
                }, 100);
              }}
              className="bg-green-600 hover:bg-green-700"
            >
              <Printer className="mr-2 h-4 w-4" /> Proceed to Print
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
