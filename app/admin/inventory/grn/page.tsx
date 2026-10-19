import { Metadata } from 'next';
import { PackageCheck, Search, Plus, Eye } from "lucide-react";
import Link from 'next/link';
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

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Goods Receive Notes | ERP',
  description: 'Manage warehouse receipts',
};

function getStatusBadge(status: string) {
  switch (status) {
    case 'SUBMITTED':
      return <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20 text-[10px]">SUBMITTED</Badge>;
    case 'DRAFT':
      return <Badge variant="secondary" className="text-[10px]">DRAFT</Badge>;
    case 'CANCELLED':
      return <Badge variant="destructive" className="text-[10px]">CANCELLED</Badge>;
    default:
      return <Badge variant="secondary" className="text-[10px]">{status}</Badge>;
  }
}

export default async function GRNPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; status?: string }>
}) {
  const query = (await searchParams).q || '';
  const page = Number((await searchParams).page) || 1;
  const statusFilter = (await searchParams).status || '';

  const result = await getGRNs({ page, limit: 20, search: query, status: statusFilter });

  const grns = result.success ? result.data?.grns || [] : [];
  const totalCount = result.success ? result.data?.totalCount || 0 : 0;

  return (
    <div className="space-y-5">
      {/* Header & Controls Card */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-card p-5 rounded-xl border shadow-sm">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
            <PackageCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg font-bold tracking-tight">Goods Receive Notes (GRN)</h2>
              <Badge variant="secondary" className="font-mono text-xs">{totalCount} Records</Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Receive inbound supplier shipments against Purchase Orders directly into warehouse stock.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          <form className="relative flex-1 sm:w-[260px]">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              name="q"
              defaultValue={query}
              placeholder="Search GRN or PO number..."
              className="pl-9 h-9 bg-muted/40 text-sm"
            />
          </form>
          <Button size="sm" className="h-9 shadow-sm shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white" asChild>
            <Link href="/admin/inventory/grn/new">
              <Plus className="mr-1.5 h-4 w-4" />
              Receive Goods (GRN)
            </Link>
          </Button>
        </div>
      </div>

      {/* Status Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { label: 'All Receipts', value: '' },
          { label: 'Submitted', value: 'SUBMITTED' },
          { label: 'Drafts', value: 'DRAFT' },
          { label: 'Cancelled', value: 'CANCELLED' },
        ].map((tab) => {
          const isActive = statusFilter === tab.value;
          return (
            <Link
              key={tab.label}
              href={tab.value ? `/admin/inventory/grn?status=${tab.value}` : '/admin/inventory/grn'}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors whitespace-nowrap ${
                isActive
                  ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                  : 'bg-card text-muted-foreground border-border hover:bg-muted/60 hover:text-foreground'
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {/* Table Card */}
      <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
        {grns.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="text-xs uppercase tracking-wider font-semibold">GRN Number</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider font-semibold">Received Date</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider font-semibold">Purchase Order</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider font-semibold">Supplier</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider font-semibold">Destination Warehouse</TableHead>
                  <TableHead className="text-center text-xs uppercase tracking-wider font-semibold">Line Items</TableHead>
                  <TableHead className="text-center text-xs uppercase tracking-wider font-semibold">Status</TableHead>
                  <TableHead className="text-right text-xs uppercase tracking-wider font-semibold">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {grns.map((grn) => (
                  <TableRow key={grn.id} className="hover:bg-muted/20 transition-colors">
                    <TableCell className="font-mono font-bold text-primary">
                      <Link href={`/admin/inventory/grn/${grn.id}`} className="hover:underline">
                        {grn.grnNumber}
                      </Link>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                      {new Date(grn.receivedDate).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-xs font-medium bg-muted px-2 py-0.5 rounded border">
                        {grn.purchaseOrder.poNumber}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-sm">{grn.supplier.name}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-2.5 py-1 rounded border border-emerald-500/20 inline-block">
                        {grn.warehouse.name}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="font-mono text-xs">{grn._count.items} SKUs</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {getStatusBadge(grn.status)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" className="h-8 text-xs font-medium" asChild>
                        <Link href={`/admin/inventory/grn/${grn.id}`}>
                          <Eye className="h-3.5 w-3.5 mr-1.5" /> View
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-3">
              <PackageCheck className="h-6 w-6 text-emerald-600" />
            </div>
            <h3 className="text-sm font-semibold">No Goods Receive Notes found</h3>
            <p className="text-xs text-muted-foreground max-w-sm mt-1 mb-4">
              Record a Goods Receive Note (GRN) against an approved Purchase Order to bring stock into your warehouse.
            </p>
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" asChild>
              <Link href="/admin/inventory/grn/new">
                <Plus className="mr-1.5 h-4 w-4" />
                Receive Goods (GRN)
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
