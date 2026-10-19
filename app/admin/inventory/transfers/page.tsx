import { getTransfers } from '@/lib/actions/transfer-actions';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Plus,
  ArrowRight,
  ArrowLeftRight,
  Search,
  Eye,
  RotateCcw,
  Calendar,
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

export const dynamic = 'force-dynamic';

function getTransferBadgeStyle(status: string) {
  switch (status) {
    case 'RECEIVED':
      return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
    case 'IN_TRANSIT':
      return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
    case 'APPROVED':
      return 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20';
    case 'CANCELLED':
      return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
    default:
      return 'bg-muted text-muted-foreground';
  }
}

export default async function TransfersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const filters = await searchParams;
  const query = filters.q || '';
  const statusFilter = filters.status || '';
  const res = await getTransfers({ search: query, status: statusFilter });
  if (!res.success) throw new Error(res.error || 'Unable to load transfers.');
  const transfers = res.data || [];

  const statusTabs = [
    { value: '', label: 'All Transfers' },
    { value: 'DRAFT', label: 'Drafts' },
    { value: 'APPROVED', label: 'Ready to Dispatch' },
    { value: 'IN_TRANSIT', label: 'In Transit' },
    { value: 'RECEIVED', label: 'Received' },
    { value: 'CANCELLED', label: 'Cancelled' },
  ];

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="rounded-xl border bg-card p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-600 border border-blue-500/20 flex items-center justify-center shrink-0">
            <ArrowLeftRight className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-foreground">
                Inter-Warehouse Stock Transfers
              </h1>
              <Badge variant="secondary" className="font-mono text-xs">
                {transfers.length} shown
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Move stock across warehouse locations with four-stage verification (Draft → Reserve → Dispatch → Receive).
            </p>
          </div>
        </div>

        <Button asChild className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs">
          <Link href="/admin/inventory/transfers/new">
            <Plus className="mr-1.5 h-4 w-4" />
            New Stock Transfer
          </Link>
        </Button>
      </div>

      {/* Main Table Card */}
      <div className="rounded-xl border bg-card shadow-xs overflow-hidden">
        {/* Filter Toolbar */}
        <div className="p-4 border-b bg-muted/20 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
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

          <form className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            {statusFilter && <input type="hidden" name="status" value={statusFilter} />}
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                name="q"
                aria-label="Search transfers"
                defaultValue={query}
                placeholder="Search TRN number or warehouse…"
                className="pl-9 h-9 text-xs bg-background"
              />
            </div>
            <Button type="submit" size="sm" variant="secondary" className="h-9 text-xs">
              Search
            </Button>
            {(query || statusFilter) && (
              <Button variant="ghost" size="sm" asChild className="h-9 text-xs text-muted-foreground">
                <Link href="/admin/inventory/transfers">
                  <RotateCcw className="mr-1 h-3.5 w-3.5" />
                  Reset
                </Link>
              </Button>
            )}
          </form>
        </div>

        {/* Transfers Table */}
        {transfers.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="text-xs font-semibold uppercase">Transfer No</TableHead>
                  <TableHead className="text-xs font-semibold uppercase">Date</TableHead>
                  <TableHead className="text-xs font-semibold uppercase">Transfer Route</TableHead>
                  <TableHead className="text-xs font-semibold uppercase text-center">Line Items</TableHead>
                  <TableHead className="text-xs font-semibold uppercase text-center">Status</TableHead>
                  <TableHead className="text-xs font-semibold uppercase text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transfers.map((t: any) => (
                  <TableRow key={t.id} className="hover:bg-muted/20 transition-colors">
                    <TableCell className="font-mono font-semibold text-sm">
                      <Link
                        href={`/admin/inventory/transfers/${t.id}`}
                        className="text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        {t.transferNumber}
                      </Link>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        {format(new Date(t.date), 'dd MMM yyyy')}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="inline-flex items-center gap-2 text-xs sm:text-sm">
                        <span className="font-medium text-foreground">
                          {t.sourceWarehouse?.name || '—'}
                        </span>
                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="font-medium text-foreground">
                          {t.destWarehouse?.name || t.destinationWarehouse?.name || '—'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="font-mono text-xs">
                        {t._count?.items || 0} {t._count?.items === 1 ? 'SKU' : 'SKUs'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant="outline"
                        className={`text-[10px] uppercase font-semibold ${getTransferBadgeStyle(t.status)}`}
                      >
                        {t.status === 'APPROVED'
                          ? 'Ready to Dispatch'
                          : t.status.replaceAll('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild className="h-8 text-xs">
                        <Link href={`/admin/inventory/transfers/${t.id}`}>
                          <Eye className="h-3.5 w-3.5 mr-1.5" />
                          Manage
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-14 px-4 text-center">
            <div className="h-12 w-12 rounded-full bg-blue-500/10 text-blue-600 flex items-center justify-center mb-3">
              <ArrowLeftRight className="h-6 w-6" />
            </div>
            <h3 className="text-base font-semibold text-foreground">No stock transfers found</h3>
            <p className="text-xs text-muted-foreground max-w-sm mt-1 mb-5">
              {query || statusFilter
                ? 'No transfers match your current filters. Try resetting your search.'
                : 'Create a transfer to move inventory safely between your active warehouses.'}
            </p>
            <Button asChild size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white">
              <Link href="/admin/inventory/transfers/new">
                <Plus className="mr-1.5 h-4 w-4" />
                New Transfer
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
