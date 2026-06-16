import { Metadata } from 'next';
import { Settings2, Search, Filter, Plus, Eye } from "lucide-react";
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getAdjustments } from '@/lib/actions/adjustment-actions';

export const metadata: Metadata = {
  title: 'Stock Adjustments | ERP',
  description: 'Manage inventory corrections and adjustments',
};

function getStatusColor(status: string) {
  switch (status) {
    case 'DRAFT': return 'secondary';
    case 'PENDING_APPROVAL': return 'warning';
    case 'APPROVED': return 'success';
    case 'REJECTED': return 'destructive';
    default: return 'secondary';
  }
}

export default async function AdjustmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; status?: string  }>
}) {
  const query = (await searchParams).q || '';
  const page = Number((await searchParams).page) || 1;
  const statusFilter = (await searchParams).status || '';

  const [stats, result] = await Promise.all([
    prisma.stockAdjustment.aggregate({
      _count: { _all: true },
    }),
    getAdjustments({ page, limit: 15, search: query, status: statusFilter }),
  ]);

  const adjustments = result.success ? result.data?.adjustments || [] : [];

  return (
    <div className="flex flex-col gap-6 p-6 pb-24 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Stock Adjustments</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Record stock corrections for damage, loss, or physical counts.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/inventory/adjustments/new">
            <Plus className="mr-2 h-4 w-4" />
            New Adjustment
          </Link>
        </Button>
      </div>

      <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-muted/20 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <form className="relative flex-1 max-w-md">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              name="q"
              defaultValue={query}
              placeholder="Search ADJ number..."
              className="pl-8 bg-background"
            />
          </form>
          <Button variant="outline" className="shrink-0 bg-background">
            <Filter className="mr-2 h-4 w-4" />
            Filters
          </Button>
        </div>
        
        {adjustments.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Adjustment ID</TableHead>
                  <TableHead>Warehouse</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead className="text-center">Items Affected</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {adjustments.map((adj) => (
                  <TableRow key={adj.id} className="hover:bg-muted/20">
                    <TableCell className="whitespace-nowrap">
                      {new Date(adj.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="font-mono font-medium text-primary">
                      <Link href={`/admin/inventory/adjustments/${adj.id}`}>
                        {adj.adjustmentNumber}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{adj.warehouse.name}</div>
                    </TableCell>
                    <TableCell>
                      {adj.reason}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="font-mono">{adj._count.items}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={getStatusColor(adj.status) as any} className="text-[10px] uppercase">
                        {adj.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/admin/inventory/adjustments/${adj.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Settings2 className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-medium mb-2">No adjustments found</h3>
            <p className="text-sm text-muted-foreground max-w-sm mb-6">
              There are no stock adjustment records in the system yet.
            </p>
            <Button asChild>
              <Link href="/admin/inventory/adjustments/new">
                <Plus className="mr-2 h-4 w-4" />
                Create Adjustment
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
