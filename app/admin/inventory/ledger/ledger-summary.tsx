'use client';

import { ArrowDownRight, ArrowUpRight, Box, CircleDollarSign, History } from 'lucide-react';

interface LedgerSummaryProps {
  summary: {
    totalIn: number;
    totalOut: number;
    totalValue: number;
    totalEntries: number;
  };
}

export function LedgerSummary({ summary }: LedgerSummaryProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Entries */}
      <div className="bg-card border rounded-xl p-5 flex items-center gap-4">
        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
          <History className="h-6 w-6" />
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">Transactions</p>
          <h3 className="text-2xl font-bold">{summary.totalEntries.toLocaleString()}</h3>
        </div>
      </div>

      {/* Stock In */}
      <div className="bg-card border rounded-xl p-5 flex items-center gap-4">
        <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
          <ArrowDownRight className="h-6 w-6" />
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">Total Stock In</p>
          <h3 className="text-2xl font-bold">{summary.totalIn.toLocaleString()}</h3>
        </div>
      </div>

      {/* Stock Out */}
      <div className="bg-card border rounded-xl p-5 flex items-center gap-4">
        <div className="h-12 w-12 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500">
          <ArrowUpRight className="h-6 w-6" />
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">Total Stock Out</p>
          <h3 className="text-2xl font-bold">{summary.totalOut.toLocaleString()}</h3>
        </div>
      </div>

      {/* Total Value */}
      <div className="bg-card border rounded-xl p-5 flex items-center gap-4">
        <div className="h-12 w-12 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-500">
          <CircleDollarSign className="h-6 w-6" />
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">Transaction Value</p>
          <h3 className="text-2xl font-bold">৳ {summary.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
        </div>
      </div>
    </div>
  );
}
