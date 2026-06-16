import { Metadata } from 'next';
import { PackageCheck, Search, Filter, Plus, Eye, CheckCircle2 } from "lucide-react";
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
import { getGRNs } from '@/lib/actions/grn-actions';

export const metadata: Metadata = {
  title: 'Goods Receive Notes | ERP',
  description: 'Manage warehouse receipts',
};

function getStatusColor(status: string) {
  switch (status) {
    case 'DRAFT': return 'secondary';
    case 'SUBMITTED': return 'success';
    case 'CANCELLED': return 'destructive';
    default: return 'secondary';
  }
}

export default async function GRNPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; status?: string  }>
}) {
  const query = (await searchParams).q || '';
  const page = Number((await searchParams).page) || 1;
  const statusFilter = (await searchParams).status || '';

  const [stats, result] = await Promise.all([
    prisma.goodsReceiveNote.aggregate({
      _count: { _all: true },
    }),
    getGRNs({ page, limit: 15, search: query, status: statusFilter }),
  ]);

  const grns = result.success ? result.data?.grns || [] : [];
  const totalCount = result.success ? result.data?.totalCount || 0 : 0;

  return (
    <div className="flex flex-col gap-6 p-6 pb-24 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Goods Receive Notes</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Receive inventory against Purchase Orders into your warehouses.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/inventory/grn/new">
            <Plus className="mr-2 h-4 w-4" />
            New Receipt (GRN)
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
              placeholder="Search GRN number..."
              className="pl-8 bg-background"
            />
          </form>
          <Button variant="outline" className="shrink-0 bg-background">
            <Filter className="mr-2 h-4 w-4" />
            Filters
          </Button>
        </div>
        
        {grns.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>GRN Number</TableHead>
                  <TableHead>Purchase Order</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Warehouse</TableHead>
                  <TableHead className="text-center">Items Received</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {grns.map((grn) => (
                  <TableRow key={grn.id} className="hover:bg-muted/20">
                    <TableCell className="whitespace-nowrap">
                      {new Date(grn.receivedDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="font-mono font-medium text-primary">
                      <Link href={`/admin/inventory/grn/${grn.id}`}>
                        {grn.grnNumber}
                      </Link>
                    </TableCell>
                    <TableCell className="font-mono text-muted-foreground">
                      {grn.purchaseOrder.poNumber}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{grn.supplier.name}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{grn.warehouse.name}</div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="font-mono">{grn._count.items}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={getStatusColor(grn.status) as any} className="text-[10px] uppercase">
                        {grn.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/admin/inventory/grn/${grn.id}`}>
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
              <PackageCheck className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-medium mb-2">No receipts found</h3>
            <p className="text-sm text-muted-foreground max-w-sm mb-6">
              There are no Goods Receive Notes recorded in the system yet.
            </p>
            <Button asChild>
              <Link href="/admin/inventory/grn/new">
                <Plus className="mr-2 h-4 w-4" />
                Receive Goods
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
