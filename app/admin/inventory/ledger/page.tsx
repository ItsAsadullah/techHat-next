import { Suspense } from 'react';
import { getStockLedger, getLedgerFilterOptions } from '@/lib/actions/ledger-viewer-actions';
import { LedgerTable } from './ledger-table';
import { LedgerFilters } from './ledger-filters';
import { LedgerSummary } from './ledger-summary';
import { Metadata } from 'next';

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
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Stock Ledger</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Immutable inventory movement history — every transaction recorded permanently
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground bg-muted px-3 py-1.5 rounded-full font-mono">
            {ledgerData.total.toLocaleString()} entries
          </span>
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
      <Suspense fallback={<div className="h-96 animate-pulse rounded-lg bg-muted" />}>
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
