'use client';

import { Package, Hash, Tag, User, FileText, Calendar, ShieldCheck, Clock, Store } from 'lucide-react';

function InfoRow({ label, value, mono = false }: { label: string; value: string | null | undefined; mono?: boolean }) {
  if (!value) return null;
  return (
    <div className="flex items-start justify-between gap-2 py-2 border-b border-slate-100 last:border-0">
      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide shrink-0">{label}</span>
      <span className={`text-xs font-bold text-slate-800 text-right leading-tight ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  );
}

function WarrantyBar({ remaining, total }: { remaining: number; total: number }) {
  const pct = Math.max(0, Math.min(100, (remaining / total) * 100));
  const color = pct > 50 ? 'bg-emerald-500' : pct > 20 ? 'bg-amber-400' : 'bg-red-500';
  return (
    <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
      <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function ProductSummaryCard({ item }: { item: any }) {
  if (!item) return null;

  const warrantyTotal = (item.warrantyMonths || 12) * 30;
  const warrantyPct = Math.round((item.warrantyRemainingDays / warrantyTotal) * 100);
  const urgencyColor =
    item.warrantyRemainingDays > 90 ? 'text-emerald-600 bg-emerald-50 border-emerald-200' :
    item.warrantyRemainingDays > 30 ? 'text-amber-600 bg-amber-50 border-amber-200' :
    'text-red-600 bg-red-50 border-red-200';

  return (
    <div className="h-full flex flex-col gap-4">

      {/* ── Product Identity ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Hero image area */}
        <div className="bg-gradient-to-br from-slate-100 to-slate-200 h-36 flex items-center justify-center relative">
          {item.image ? (
            <img src={item.image} alt={item.productName} className="h-full w-full object-contain p-4" />
          ) : (
            <div className="flex flex-col items-center gap-2 text-slate-400">
              <Package className="w-12 h-12" />
              <span className="text-xs font-medium">No image</span>
            </div>
          )}
          {/* Warranty badge overlay */}
          <div className={`absolute top-3 right-3 text-[10px] font-black px-2 py-1 rounded-lg border ${urgencyColor}`}>
            {item.warrantyRemainingDays}d left
          </div>
        </div>

        <div className="p-4 space-y-3">
          <div>
            <h3 className="font-extrabold text-slate-900 text-sm leading-tight">{item.productName}</h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {item.brandName}{item.variantName ? ` · ${item.variantName}` : ''}
            </p>
          </div>

          {/* Warranty bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Warranty Coverage</span>
              <span className="text-[10px] font-bold text-slate-600">{warrantyPct}%</span>
            </div>
            <WarrantyBar remaining={item.warrantyRemainingDays} total={warrantyTotal} />
            <div className="flex justify-between text-[10px] text-slate-400 font-medium">
              <span>{item.warrantyType}</span>
              <span>{item.warrantyMonths}mo total</span>
            </div>
          </div>

          <InfoRow label="SKU" value={item.sku} mono />
          <InfoRow label="Serial" value={item.serialNumber} mono />
          <InfoRow label="IMEI" value={item.imei} mono />
        </div>
      </div>

      {/* ── Customer Block ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-1">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Customer</p>
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-black shrink-0">
            {item.customerName?.charAt(0) || '?'}
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900 leading-none">{item.customerName}</p>
            <p className="text-xs text-slate-500 mt-0.5 font-mono">{item.customerPhone}</p>
          </div>
        </div>
      </div>

      {/* ── Invoice & Dates ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-0">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Order Information</p>
        <InfoRow label="Invoice" value={item.invoiceNumber} mono />
        <InfoRow label="Purchased" value={item.purchaseDate ? new Date(item.purchaseDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : null} />
      </div>

    </div>
  );
}
