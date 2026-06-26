'use client';

import { History, Wrench, RotateCcw, Truck, ShieldAlert, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const STATUS_STYLES: Record<string, string> = {
  RECEIVED:           'bg-blue-50 text-blue-700 border-blue-200',
  UNDER_INSPECTION:   'bg-violet-50 text-violet-700 border-violet-200',
  APPROVED:           'bg-emerald-50 text-emerald-700 border-emerald-200',
  REJECTED:           'bg-red-50 text-red-700 border-red-200',
  IN_REPAIR:          'bg-orange-50 text-orange-700 border-orange-200',
  READY_FOR_PICKUP:   'bg-teal-50 text-teal-700 border-teal-200',
  CLOSED:             'bg-slate-100 text-slate-600 border-slate-200',
  REPLACED:           'bg-indigo-50 text-indigo-700 border-indigo-200',
};

export function HistorySidebar({ pastClaims }: { pastClaims: any[] }) {
  const repairs = pastClaims.filter(c => c.repairJob).length;
  const exchanges = pastClaims.filter(c => c.exchangeDetails).length;
  const supplier = pastClaims.filter(c => c.supplierWarranty).length;

  return (
    <div className="h-full flex flex-col gap-4">

      {/* ── Stats ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
        <div className="flex items-center gap-2 mb-4">
          <History className="w-4 h-4 text-slate-500" />
          <h3 className="text-sm font-bold text-slate-700">Unit History</h3>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-slate-50 rounded-xl p-3 text-center">
            <p className="text-2xl font-black text-slate-900">{pastClaims.length}</p>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wide mt-0.5">Claims</p>
          </div>
          <div className="bg-violet-50 rounded-xl p-3 text-center">
            <p className="text-2xl font-black text-violet-700">{repairs}</p>
            <p className="text-[10px] text-violet-600 font-bold uppercase tracking-wide mt-0.5">Repairs</p>
          </div>
          <div className="bg-indigo-50 rounded-xl p-3 text-center">
            <p className="text-2xl font-black text-indigo-700">{exchanges}</p>
            <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-wide mt-0.5">Exchanges</p>
          </div>
          <div className="bg-orange-50 rounded-xl p-3 text-center">
            <p className="text-2xl font-black text-orange-700">{supplier}</p>
            <p className="text-[10px] text-orange-600 font-bold uppercase tracking-wide mt-0.5">Supplier</p>
          </div>
        </div>
      </div>

      {/* ── Previous Claims Timeline ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex-1 overflow-y-auto">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-4">Service History</p>

        {pastClaims.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center gap-2">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-emerald-500" />
            </div>
            <p className="text-xs font-bold text-slate-600">Clean Record</p>
            <p className="text-[11px] text-slate-400">No previous claims for this unit</p>
          </div>
        ) : (
          <div className="space-y-0">
            {pastClaims.map((claim, i) => {
              const style = STATUS_STYLES[claim.status] || 'bg-slate-50 text-slate-600 border-slate-200';
              const isLast = i === pastClaims.length - 1;
              return (
                <div key={claim.id || i} className="relative flex gap-3">
                  {/* Timeline line */}
                  {!isLast && (
                    <div className="absolute left-4 top-9 bottom-0 w-0.5 bg-slate-100" />
                  )}
                  {/* Node */}
                  <div className="w-8 h-8 rounded-full bg-slate-100 border-2 border-white shadow-sm flex items-center justify-center shrink-0 mt-1 relative z-10">
                    <AlertCircle className="w-3.5 h-3.5 text-slate-500" />
                  </div>
                  <div className="flex-1 pb-5 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 font-mono truncate">{claim.claimNumber}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">{claim.issueCategory}</p>
                      </div>
                      <span className={cn('text-[9px] font-black px-2 py-0.5 rounded-full border uppercase tracking-wide shrink-0 whitespace-nowrap', style)}>
                        {claim.status}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(claim.claimDate || claim.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── ERP Notice ── */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
        <p className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">ERP Notice</p>
        <p className="text-[11px] text-amber-700 mt-1 leading-relaxed">
          This is a Service Ticket — not a Sales Return. Stock ledger remains unchanged.
        </p>
      </div>
    </div>
  );
}
