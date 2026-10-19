'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { format } from 'date-fns';
import { Download, ChevronLeft, ChevronRight, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import Link from 'next/link';

interface LedgerEntry {
  id: string;
  createdAt: Date;
  referenceType: string;
  referenceId: string;
  warehouse: { id: string; name: string; code: string };
  product: { id: string; name: string; sku: string | null };
  variant: { id: string; name: string; sku: string | null } | null;
  inQty: number;
  outQty: number;
  balanceQty: number;
  unitCost: number;
  totalValue: number;
  note: string | null;
}

interface LedgerTableProps {
  entries: LedgerEntry[];
  total: number;
  totalPages: number;
  currentPage: number;
  filter: any;
}

const TYPE_COLORS: Record<string, string> = {
  GRN: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:text-emerald-400',
  SALE: 'bg-blue-500/10 text-blue-700 border-blue-500/20 dark:text-blue-400',
  RETURN: 'bg-purple-500/10 text-purple-700 border-purple-500/20 dark:text-purple-400',
  ADJUSTMENT: 'bg-amber-500/10 text-amber-700 border-amber-500/20 dark:text-amber-400',
  TRANSFER: 'bg-indigo-500/10 text-indigo-700 border-indigo-500/20 dark:text-indigo-400',
  TRANSFER_DISPATCH: 'bg-indigo-500/10 text-indigo-700 border-indigo-500/20 dark:text-indigo-400',
  TRANSFER_RECEIPT: 'bg-teal-500/10 text-teal-700 border-teal-500/20 dark:text-teal-400',
  PO: 'bg-cyan-500/10 text-cyan-700 border-cyan-500/20 dark:text-cyan-400',
};

export function LedgerTable({ entries, total, totalPages, currentPage }: LedgerTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isExporting, setIsExporting] = useState(false);

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`/admin/inventory/ledger?${params.toString()}`);
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const params = new URLSearchParams(searchParams.toString());
      toast.info('Export started. Check your downloads.');
      window.open(`/api/export/ledger?${params.toString()}`, '_blank');
    } catch (error) {
      toast.error('Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="bg-card border rounded-xl shadow-sm overflow-hidden flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/20">
        <span className="text-xs font-medium text-muted-foreground">
          Showing <span className="font-mono font-semibold text-foreground">{entries.length}</span> of{' '}
          <span className="font-mono font-semibold text-foreground">{total.toLocaleString()}</span> immutable records
        </span>
        <button
          onClick={handleExport}
          disabled={isExporting}
          className="flex items-center gap-1.5 text-xs font-semibold bg-primary text-primary-foreground px-3 py-1.5 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 shadow-xs"
        >
          <Download className="h-3.5 w-3.5" />
          {isExporting ? 'Exporting...' : 'Export CSV'}
        </button>
      </div>

      <div className="overflow-x-auto max-h-[680px] overflow-y-auto">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="sticky inset-block-start-0 z-10 text-[11px] font-semibold text-muted-foreground bg-muted/95 backdrop-blur-xs uppercase tracking-wider border-b">
            <tr>
              <th className="px-4 py-3 whitespace-nowrap">Timestamp</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">Transaction Type</th>
              <th className="px-4 py-3 min-w-[220px]">Product / SKU</th>
              <th className="px-4 py-3 text-right">Stock In</th>
              <th className="px-4 py-3 text-right">Stock Out</th>
              <th className="px-4 py-3 text-right">Running Bal</th>
              <th className="px-4 py-3 text-right">Unit Cost</th>
              <th className="px-4 py-3 text-right">Total Value</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {entries.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-14 text-center text-muted-foreground text-sm">
                  No stock ledger entries found matching your filters.
                </td>
              </tr>
            ) : (
              entries.map((entry) => (
                <tr key={entry.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap text-xs text-muted-foreground font-mono">
                    {format(new Date(entry.createdAt), 'dd MMM yyyy, HH:mm')}
                  </td>
                  <td className="px-4 py-3">
                    <span className="bg-muted px-2 py-0.5 rounded border text-xs font-mono font-bold">
                      {entry.warehouse.code}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <span
                        className={`inline-flex w-fit px-2 py-0.5 rounded border text-[10px] font-bold tracking-wider ${
                          TYPE_COLORS[entry.referenceType] || 'bg-muted text-foreground border-border'
                        }`}
                      >
                        {entry.referenceType.replaceAll('_', ' ')}
                      </span>
                      {['TRANSFER', 'TRANSFER_DISPATCH', 'TRANSFER_RECEIPT', 'ADJUSTMENT'].includes(entry.referenceType) && (
                        <Link
                          className="text-[11px] font-medium text-primary hover:underline"
                          href={`/admin/inventory/${entry.referenceType === 'ADJUSTMENT' ? 'adjustments' : 'transfers'}/${entry.referenceId}`}
                        >
                          View document →
                        </Link>
                      )}
                      {entry.note && (
                        <span className="text-[11px] text-muted-foreground line-clamp-1 max-w-52" title={entry.note}>
                          {entry.note}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-sm text-foreground line-clamp-1" title={entry.product.name}>
                      {entry.product.name}
                    </p>
                    {(entry.variant || entry.product.sku) && (
                      <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1.5">
                        {entry.variant && <span className="font-medium text-primary/80">{entry.variant.name}</span>}
                        {entry.product.sku && (
                          <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-[10px]">{entry.product.sku}</span>
                        )}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {entry.inQty > 0 ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-mono font-bold text-xs bg-emerald-500/10 px-2 py-0.5 rounded">
                        <ArrowDownRight className="h-3 w-3" />+{entry.inQty}
                      </span>
                    ) : (
                      <span className="text-muted-foreground/40 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {entry.outQty > 0 ? (
                      <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 font-mono font-bold text-xs bg-rose-500/10 px-2 py-0.5 rounded">
                        <ArrowUpRight className="h-3 w-3" />-{entry.outQty}
                      </span>
                    ) : (
                      <span className="text-muted-foreground/40 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-sm">
                    {entry.balanceQty}
                  </td>
                  <td className="px-4 py-3 text-right text-xs font-mono text-muted-foreground">
                    ৳{entry.unitCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-xs text-indigo-600 dark:text-indigo-400">
                    ৳{entry.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/10">
          <span className="text-xs text-muted-foreground font-medium">
            Page <span className="font-mono font-bold text-foreground">{currentPage}</span> of{' '}
            <span className="font-mono font-bold text-foreground">{totalPages}</span>
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="p-1.5 rounded-lg border bg-background hover:bg-muted disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="p-1.5 rounded-lg border bg-background hover:bg-muted disabled:opacity-40 transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
