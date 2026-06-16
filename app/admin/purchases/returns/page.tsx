import { getPurchaseReturns } from '@/lib/actions/purchase-return-actions';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

export default async function PurchaseReturnsPage() {
  const res = await getPurchaseReturns();
  const returns = res.success ? res.data : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Purchase Returns</h1>
          <p className="text-muted-foreground">Manage products returned to suppliers (Debit Notes)</p>
        </div>
        <Link href="/admin/purchases/returns/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Return
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Return History</CardTitle>
          <CardDescription>A list of all supplier returns.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Return No</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Reference PO</TableHead>
                <TableHead>Warehouse</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {returns?.map((r: any) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.returnNumber}</TableCell>
                  <TableCell>{format(new Date(r.date), 'dd MMM yyyy')}</TableCell>
                  <TableCell>{r.supplier.name}</TableCell>
                  <TableCell>{r.purchaseOrder.poNumber}</TableCell>
                  <TableCell>{r.warehouse.name}</TableCell>
                  <TableCell>{r._count?.items || 0}</TableCell>
                  <TableCell>
                    <Badge variant={
                      r.status === 'RETURNED' || r.status === 'CLOSED' ? 'default' :
                      r.status === 'CANCELLED' ? 'destructive' :
                      'outline'
                    }>
                      {r.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/admin/purchases/returns/${r.id}`}>
                      <Button variant="ghost" size="sm">View</Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
              {!returns?.length && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-6 text-muted-foreground">
                    No returns found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
