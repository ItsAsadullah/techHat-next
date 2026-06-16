'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { format } from 'date-fns';
import { Download, ChevronLeft, ChevronRight, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface LedgerEntry {
  id: string;
  date: Date;
  referenceType: string;
  referenceId: string;
  warehouse: { id: string; name: string; code: string };
  product: { id: string; name: string; sku: string | null };
  productVariant: { id: string; name: string; sku: string | null } | null;
  openingQty: number;
  inQty: number;
  outQty: number;
  closingQty: number;
  unitCost: number;
  totalValue: number;
  remarks: string | null;
}

interface LedgerTableProps {
  entries: LedgerEntry[];
  total: number;
  totalPages: number;
  currentPage: number;
  filter: any;
}

const TYPE_COLORS: Record<string, string> = {
  GRN: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
  SALE: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',
  RETURN: 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400',
  ADJUSTMENT: 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400',
  TRANSFER: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-500/20 dark:text-zinc-400',
  PO: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-400',
};

export function LedgerTable({ entries, totalPages, currentPage, filter }: LedgerTableProps) {
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
      
      // In a real app, you'd call a dedicated API route that returns CSV text.
      // Here we assume the server action handles the heavy lifting but returning large strings 
      // over Server Actions can be slow. A dedicated API endpoint is better for large exports.
      toast.info('Export started. Check your downloads.');
      window.open(`/api/export/ledger?${params.toString()}`, '_blank');
      
    } catch (error) {
      toast.error('Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="bg-card border rounded-lg overflow-hidden flex flex-col">
      <div className="flex justify-end p-3 border-b bg-muted/10">
        <button
          onClick={handleExport}
          disabled={isExporting}
          className="flex items-center gap-2 text-xs font-medium bg-primary text-primary-foreground px-3 py-1.5 rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          <Download className="h-3.5 w-3.5" />
          {isExporting ? 'Exporting...' : 'Export CSV'}
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-muted-foreground bg-muted/50 uppercase">
            <tr>
              <th className="px-4 py-3 font-medium whitespace-nowrap">Date</th>
              <th className="px-4 py-3 font-medium">Warehouse</th>
              <th className="px-4 py-3 font-medium">Reference</th>
              <th className="px-4 py-3 font-medium min-w-[200px]">Product</th>
              <th className="px-4 py-3 font-medium text-right">In</th>
              <th className="px-4 py-3 font-medium text-right">Out</th>
              <th className="px-4 py-3 font-medium text-right">Balance</th>
              <th className="px-4 py-3 font-medium text-right">Cost</th>
              <th className="px-4 py-3 font-medium text-right">Value</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {entries.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center text-muted-foreground">
                  No stock ledger entries found matching your filters.
                </td>
              </tr>
            ) : (
              entries.map((entry) => (
                <tr key={entry.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap text-xs">
                    {format(new Date(entry.date), 'dd MMM yyyy, HH:mm')}
                  </td>
                  <td className="px-4 py-3">
                    <span className="bg-muted px-2 py-0.5 rounded text-xs font-medium">
                      {entry.warehouse.code}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <span className={`inline-flex w-fit px-2 py-0.5 rounded text-[10px] font-bold tracking-wider ${TYPE_COLORS[entry.referenceType] || 'bg-gray-100 text-gray-700'}`}>
                        {entry.referenceType}
                      </span>
                      <span className="text-xs font-mono text-muted-foreground truncate max-w-[120px]" title={entry.referenceId}>
                        {entry.referenceId.split('-').pop() || entry.referenceId}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground line-clamp-1" title={entry.product.name}>
                      {entry.product.name}
                    </p>
                    {(entry.productVariant || entry.product.sku) && (
                      <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                        {entry.productVariant && <span>{entry.productVariant.name}</span>}
                        {entry.product.sku && <span className="font-mono bg-muted/50 px-1 rounded">{entry.product.sku}</span>}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {entry.inQty > 0 ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                        <ArrowDownRight className="h-3 w-3" />
                        {entry.inQty}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {entry.outQty > 0 ? (
                      <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 font-medium">
                        <ArrowUpRight className="h-3 w-3" />
                        {entry.outQty}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-medium">
                    {entry.closingQty}
                  </td>
                  <td className="px-4 py-3 text-right text-xs">
                    ৳ {entry.unitCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-indigo-600 dark:text-indigo-400">
                    ৳ {entry.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
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
          <span className="text-xs text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="p-1 rounded-md hover:bg-muted disabled:opacity-50 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="p-1 rounded-md hover:bg-muted disabled:opacity-50 transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
