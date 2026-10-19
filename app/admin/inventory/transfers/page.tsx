import { getTransfers } from '@/lib/actions/transfer-actions';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

export const dynamic = 'force-dynamic';

export default async function TransfersPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string }> }) {
  const filters = await searchParams;
  const res = await getTransfers({ search: filters.q, status: filters.status });
  if (!res.success) throw new Error(res.error || 'Unable to load transfers.');
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

      <form className="rounded-xl border bg-card p-4 flex flex-wrap gap-3">
        <input name="q" aria-label="Search transfers" defaultValue={filters.q} placeholder="Search transfer number or warehouse…" className="min-w-48 flex-1 rounded-md border bg-background px-3 py-2 text-sm" />
        <select name="status" aria-label="Transfer status" defaultValue={filters.status || ''} className="rounded-md border bg-background px-3 py-2 text-sm"><option value="">All statuses</option><option value="DRAFT">Draft</option><option value="APPROVED">Ready to dispatch</option><option value="IN_TRANSIT">In transit</option><option value="RECEIVED">Received</option><option value="CANCELLED">Cancelled</option></select>
        <Button type="submit">Apply filters</Button><Button variant="outline" asChild><Link href="/admin/inventory/transfers">Reset</Link></Button>
      </form>

      <Card>
        <CardHeader>
          <CardTitle>Transfer History</CardTitle>
          <CardDescription>Up to 200 matching transfers, newest first. Filter by warehouse or status to find a transfer.</CardDescription>
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
                  <TableCell>{t.sourceWarehouse?.name || '—'}</TableCell>
                  <TableCell><ArrowRight className="h-4 w-4 text-muted-foreground" /></TableCell>
                  <TableCell>{t.destWarehouse?.name || t.destinationWarehouse?.name || '—'}</TableCell>
                  <TableCell>{t._count?.items || 0} items</TableCell>
                  <TableCell>
                    <Badge variant={
                      t.status === 'RECEIVED' ? 'default' :
                      t.status === 'IN_TRANSIT' ? 'secondary' :
                      t.status === 'CANCELLED' ? 'destructive' :
                      'outline'
                    }>
                      {t.status === 'APPROVED' ? 'Ready to dispatch' : t.status.replaceAll('_', ' ')}
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
