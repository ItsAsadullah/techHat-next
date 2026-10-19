import { Metadata } from 'next';
import {
  ClipboardCheck,
  Search,
  Plus,
  Eye,
  Warehouse,
  Calendar,
  RotateCcw,
} from 'lucide-react';
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
} from '@/components/ui/table';
import { getAdjustments } from '@/lib/actions/adjustment-actions';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Stock Adjustments | ERP',
  description: 'Manage inventory corrections and adjustments',
};

const REASON_LABELS: Record<string, { label: string; style: string }> = {
  COUNT: {
    label: 'Physical Count',
    style: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  },
  DAMAGE: {
    label: 'Damaged Goods',
    style: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
  },
  THEFT: {
    label: 'Lost / Stolen',
    style: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
  },
  EXPIRED: {
    label: 'Expired Stock',
    style: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
  },
};

function getStatusBadge(status: string) {
  switch (status) {
    case 'APPROVED':
      return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
    case 'DRAFT':
      return 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20';
    case 'PENDING_APPROVAL':
      return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
    case 'REJECTED':
      return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
    default:
      return 'bg-muted text-muted-foreground';
  }
}

export default async function AdjustmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; status?: string }>;
}) {
  const params = await searchParams;
  const query = params.q || '';
  const page = Number(params.page) || 1;
  const statusFilter = params.status || '';

  const result = await getAdjustments({
    page,
    limit: 15,
    search: query,
    status: statusFilter,
  });

  if (!result.success) {
    throw new Error(result.error || 'Unable to load adjustments.');
  }
  const adjustments = result.data?.adjustments || [];
  const totalCount = result.data?.totalCount || 0;
  const totalPages = Math.max(1, result.data?.totalPages || 1);

  const statusTabs = [
    { value: '', label: 'All Records' },
    { value: 'DRAFT', label: 'Drafts to Review' },
    { value: 'APPROVED', label: 'Approved' },
    { value: 'REJECTED', label: 'Rejected' },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header Card */}
      <div className="rounded-xl border bg-card p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-600 border border-amber-500/20 flex items-center justify-center shrink-0">
            <ClipboardCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-foreground">
                Stock Adjustments & Reconciliations
              </h1>
              <Badge variant="secondary" className="font-mono text-xs">
                {totalCount} total
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Audit physical inventory counts, record damaged or expired write-offs, and post approved variances to the ledger.
            </p>
          </div>
        </div>

        <Button asChild className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs">
          <Link href="/admin/inventory/adjustments/new">
            <Plus className="mr-1.5 h-4 w-4" />
            New Stock Adjustment
          </Link>
        </Button>
      </div>

      {/* Main Table Card */}
      <div className="rounded-xl border bg-card text-card-foreground shadow-xs overflow-hidden">
        {/* Filter Toolbar */}
        <div className="p-4 border-b bg-muted/20 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Quick Status Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 lg:pb-0">
            {statusTabs.map((tab) => {
              const active = statusFilter === tab.value;
              const href = `?${new URLSearchParams({
                ...(query ? { q: query } : {}),
                ...(tab.value ? { status: tab.value } : {}),
              })}`;
              return (
                <Link
                  key={tab.value}
                  href={href}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                    active
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-muted-foreground hover:bg-background hover:text-foreground'
                  }`}
                >
                  {tab.label}
                </Link>
              );
            })}
          </div>

          {/* Search Form */}
          <form className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            {statusFilter && <input type="hidden" name="status" value={statusFilter} />}
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                aria-label="Search adjustment number"
                name="q"
                defaultValue={query}
                placeholder="Search ADJ number…"
                className="pl-9 h-9 text-xs bg-background"
              />
            </div>
            <Button type="submit" size="sm" variant="secondary" className="h-9 text-xs">
              Search
            </Button>
            {(query || statusFilter) && (
              <Button variant="ghost" size="sm" asChild className="h-9 text-xs text-muted-foreground">
                <Link href="/admin/inventory/adjustments">
                  <RotateCcw className="mr-1 h-3.5 w-3.5" />
                  Reset
                </Link>
              </Button>
            )}
          </form>
        </div>

        {/* Table Content */}
        {adjustments.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="text-xs font-semibold uppercase">Adjustment ID</TableHead>
                  <TableHead className="text-xs font-semibold uppercase">Date</TableHead>
                  <TableHead className="text-xs font-semibold uppercase">Warehouse</TableHead>
                  <TableHead className="text-xs font-semibold uppercase">Reason</TableHead>
                  <TableHead className="text-xs font-semibold uppercase text-center">Items Affected</TableHead>
                  <TableHead className="text-xs font-semibold uppercase text-center">Status</TableHead>
                  <TableHead className="text-xs font-semibold uppercase text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {adjustments.map((adj) => {
                  const reasonInfo = REASON_LABELS[adj.reason] || {
                    label: adj.reason,
                    style: 'bg-muted text-muted-foreground',
                  };
                  return (
                    <TableRow key={adj.id} className="hover:bg-muted/20 transition-colors">
                      <TableCell className="font-mono font-semibold text-sm">
                        <Link
                          href={`/admin/inventory/adjustments/${adj.id}`}
                          className="text-indigo-600 dark:text-indigo-400 hover:underline"
                        >
                          {adj.adjustmentNumber}
                        </Link>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5" />
                          {new Date(adj.date).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1.5 font-medium text-sm">
                          <Warehouse className="h-3.5 w-3.5 text-muted-foreground" />
                          {adj.warehouse.name}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-[11px] font-medium ${reasonInfo.style}`}>
                          {reasonInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className="font-mono text-xs">
                          {adj._count.items} {adj._count.items === 1 ? 'SKU' : 'SKUs'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant="outline"
                          className={`text-[10px] uppercase font-semibold ${getStatusBadge(adj.status)}`}
                        >
                          {adj.status.replaceAll('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" asChild className="h-8 text-xs">
                          <Link href={`/admin/inventory/adjustments/${adj.id}`}>
                            <Eye className="h-3.5 w-3.5 mr-1.5" />
                            Review
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-14 px-4 text-center">
            <div className="h-12 w-12 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center mb-3">
              <ClipboardCheck className="h-6 w-6" />
            </div>
            <h3 className="text-base font-semibold text-foreground">No stock adjustments found</h3>
            <p className="text-xs text-muted-foreground max-w-sm mt-1 mb-5">
              {query || statusFilter
                ? 'No adjustments match your current filters. Try resetting your search.'
                : 'Start a physical inventory count or record damaged stock to reconcile warehouse quantities.'}
            </p>
            <Button asChild size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white">
              <Link href="/admin/inventory/adjustments/new">
                <Plus className="mr-1.5 h-4 w-4" />
                Create Adjustment
              </Link>
            </Button>
          </div>
        )}

        {/* Footer Pagination */}
        <div className="px-4 py-3 border-t bg-muted/10 flex flex-wrap gap-3 items-center justify-between text-xs text-muted-foreground">
          <span>
            Showing page <strong className="text-foreground">{page}</strong> of{' '}
            <strong className="text-foreground">{totalPages}</strong> ({totalCount} total records)
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Button variant="outline" size="sm" className="h-8 text-xs" asChild>
                <Link
                  href={`?${new URLSearchParams({
                    q: query,
                    status: statusFilter,
                    page: String(page - 1),
                  })}`}
                >
                  Previous
                </Link>
              </Button>
            )}
            {page < totalPages && (
              <Button variant="outline" size="sm" className="h-8 text-xs" asChild>
                <Link
                  href={`?${new URLSearchParams({
                    q: query,
                    status: statusFilter,
                    page: String(page + 1),
                  })}`}
                >
                  Next
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
