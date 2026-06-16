// @ts-nocheck
import { getPurchaseReturnById } from '@/lib/actions/purchase-return-actions';
import { notFound } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { FileText, PackageMinus, Store, CreditCard } from 'lucide-react';
import { ReturnStatusActions } from './components/return-status-actions';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default async function PurchaseReturnDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const res = await getPurchaseReturnById(resolvedParams.id);
  
  if (!res.success || !res.data) {
    notFound();
  }

  const pr = res.data;
  const totalValue = pr.items.reduce((sum: number, item: any) => sum + (item.unitCost * item.returnQty), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Return {pr.returnNumber}</h1>
          <p className="text-muted-foreground">Created on {format(new Date(pr.date), 'dd MMM yyyy, hh:mm a')}</p>
        </div>
        <div className="flex gap-2 items-center">
          {pr.status === 'APPROVED' || pr.status === 'RETURNED' || pr.status === 'CLOSED' ? (
            <Button variant="outline" asChild>
              <Link href={`/admin/purchases/returns/${pr.id}/debit-note`}>
                <FileText className="mr-2 h-4 w-4" />
                Debit Note
              </Link>
            </Button>
          ) : null}
          <ReturnStatusActions pr={pr} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PackageMinus className="h-5 w-5" />
              Returned Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Unit Value</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pr.items.map((item: any) => {
                  const lineTotal = item.unitCost * item.returnQty;
                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="font-medium">{item.product.name}</div>
                        {item.variant && <div className="text-sm text-muted-foreground">{item.variant.name}</div>}
                      </TableCell>
                      <TableCell>{item.variant?.sku || item.product.sku}</TableCell>
                      <TableCell className="text-right font-medium">{item.returnQty}</TableCell>
                      <TableCell className="text-right">৳{item.unitCost.toFixed(2)}</TableCell>
                      <TableCell className="text-right">৳{lineTotal.toFixed(2)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            
            <div className="flex justify-end mt-6">
              <div className="w-64 space-y-3 bg-muted/20 p-4 rounded-lg border">
                <div className="flex justify-between font-bold text-lg">
                  <span>Total Refund Value:</span>
                  <span>৳{totalValue.toFixed(2)}</span>
                </div>
                <p className="text-xs text-muted-foreground text-right">Debit note amount to supplier</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5" />
                Return Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Status</div>
                <Badge variant={
                  pr.status === 'RETURNED' || pr.status === 'CLOSED' ? 'default' :
                  pr.status === 'CANCELLED' ? 'destructive' :
                  'outline'
                }>
                  {pr.status}
                </Badge>
              </div>
              
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Supplier</div>
                <div className="font-medium">{pr.supplier.name}</div>
              </div>

              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Reference PO</div>
                <div className="font-medium">{pr.purchaseOrder.poNumber}</div>
              </div>

              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Warehouse</div>
                <div className="font-medium">{pr.warehouse.name}</div>
              </div>
            </CardContent>
          </Card>

          {pr.reason && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Reason for Return
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{pr.reason}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
