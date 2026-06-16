'use client';

import { format } from 'date-fns';
import { ArrowDownRight, ArrowUpRight, FileText, ArrowRightLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { SupplierLedgerEntry } from '@/lib/actions/supplier-ledger-actions';

interface SupplierLedgerTableProps {
  ledger: SupplierLedgerEntry[];
}

const TYPE_CONFIG: Record<string, { label: string; bg: string; icon: any }> = {
  OPENING_BALANCE: { label: 'OPENING', bg: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300', icon: FileText },
  PURCHASE: { label: 'PURCHASE (BILL)', bg: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-400', icon: ArrowUpRight },
  PAYMENT: { label: 'PAYMENT', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400', icon: ArrowDownRight },
  RETURN: { label: 'RETURN (DEBIT NOTE)', bg: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400', icon: ArrowRightLeft },
};

export function SupplierLedgerTable({ ledger }: SupplierLedgerTableProps) {
  if (!ledger || ledger.length === 0) {
    return (
      <div className="py-12 text-center border rounded-lg bg-card">
        <FileText className="mx-auto h-8 w-8 text-muted-foreground/50 mb-3" />
        <h3 className="text-sm font-semibold text-foreground">No Ledger Entries</h3>
        <p className="text-xs text-muted-foreground mt-1">This supplier has no financial transactions recorded yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-card border rounded-lg overflow-hidden shadow-sm">
      <div className="px-5 py-4 border-b bg-muted/20 flex justify-between items-center">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          Financial Ledger
        </h3>
        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded font-medium">
          {ledger.length} entries
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-muted-foreground bg-muted/50 uppercase">
            <tr>
              <th className="px-4 py-3 font-medium whitespace-nowrap">Date</th>
              <th className="px-4 py-3 font-medium">Transaction</th>
              <th className="px-4 py-3 font-medium">Reference</th>
              <th className="px-4 py-3 font-medium text-right">Debit (You Paid)</th>
              <th className="px-4 py-3 font-medium text-right">Credit (You Owe)</th>
              <th className="px-4 py-3 font-medium text-right">Balance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {ledger.map((entry, index) => {
              const cfg = TYPE_CONFIG[entry.type];
              const Icon = cfg.icon;
              return (
                <tr key={`${entry.id}-${index}`} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-4 whitespace-nowrap text-xs">
                    {format(new Date(entry.date), 'dd MMM yyyy')}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-col gap-1.5">
                      <Badge variant="outline" className={`w-fit text-[10px] font-bold tracking-wider ${cfg.bg}`}>
                        <Icon className="h-3 w-3 mr-1" />
                        {cfg.label}
                      </Badge>
                      <span className="text-xs text-muted-foreground truncate max-w-[200px]" title={entry.description}>
                        {entry.description}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4 font-mono text-xs">
                    {entry.referenceNo}
                  </td>
                  <td className="px-4 py-4 text-right font-mono">
                    {entry.debit > 0 ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                        ৳{entry.debit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    ) : <span className="text-muted-foreground/30">-</span>}
                  </td>
                  <td className="px-4 py-4 text-right font-mono">
                    {entry.credit > 0 ? (
                      <span className="text-rose-600 dark:text-rose-400 font-medium">
                        ৳{entry.credit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    ) : <span className="text-muted-foreground/30">-</span>}
                  </td>
                  <td className="px-4 py-4 text-right font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    ৳{entry.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
