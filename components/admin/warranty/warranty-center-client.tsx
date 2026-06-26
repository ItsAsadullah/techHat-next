'use client';

import { useState, useTransition } from 'react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  ShieldCheck, RefreshCw, Package, Truck, PackageCheck,
  CheckCircle2, ArchiveX, TrendingUp, DollarSign, Clock,
  ChevronRight, Inbox, X, Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ProductFinder } from '@/components/admin/shared/product-finder';
import { NewClaimDialog } from './new-claim-dialog';
import { ClaimDetailDrawer } from './claim-detail-drawer';
import { getWarrantyClaims } from '@/lib/actions/warranty-actions';

// ══════════════════════════════════════════════════════════════════════════════
//  TYPES
// ══════════════════════════════════════════════════════════════════════════════

type WarrantyStatus =
  | 'RECEIVED'
  | 'SENT_TO_SUPPLIER'
  | 'RECEIVED_FROM_SUPPLIER'
  | 'READY_FOR_CUSTOMER'
  | 'CLOSED'
  | 'CANCELLED';

// ══════════════════════════════════════════════════════════════════════════════
//  COLUMN CONFIG
// ══════════════════════════════════════════════════════════════════════════════

const COLUMNS: {
  status: WarrantyStatus;
  label: string;
  emoji: string;
  accentBg: string;
  accentText: string;
  accentBorder: string;
  cardBorder: string;
}[] = [
  {
    status: 'RECEIVED',
    label: 'Received',
    emoji: '📥',
    accentBg: 'bg-blue-600',
    accentText: 'text-blue-700',
    accentBorder: 'border-blue-200',
    cardBorder: 'border-l-blue-500',
  },
  {
    status: 'SENT_TO_SUPPLIER',
    label: 'Sent to Supplier',
    emoji: '🚚',
    accentBg: 'bg-orange-500',
    accentText: 'text-orange-700',
    accentBorder: 'border-orange-200',
    cardBorder: 'border-l-orange-400',
  },
  {
    status: 'RECEIVED_FROM_SUPPLIER',
    label: 'Returned',
    emoji: '📦',
    accentBg: 'bg-violet-600',
    accentText: 'text-violet-700',
    accentBorder: 'border-violet-200',
    cardBorder: 'border-l-violet-500',
  },
  {
    status: 'READY_FOR_CUSTOMER',
    label: 'Ready',
    emoji: '📞',
    accentBg: 'bg-teal-500',
    accentText: 'text-teal-700',
    accentBorder: 'border-teal-200',
    cardBorder: 'border-l-teal-500',
  },
  {
    status: 'CLOSED',
    label: 'Closed',
    emoji: '✅',
    accentBg: 'bg-slate-500',
    accentText: 'text-slate-600',
    accentBorder: 'border-slate-200',
    cardBorder: 'border-l-slate-400',
  },
];

// ══════════════════════════════════════════════════════════════════════════════
//  CLAIM CARD
// ══════════════════════════════════════════════════════════════════════════════

function ClaimCard({ claim, col, onOpen }: { claim: any; col: typeof COLUMNS[0]; onOpen: (c: any) => void }) {
  const daysSince = Math.floor((Date.now() - new Date(claim.createdAt).getTime()) / 86400000);
  const isUrgent = daysSince > 7 && !['CLOSED', 'CANCELLED'].includes(claim.status);
  const supplierData = claim.supplierWarranty as any;

  return (
    <div
      onClick={() => onOpen(claim)}
      className={cn(
        'bg-white border border-slate-200 rounded-2xl p-3.5 cursor-pointer',
        'border-l-4 hover:shadow-md hover:scale-[1.01] transition-all duration-150',
        col.cardBorder,
        isUrgent && 'ring-1 ring-red-200'
      )}
    >
      {/* Product + Age */}
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-bold text-slate-900 leading-snug truncate flex-1">{claim.product?.name}</p>
        <span className={cn(
          'text-[9px] font-black px-1.5 py-0.5 rounded-full shrink-0 whitespace-nowrap',
          isUrgent ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-500'
        )}>
          {daysSince === 0 ? 'Today' : `${daysSince}d`}
        </span>
      </div>

      {/* Brand + Variant */}
      <p className="text-[11px] text-slate-500 mt-0.5">
        {claim.product?.brand?.name}
        {claim.variant?.name ? ` · ${claim.variant.name}` : ''}
      </p>

      {/* Customer */}
      <div className="flex items-center gap-1.5 mt-2">
        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-[9px] font-black shrink-0">
          {(claim.order?.customerName || 'C').charAt(0)}
        </div>
        <span className="text-[11px] font-semibold text-slate-600 truncate">{claim.order?.customerName}</span>
        <span className="text-[10px] text-slate-400 font-mono truncate">{claim.order?.customerPhone}</span>
      </div>

      {/* Claim number + supplier tracking */}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
        <span className="text-[10px] text-slate-400 font-mono">{claim.claimNumber}</span>
        {supplierData?.trackingNumber && (
          <span className="text-[9px] font-bold bg-orange-50 text-orange-600 px-1.5 py-0.5 rounded font-mono">
            {supplierData.trackingNumber}
          </span>
        )}
        <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  KANBAN COLUMN
// ══════════════════════════════════════════════════════════════════════════════

function KanbanColumn({
  col, claims, onOpen, showClosed
}: {
  col: typeof COLUMNS[0];
  claims: any[];
  onOpen: (c: any) => void;
  showClosed: boolean;
}) {
  const isClosedCol = col.status === 'CLOSED';
  const visible = isClosedCol && !showClosed ? [] : claims;

  return (
    <div className="flex flex-col w-[80vw] sm:w-72 xl:w-80 shrink-0 snap-start">
      {/* Column Header */}
      <div className={cn('flex items-center gap-2 px-3 py-2.5 rounded-xl mb-3', `bg-${col.accentBg.split('-')[1]}-50 border ${col.accentBorder}`)}>
        <span className="text-base">{col.emoji}</span>
        <span className={cn('font-extrabold text-sm flex-1', col.accentText)}>{col.label}</span>
        <span className={cn('text-[11px] font-black px-2 py-0.5 rounded-full', col.accentBg, 'text-white')}>
          {claims.length}
        </span>
      </div>

      {/* Cards */}
      <div className="flex-1 space-y-2.5 overflow-y-auto max-h-[calc(100vh-320px)] pr-0.5">
        {visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center gap-2">
            <Inbox className="w-8 h-8 text-slate-200" />
            <p className="text-[11px] text-slate-400 font-medium">
              {isClosedCol && !showClosed ? `${claims.length} closed claims hidden` : 'No claims here'}
            </p>
          </div>
        ) : (
          visible.map(claim => <ClaimCard key={claim.id} claim={claim} col={col} onOpen={onOpen} />)
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  STAT BAR
// ══════════════════════════════════════════════════════════════════════════════

function StatBar({ stats }: { stats: any }) {
  const items = [
    { label: 'Received Today', value: stats.receivedToday, icon: Inbox,         color: 'text-blue-600 bg-blue-50'    },
    { label: 'With Supplier',  value: stats.sentToSupplier, icon: Truck,        color: 'text-orange-600 bg-orange-50' },
    { label: 'Ready',          value: stats.readyForCustomer, icon: CheckCircle2, color: 'text-teal-600 bg-teal-50'  },
    { label: 'Today Expense',  value: `৳${stats.todayExpense?.toLocaleString()}`, icon: DollarSign, color: 'text-purple-600 bg-purple-50' },
    { label: 'Month Expense',  value: `৳${stats.monthExpense?.toLocaleString()}`, icon: TrendingUp, color: 'text-rose-600 bg-rose-50'     },
  ];
  return (
    <div className="flex items-center gap-3 px-5 py-3 bg-white border-b border-slate-200 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-3 sm:pb-3">
      {items.map((item, i) => {
        const Icon = item.icon;
        return (
          <div key={i} className="flex items-center gap-2.5 min-w-[140px] shrink-0 snap-start bg-slate-50 sm:bg-transparent p-2 sm:p-0 rounded-xl sm:rounded-none border sm:border-0 border-slate-100">
            <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center shrink-0', item.color)}>
              <Icon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide leading-none">{item.label}</p>
              <p className="text-sm font-black text-slate-900 mt-0.5 leading-none">{item.value}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  MAIN CLIENT COMPONENT
// ══════════════════════════════════════════════════════════════════════════════

interface WarrantyCenterClientProps {
  initialClaims: any[];
  initialStats: any;
}

export default function WarrantyCenterClient({ initialClaims, initialStats }: WarrantyCenterClientProps) {
  const [claims, setClaims] = useState(initialClaims);
  const [stats, setStats] = useState(initialStats);
  const [selectedClaim, setSelectedClaim] = useState<any>(null);
  const [pendingProduct, setPendingProduct] = useState<any>(null);
  const [showClosed, setShowClosed] = useState(false);
  const [isPending, startTransition] = useTransition();

  const refreshData = async () => {
    startTransition(async () => {
      const fresh = await getWarrantyClaims();
      setClaims(fresh);
    });
  };

  const claimsByStatus = (status: WarrantyStatus) => claims.filter(c => c.status === status);
  const closedCount = claims.filter(c => c.status === 'CLOSED').length;

  return (
    <div className="flex flex-col h-full min-h-screen bg-slate-50">

      {/* ══ Header ════════════════════════════════════════════════════════════ */}
      <div className="sticky top-0 z-20 bg-white border-b border-slate-200 shadow-sm">

        {/* Title row */}
        <div className="flex items-center justify-between gap-4 px-5 py-3">
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-md">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-extrabold text-slate-900 leading-none">Warranty Center</h1>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">After Sales · Supplier Returns · Customer Delivery</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={refreshData}
            disabled={isPending}
            className="rounded-xl text-slate-500 hover:text-slate-800"
          >
            <RefreshCw className={cn('w-4 h-4', isPending && 'animate-spin')} />
          </Button>
        </div>

        {/* Inline Product Search */}
        <div className="px-5 pb-3">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
            <Search className="w-3 h-3" />
            New Warranty Claim — Search by Product, IMEI, Serial, Phone, Invoice, Barcode
          </p>
          <ProductFinder
            mode="warranty"
            onSelect={(item) => setPendingProduct(item)}
          />
        </div>
      </div>

      {/* ══ Stat Bar ══════════════════════════════════════════════════════════ */}
      <StatBar stats={stats} />

      {/* ══ Closed Toggle ═════════════════════════════════════════════════════ */}
      <div className="flex items-center justify-between px-5 py-2 bg-slate-50 border-b border-slate-200">
        <p className="text-[11px] font-bold text-slate-500">
          {claims.length} total claims · {claims.filter(c => c.status === 'CANCELLED').length} cancelled
        </p>
        <button
          onClick={() => setShowClosed(s => !s)}
          className={cn(
            'text-[11px] font-bold px-3 py-1.5 rounded-full border transition-all',
            showClosed ? 'bg-slate-200 text-slate-700 border-slate-300' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
          )}
        >
          {showClosed ? '✓ Showing Closed' : `Show Closed (${closedCount})`}
        </button>
      </div>

      {/* ══ Kanban Board ══════════════════════════════════════════════════════ */}
      <div className="flex-1 overflow-x-auto pb-4">
        <div className="flex gap-4 px-5 pt-5 pb-8 h-full min-w-max snap-x snap-mandatory">
          {COLUMNS.map(col => (
            <KanbanColumn
              key={col.status}
              col={col}
              claims={claimsByStatus(col.status)}
              onOpen={setSelectedClaim}
              showClosed={showClosed}
            />
          ))}
        </div>
      </div>

      {/* ══ Claim Detail Drawer ════════════════════════════════════════════════ */}
      {selectedClaim && (
        <ClaimDetailDrawer
          claim={selectedClaim}
          onClose={() => setSelectedClaim(null)}
          onRefresh={async () => {
            await refreshData();
            setSelectedClaim(null);
          }}
        />
      )}

      {/* ══ New Claim Sheet ════════════════════════════════════════════════════ */}
      {pendingProduct && (
        <NewClaimDialog
          product={pendingProduct}
          open={!!pendingProduct}
          onClose={() => setPendingProduct(null)}
          onSuccess={async () => { await refreshData(); setStats((s: any) => ({ ...s, receivedToday: s.receivedToday + 1, received: s.received + 1 })); }}
        />
      )}
    </div>
  );
}
