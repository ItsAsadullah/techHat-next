'use client';

import { useState, useCallback, useTransition } from 'react';
import { RotateCcw, ArrowLeftRight, DollarSign, TrendingUp, Search, X, RefreshCcw, ScanLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getRecentSalesForReturn } from '@/lib/actions/return-actions';
import RecentSalesTable from './recent-sales-table';
import OrderDetailPanel from './order-detail-panel';
import ReturnSidePanel from './return-side-panel';
import ExchangeSidePanel from './exchange-side-panel';
import { BarcodeScannerModal } from '../pos/barcode-scanner-modal';

type DateRange = 'TODAY' | 'LAST_7' | 'LAST_30' | 'ALL';

interface SummaryData {
  todayReturns: number;
  todayExchanges: number;
  returnValue: number;
  exchangeValue: number;
}

export default function ReturnsDashboardClient({
  summary,
  initialOrders,
}: {
  summary: SummaryData;
  initialOrders: any[];
}) {
  const [orders, setOrders] = useState<any[]>(initialOrders);
  const [search, setSearch] = useState('');
  const [dateRange, setDateRange] = useState<DateRange>('TODAY');
  const [isPending, startTransition] = useTransition();
  const [showScanner, setShowScanner] = useState(false);

  // Panel state
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [returnPanelItem, setReturnPanelItem] = useState<{ order: any; item: any } | null>(null);
  const [exchangePanelItem, setExchangePanelItem] = useState<{ order: any; item: any } | null>(null);

  const refresh = useCallback((s = search, d = dateRange) => {
    startTransition(async () => {
      const res = await getRecentSalesForReturn({ search: s || undefined, dateRange: d });
      if (res.success) setOrders(res.orders);
    });
  }, [search, dateRange]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    refresh(search, dateRange);
  };

  const handleDateChange = (val: DateRange) => {
    setDateRange(val);
    refresh(search, val);
  };

  const handleClearSearch = () => {
    setSearch('');
    refresh('', dateRange);
  };

  const handleScanSuccess = async (code: string) => {
    setSearch(code);
    setShowScanner(false);
    refresh(code, dateRange);
    return { found: true }; // Just return true so scanner modal closes properly
  };

  return (
    <div className="flex flex-col h-full">

      {/* ── Page Header ───────────────────────────────── */}
      <div className="flex items-center justify-between gap-2 mb-4">
        <div>
          <h1 className="text-lg sm:text-2xl font-bold text-gray-900">Return &amp; Exchange</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5 hidden sm:block">Process returns, exchanges, and refunds from sold invoices</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refresh()}
          disabled={isPending}
          className="gap-2 shrink-0"
        >
          <RefreshCcw className={`w-4 h-4 ${isPending ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Refresh</span>
        </Button>
      </div>

      {/* ── Summary Cards ─────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-4">
        <SummaryCard
          icon={<RotateCcw className="w-5 h-5" />}
          label="Today's Returns"
          value={summary.todayReturns.toString()}
          colorClass="bg-blue-50 text-blue-600"
        />
        <SummaryCard
          icon={<ArrowLeftRight className="w-5 h-5" />}
          label="Today's Exchanges"
          value={summary.todayExchanges.toString()}
          colorClass="bg-indigo-50 text-indigo-600"
        />
        <SummaryCard
          icon={<DollarSign className="w-5 h-5" />}
          label="Return Value"
          value={`৳${summary.returnValue.toLocaleString()}`}
          colorClass="bg-red-50 text-red-600"
        />
        <SummaryCard
          icon={<TrendingUp className="w-5 h-5" />}
          label="Exchange Value"
          value={`৳${summary.exchangeValue.toLocaleString()}`}
          colorClass="bg-green-50 text-green-600"
        />
      </div>

      {/* ── Quick Search & Filters ─────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-3 mb-4 space-y-2.5">
        {/* Search row */}
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <Input
              placeholder="Invoice, Phone, Name, SKU, Barcode..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-8 h-10 text-sm w-full"
            />
            {search && (
              <button type="button" onClick={handleClearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-10 w-10 shrink-0 text-gray-600 border-gray-300 hover:bg-indigo-50 hover:text-indigo-600"
            onClick={() => setShowScanner(true)}
            title="Scan Barcode"
          >
            <ScanLine className="w-5 h-5" />
          </Button>
          <Button type="submit" disabled={isPending} className="h-10 px-4 bg-blue-600 hover:bg-blue-700 gap-1.5 shrink-0">
            <Search className="w-4 h-4" />
            <span className="hidden sm:inline">Search</span>
          </Button>
        </form>

        {/* Date filter pills — horizontal scroll on mobile */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider shrink-0">Date:</span>
          {(['TODAY', 'LAST_7', 'LAST_30', 'ALL'] as DateRange[]).map((d) => (
            <button
              key={d}
              onClick={() => handleDateChange(d)}
              className={`py-1 px-2.5 text-[11px] font-semibold rounded-full transition-colors border whitespace-nowrap shrink-0 ${
                dateRange === d
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {d === 'TODAY' ? 'Today' : d === 'LAST_7' ? '7 Days' : d === 'LAST_30' ? '30 Days' : 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* ── Recent Sales Table ─────────────────────────── */}
      <div className="flex-1 min-w-0">
        <RecentSalesTable
          orders={orders}
          isLoading={isPending}
          onViewOrder={(order) => setSelectedOrder(order)}
          onReturnOrder={(order) => setSelectedOrder(order)}
          onExchangeOrder={(order) => setSelectedOrder(order)}
        />
      </div>

      {/* ── Order Detail Panel ────────────────────────── */}
      {selectedOrder && (
        <OrderDetailPanel
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onReturn={(item) => { setReturnPanelItem({ order: selectedOrder, item }); setSelectedOrder(null); }}
          onExchange={(item) => { setExchangePanelItem({ order: selectedOrder, item }); setSelectedOrder(null); }}
        />
      )}

      {/* ── Return Side Panel ─────────────────────────── */}
      {returnPanelItem && (
        <ReturnSidePanel
          order={returnPanelItem.order}
          item={returnPanelItem.item}
          onClose={() => setReturnPanelItem(null)}
          onSuccess={() => { setReturnPanelItem(null); refresh(); }}
        />
      )}

      {/* ── Exchange Side Panel ───────────────────────── */}
      {exchangePanelItem && (
        <ExchangeSidePanel
          order={exchangePanelItem.order}
          item={exchangePanelItem.item}
          onClose={() => setExchangePanelItem(null)}
          onSuccess={() => { setExchangePanelItem(null); refresh(); }}
        />
      )}

      {/* ── Barcode Scanner Modal ─────────────────────── */}
      {showScanner && (
        <BarcodeScannerModal
          isOpen={showScanner}
          onClose={() => setShowScanner(false)}
          onScan={handleScanSuccess}
        />
      )}
    </div>
  );
}

function SummaryCard({ icon, label, value, colorClass }: { icon: React.ReactNode; label: string; value: string; colorClass: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
      <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 ${colorClass}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] sm:text-xs text-gray-500 font-medium truncate">{label}</p>
        <p className="text-base sm:text-xl font-bold text-gray-900 leading-tight">{value}</p>
      </div>
    </div>
  );
}
