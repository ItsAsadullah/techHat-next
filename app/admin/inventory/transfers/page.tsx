import { getTransfers } from '@/lib/actions/transfer-actions';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

export default async function TransfersPage() {
  const res = await getTransfers();
  const transfers = res.success ? res.data : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Warehouse Transfers</h1>
          <p className="text-muted-foreground">Manage inventory transfers between warehouses</p>
        </div>
        <Link href="/admin/inventory/transfers/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Transfer
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transfer History</CardTitle>
          <CardDescription>A list of all recent and pending warehouse transfers.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transfer No</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Source</TableHead>
                <TableHead></TableHead>
                <TableHead>Destination</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transfers?.map((t: any) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.transferNumber}</TableCell>
                  <TableCell>{format(new Date(t.date), 'dd MMM yyyy')}</TableCell>
                  <TableCell>{t.sourceWarehouse.name}</TableCell>
                  <TableCell><ArrowRight className="h-4 w-4 text-muted-foreground" /></TableCell>
                  <TableCell>{t.destinationWarehouse.name}</TableCell>
                  <TableCell>{t._count?.items || 0} items</TableCell>
                  <TableCell>
                    <Badge variant={
                      t.status === 'RECEIVED' ? 'default' :
                      t.status === 'IN_TRANSIT' ? 'secondary' :
                      t.status === 'CANCELLED' ? 'destructive' :
                      'outline'
                    }>
                      {t.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/admin/inventory/transfers/${t.id}`}>
                      <Button variant="ghost" size="sm">View</Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
              {!transfers?.length && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-6 text-muted-foreground">
                    No transfers found
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
