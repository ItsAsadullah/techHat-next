'use client';

import { format } from 'date-fns';
import { ArrowDownRight, ArrowUpRight, History } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface LedgerHistoryProps {
  ledgerEntries: any[];
}

const TYPE_COLORS: Record<string, string> = {
  GRN: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
  SALE: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',
  RETURN: 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400',
  ADJUSTMENT: 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400',
  TRANSFER: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-500/20 dark:text-zinc-400',
  PO: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-400',
};

export function ProductLedgerHistory({ ledgerEntries }: LedgerHistoryProps) {
  if (!ledgerEntries || ledgerEntries.length === 0) {
    return (
      <div className="py-12 text-center border rounded-lg bg-card mt-4">
        <History className="mx-auto h-8 w-8 text-muted-foreground/50 mb-3" />
        <h3 className="text-sm font-semibold text-foreground">No Ledger Entries</h3>
        <p className="text-xs text-muted-foreground mt-1">This product has no recorded stock movements in the ledger.</p>
      </div>
    );
  }

  return (
    <div className="bg-card border rounded-lg overflow-hidden mt-4">
      <div className="px-5 py-3 border-b bg-muted/20 flex justify-between items-center">
        <h3 className="text-sm font-semibold">Stock Ledger Movements (Recent 50)</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-muted-foreground bg-muted/50 uppercase">
            <tr>
              <th className="px-4 py-3 font-medium whitespace-nowrap">Date</th>
              <th className="px-4 py-3 font-medium">Reference</th>
              <th className="px-4 py-3 font-medium">Warehouse</th>
              <th className="px-4 py-3 font-medium text-right">Opening</th>
              <th className="px-4 py-3 font-medium text-right">In</th>
              <th className="px-4 py-3 font-medium text-right">Out</th>
              <th className="px-4 py-3 font-medium text-right">Closing</th>
              <th className="px-4 py-3 font-medium text-right">MAC (Cost)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {ledgerEntries.map((entry) => (
              <tr key={entry.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 whitespace-nowrap text-xs">
                  {format(new Date(entry.date), 'dd MMM yyyy, HH:mm')}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-1">
                    <span className={`inline-flex w-fit px-2 py-0.5 rounded text-[10px] font-bold tracking-wider ${TYPE_COLORS[entry.referenceType] || 'bg-gray-100 text-gray-700'}`}>
                      {entry.referenceType}
                    </span>
                    <span className="text-xs font-mono text-muted-foreground truncate max-w-[120px]" title={entry.remarks || entry.referenceId}>
                      {entry.remarks || entry.referenceId}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {entry.warehouse?.name || '—'}
                </td>
                <td className="px-4 py-3 text-right font-mono text-muted-foreground">
                  {entry.openingQty}
                </td>
                <td className="px-4 py-3 text-right font-mono">
                  {entry.inQty > 0 ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center justify-end gap-1">
                      <ArrowDownRight className="h-3 w-3" /> {entry.inQty}
                    </span>
                  ) : '-'}
                </td>
                <td className="px-4 py-3 text-right font-mono">
                  {entry.outQty > 0 ? (
                    <span className="text-rose-600 dark:text-rose-400 font-medium flex items-center justify-end gap-1">
                      <ArrowUpRight className="h-3 w-3" /> {entry.outQty}
                    </span>
                  ) : '-'}
                </td>
                <td className="px-4 py-3 text-right font-mono font-medium">
                  {entry.closingQty}
                </td>
                <td className="px-4 py-3 text-right font-mono text-xs text-indigo-600">
                  ৳{entry.unitCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
