import { Suspense } from 'react';
import { getStockLedger, getLedgerFilterOptions } from '@/lib/actions/ledger-viewer-actions';
import { LedgerTable } from './ledger-table';
import { LedgerFilters } from './ledger-filters';
import { LedgerSummary } from './ledger-summary';
import { Metadata } from 'next';
import { BookOpen, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Stock Ledger | TechHat ERP',
  description: 'Complete immutable stock movement history across all warehouses',
};

interface PageProps {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}

export default async function StockLedgerPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = parseInt(params.page || '1');

  const filter = {
    page,
    limit: 50,
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
    warehouseId: params.warehouseId,
    productId: params.productId,
    referenceType: params.referenceType,
    search: params.search,
  };

  const [ledgerData, filterOptions] = await Promise.all([
    getStockLedger(filter),
    getLedgerFilterOptions(),
  ]);

  return (
    <div className="space-y-5">
      {/* Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-5 rounded-xl border shadow-sm">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
            <BookOpen className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-lg font-bold tracking-tight text-foreground">Immutable Stock Ledger</h1>
              <Badge variant="secondary" className="font-mono text-xs">
                {ledgerData.total.toLocaleString()} entries
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              Permanent audit log of every stock receipt, sale, transfer, and physical count adjustment.
            </p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <LedgerSummary summary={ledgerData.summary} />

      {/* Filters */}
      <LedgerFilters
        warehouses={filterOptions.warehouses}
        products={filterOptions.products}
        currentFilter={filter}
      />

      {/* Table */}
      <Suspense fallback={<div className="h-96 animate-pulse rounded-xl bg-muted" />}>
        <LedgerTable
          entries={ledgerData.entries}
          total={ledgerData.total}
          totalPages={ledgerData.totalPages}
          currentPage={ledgerData.currentPage}
          filter={filter}
        />
      </Suspense>
    </div>
  );
}
