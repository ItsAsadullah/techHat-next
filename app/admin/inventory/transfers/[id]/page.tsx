import { getTransferById } from '@/lib/actions/transfer-actions';
import { notFound } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ArrowRight, FileText, Package, Truck } from 'lucide-react';
import { TransferStatusActions } from './components/transfer-status-actions';

export default async function TransferDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const res = await getTransferById(resolvedParams.id);
  
  if (!res.success || !res.data) {
    notFound();
  }

  const transfer = res.data;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transfer {transfer.transferNumber}</h1>
          <p className="text-muted-foreground">Created on {format(new Date(transfer.date), 'dd MMM yyyy, hh:mm a')}</p>
        </div>
        <TransferStatusActions transfer={transfer} />
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
                  const unitCost = item.variant?.costPrice || item.product.costPrice || 0;
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
                  <div className="font-medium">{transfer.destinationWarehouse.name}</div>
                  <div className="text-xs text-muted-foreground">{transfer.destinationWarehouse.code}</div>
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
