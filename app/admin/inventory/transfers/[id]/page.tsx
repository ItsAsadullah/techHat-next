import { getTransferById } from '@/lib/actions/transfer-actions';
import { notFound } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ArrowRight, FileText, Package, Truck } from 'lucide-react';
import { TransferStatusActions } from './components/transfer-status-actions';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function TransferDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const res = await getTransferById(resolvedParams.id);
  
  if (!res.success || !res.data) {
    notFound();
  }

  const transfer = res.data;

  return (
    <div className="space-y-6">
      <Link href="/admin/inventory/transfers" className="text-sm text-muted-foreground hover:text-primary print:hidden">← All transfers</Link>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transfer {transfer.transferNumber}</h1>
          <p className="text-muted-foreground">Created on {format(new Date(transfer.createdAt), 'dd MMM yyyy, hh:mm a')}</p>
        </div>
        <TransferStatusActions transfer={transfer} />
      </div>

      <div className="rounded-xl border bg-card p-5 space-y-4">
        <ol className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {['DRAFT', 'APPROVED', 'IN_TRANSIT', 'RECEIVED'].map((status, index) => {
            const complete = transfer.status !== 'CANCELLED' && ['DRAFT', 'APPROVED', 'IN_TRANSIT', 'RECEIVED'].indexOf(transfer.status) >= index;
            return <li key={status} aria-current={transfer.status === status ? 'step' : undefined} className={`rounded-lg p-3 text-sm ${complete ? 'bg-primary/10 text-primary font-semibold' : 'bg-muted/40 text-muted-foreground'}`}><span className="mr-2">{index + 1}.</span>{['Draft', 'Reserved', 'In transit', 'Received'][index]}</li>;
          })}
        </ol>
        <p className="text-sm text-muted-foreground">{transfer.status === 'CANCELLED' ? 'This transfer was cancelled. No stock was moved.' : transfer.status === 'IN_TRANSIT' ? 'Goods are on the way. Confirm receipt only after checking every quantity at the destination. Resolve any shortage before confirming full receipt.' : transfer.status === 'RECEIVED' ? 'The transfer is complete. Both warehouse movements are recorded in the stock ledger.' : transfer.status === 'APPROVED' ? 'Stock is reserved at the source. Dispatch when the goods physically leave the warehouse.' : 'Review the route and quantities, then approve to reserve stock.'}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Transfer Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Unit Value (MAC)</TableHead>
                  <TableHead className="text-right">Total Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transfer.items.map((item: any) => {
                  const unitCost = item.unitCost;
                  const totalValue = unitCost * item.quantity;
                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="font-medium">{item.product.name}</div>
                        {item.variant && <div className="text-sm text-muted-foreground">{item.variant.name}</div>}
                      </TableCell>
                      <TableCell>{item.variant?.sku || item.product.sku}</TableCell>
                      <TableCell className="text-right font-medium">{item.quantity}</TableCell>
                      <TableCell className="text-right">৳{unitCost.toFixed(2)}</TableCell>
                      <TableCell className="text-right">৳{totalValue.toFixed(2)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Routing Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Status</div>
                <Badge variant={
                  transfer.status === 'RECEIVED' ? 'default' :
                  transfer.status === 'IN_TRANSIT' ? 'secondary' :
                  transfer.status === 'CANCELLED' ? 'destructive' :
                  'outline'
                }>
                  {transfer.status}
                </Badge>
              </div>

              <div className="relative pl-6 border-l-2 border-muted space-y-6 pb-2">
                <div className="relative">
                  <div className="absolute -left-[31px] top-1 bg-background border-2 border-primary w-4 h-4 rounded-full"></div>
                  <div className="text-sm font-medium text-muted-foreground">Source</div>
                  <div className="font-medium">{transfer.sourceWarehouse.name}</div>
                  <div className="text-xs text-muted-foreground">{transfer.sourceWarehouse.code}</div>
                </div>
                
                <div className="relative">
                  <div className="absolute -left-[31px] top-1 bg-background border-2 border-emerald-500 w-4 h-4 rounded-full"></div>
                  <div className="text-sm font-medium text-muted-foreground">Destination</div>
                  <div className="font-medium">{transfer.destWarehouse.name}</div>
                  <div className="text-xs text-muted-foreground">{transfer.destWarehouse.code}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {transfer.note && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{transfer.note}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
