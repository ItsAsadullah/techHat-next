'use client';

import React, { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  ReconciliationItemRow,
  ReconciliationSummary,
  applyPhysicalCountReconciliation,
  syncCatalogStockWithLedger,
} from '@/lib/actions/inventory-reconciliation-actions';
import { openInventoryPDFReport } from '@/components/admin/inventory/inventory-pdf-report';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ClipboardCheck,
  Download,
  FileSpreadsheet,
  FileText,
  Search,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Package,
  Scale,
  ArrowUpDown,
  Sparkles,
  RotateCcw,
  ShieldAlert,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Props {
  initialRows: ReconciliationItemRow[];
  summary: ReconciliationSummary;
  warehouses: { id: string; name: string; code: string; isDefault: boolean }[];
  categories: { id: string; name: string }[];
  selectedWarehouseId: string;
}

type StatusFilter =
  | 'ALL'
  | 'VARIANCE'
  | 'DB_DRIFT'
  | 'IN_STOCK'
  | 'LOW_STOCK'
  | 'OUT_OF_STOCK';

export function ReconciliationClient({
  initialRows,
  summary,
  warehouses,
  categories,
  selectedWarehouseId,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [warehouseId, setWarehouseId] = useState<string>(selectedWarehouseId || 'ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [search, setSearch] = useState<string>('');
  const [auditNote, setAuditNote] = useState<string>('');

  // Map of row.key -> physical count number (or empty string)
  const [physicalCounts, setPhysicalCounts] = useState<Record<string, string>>({});
  const [isSyncingDB, setIsSyncingDB] = useState(false);
  const [isPostingCount, setIsPostingCount] = useState(false);

  const handleWarehouseChange = (val: string) => {
    setWarehouseId(val);
    startTransition(() => {
      const params = new URLSearchParams();
      if (val && val !== 'ALL') params.set('warehouseId', val);
      router.push(`/admin/inventory/reconciliation?${params.toString()}`);
    });
  };

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return initialRows.filter((row) => {
      if (categoryFilter !== 'ALL' && row.categoryName !== categoryFilter) {
        return false;
      }

      if (q) {
        const matchesSearch =
          row.productName.toLowerCase().includes(q) ||
          (row.variantName && row.variantName.toLowerCase().includes(q)) ||
          row.sku.toLowerCase().includes(q) ||
          row.categoryName.toLowerCase().includes(q);
        if (!matchesSearch) return false;
      }

      const rawCount = physicalCounts[row.key];
      const hasCount = rawCount !== undefined && rawCount.trim() !== '';
      const parsedCount = hasCount ? parseInt(rawCount, 10) : null;
      const variance =
        parsedCount !== null && !Number.isNaN(parsedCount)
          ? parsedCount - row.ledgerStock
          : 0;

      if (statusFilter === 'VARIANCE') return hasCount && variance !== 0;
      if (statusFilter === 'DB_DRIFT') return row.dbDrift !== 0;
      if (statusFilter === 'IN_STOCK') return row.ledgerStock > 0;
      if (statusFilter === 'LOW_STOCK')
        return row.ledgerStock > 0 && row.ledgerStock <= row.minStock;
      if (statusFilter === 'OUT_OF_STOCK') return row.ledgerStock <= 0;

      return true;
    });
  }, [initialRows, categoryFilter, statusFilter, search, physicalCounts]);

  // Calculate active physical audit metrics
  const auditMetrics = useMemo(() => {
    let countedItems = 0;
    let varianceItems = 0;
    let surplusUnits = 0;
    let shortageUnits = 0;
    let netValueImpact = 0;

    for (const row of initialRows) {
      const raw = physicalCounts[row.key];
      if (raw === undefined || raw.trim() === '') continue;
      const num = parseInt(raw, 10);
      if (Number.isNaN(num) || num < 0) continue;

      countedItems++;
      const diff = num - row.ledgerStock;
      if (diff !== 0) {
        varianceItems++;
        if (diff > 0) surplusUnits += diff;
        else shortageUnits += Math.abs(diff);
        netValueImpact += diff * row.unitCost;
      }
    }

    return {
      countedItems,
      varianceItems,
      surplusUnits,
      shortageUnits,
      netValueImpact,
    };
  }, [initialRows, physicalCounts]);

  const handlePhysicalInputChange = (key: string, val: string) => {
    if (val === '') {
      setPhysicalCounts((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      return;
    }
    const clean = val.replace(/[^0-9]/g, '');
    setPhysicalCounts((prev) => ({ ...prev, [key]: clean }));
  };

  const handlePrefillSystemStock = () => {
    const next: Record<string, string> = { ...physicalCounts };
    for (const row of filteredRows) {
      if (next[row.key] === undefined || next[row.key] === '') {
        next[row.key] = String(Math.max(0, row.ledgerStock));
      }
    }
    setPhysicalCounts(next);
    toast.success(`${filteredRows.length}টি পণ্যে সিস্টেম স্টক সংখ্যা বসানো হয়েছে।`);
  };

  const handleClearCounts = () => {
    setPhysicalCounts({});
    toast.info('সকল বাস্তব স্টক গননা রিসেট করা হয়েছে।');
  };

  const handleSmartSyncDB = async (mode: 'smart_reconcile' | 'sync_from_ledger') => {
    setIsSyncingDB(true);
    try {
      const targetWh =
        warehouseId && warehouseId !== 'ALL'
          ? warehouseId
          : warehouses.find((w) => w.isDefault)?.id || warehouses[0]?.id;

      const res = await syncCatalogStockWithLedger({
        mode,
        warehouseId: targetWh,
      });

      if (!res.success) {
        toast.error(res.error || 'স্টক সিঙ্ক করতে সমস্যা হয়েছে।');
        return;
      }

      toast.success(
        `সমন্বয় সফল হয়েছে! (${res.initializedLedgerCount || 0}টি প্রারম্ভিক লেজার এন্ট্রি ও ${res.updatedCatalogCount || 0}টি ক্যাটালগ স্টক আপডেট হয়েছে)`
      );
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || 'স্টক সিঙ্ক ব্যর্থ হয়েছে।');
    } finally {
      setIsSyncingDB(false);
    }
  };

  const handlePostPhysicalReconciliation = async () => {
    if (!warehouseId || warehouseId === 'ALL') {
      toast.error('বাস্তব স্টক সমন্বয় পোস্ট করার জন্য উপরে একটি নির্দিষ্ট ওয়্যারহাউস নির্বাচন করুন।');
      return;
    }

    const itemsToAdjust: {
      productId: string;
      variantId?: string | null;
      physicalQty: number;
    }[] = [];

    for (const row of initialRows) {
      const raw = physicalCounts[row.key];
      if (raw === undefined || raw.trim() === '') continue;
      const num = parseInt(raw, 10);
      if (Number.isNaN(num) || num < 0) continue;
      if (num !== row.ledgerStock) {
        itemsToAdjust.push({
          productId: row.productId,
          variantId: row.variantId,
          physicalQty: num,
        });
      }
    }

    if (itemsToAdjust.length === 0) {
      toast.error('কোনো পণ্যে সিস্টেম স্টক ও বাস্তব স্টকের পার্থক্য পাওয়া যায়নি।');
      return;
    }

    setIsPostingCount(true);
    try {
      const res = await applyPhysicalCountReconciliation({
        warehouseId,
        note:
          auditNote.trim() ||
          `ফিজিক্যাল স্টক অডিট ও হিসাব মিলকরণ (${format(new Date(), 'dd MMM yyyy')})`,
        items: itemsToAdjust,
      });

      if (!res.success) {
        toast.error(res.error || 'স্টক সমন্বয় পোস্ট করতে সমস্যা হয়েছে।');
        return;
      }

      toast.success(
        `${res.adjustedCount}টি পণ্যের স্টক সফলভাবে সমন্বয় করা হয়েছে (রেফারেন্স: ${res.referenceNo})!`
      );
      setPhysicalCounts({});
      setAuditNote('');
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || 'স্টক সমন্বয় ব্যর্থ হয়েছে।');
    } finally {
      setIsPostingCount(false);
    }
  };

  const handleExportPDF = (withPhysicalBlank: boolean = false) => {
    if (filteredRows.length === 0) {
      toast.error('রিপোর্ট তৈরি করার মতো কোনো পণ্য পাওয়া যায়নি।');
      return;
    }

    const activeWh = warehouses.find((w) => w.id === warehouseId);

    openInventoryPDFReport({
      title: 'ইনভেন্টরি স্টক মিলকরণ ও ফিজিক্যাল অডিট রিপোর্ট',
      subtitle:
        auditMetrics.countedItems > 0 && !withPhysicalBlank
          ? `বাস্তব স্টক গননা ও ভেরিয়েন্স বিবরণী (${auditMetrics.countedItems}টি পণ্য গননা করা হয়েছে)`
          : 'সিস্টেম লেজার স্টক বনাম বাস্তব স্টক গননা শিট (Stock Reconciliation Sheet)',
      defaultMode: 'reconciliation',
      filterSummary: {
        warehouse: activeWh
          ? `${activeWh.name} (${activeWh.code})`
          : 'সকল ওয়্যারহাউস (সম্মিলিত)',
        search: search || undefined,
      },
      summary: {
        totalIn: filteredRows.reduce((s, r) => s + r.totalIn, 0),
        totalOut: filteredRows.reduce((s, r) => s + r.totalOut, 0),
        totalValue: filteredRows.reduce((s, r) => s + r.totalValue, 0),
        totalSkus: filteredRows.length,
        totalPhysicalUnits: filteredRows.reduce((s, r) => s + r.ledgerStock, 0),
      },
      reconciliationItems: filteredRows.map((row) => {
        const raw = physicalCounts[row.key];
        const parsed =
          !withPhysicalBlank && raw !== undefined && raw.trim() !== ''
            ? parseInt(raw, 10)
            : null;
        return {
          key: row.key,
          productId: row.productId,
          variantId: row.variantId,
          productName: row.productName,
          variantName: row.variantName,
          sku: row.sku,
          categoryName: row.categoryName,
          warehouseName: row.warehouseName,
          warehouseCode: row.warehouseCode,
          openingStock: 0,
          totalIn: row.totalIn,
          totalOut: row.totalOut,
          closingStock: row.ledgerStock,
          catalogStock: row.catalogStock,
          unitCost: row.unitCost,
          totalValue: row.totalValue,
          physicalCount: parsed !== null && !Number.isNaN(parsed) ? parsed : null,
        };
      }),
    });
  };

  const handleExportCSV = () => {
    if (filteredRows.length === 0) {
      toast.error('এক্সপোর্ট করার মতো কোনো ডেটা নেই।');
      return;
    }

    const headers = [
      'SL',
      'Product Name',
      'Variant',
      'SKU',
      'Category',
      'Warehouse',
      'Total In',
      'Total Out',
      'System Ledger Stock',
      'Catalog DB Stock',
      'DB vs Ledger Drift',
      'Physical Count',
      'Physical Variance',
      'Unit Cost (BDT)',
      'Total Value (BDT)',
    ];

    const csvRows = filteredRows.map((row, idx) => {
      const raw = physicalCounts[row.key];
      const hasCount = raw !== undefined && raw.trim() !== '';
      const physicalVal = hasCount ? parseInt(raw, 10) : '';
      const varianceVal =
        typeof physicalVal === 'number' && !Number.isNaN(physicalVal)
          ? physicalVal - row.ledgerStock
          : '';

      return [
        idx + 1,
        `"${row.productName.replace(/"/g, '""')}"`,
        `"${(row.variantName || 'Standard').replace(/"/g, '""')}"`,
        `"${row.sku.replace(/"/g, '""')}"`,
        `"${row.categoryName.replace(/"/g, '""')}"`,
        `"${row.warehouseName.replace(/"/g, '""')}"`,
        row.totalIn,
        row.totalOut,
        row.ledgerStock,
        row.catalogStock,
        row.dbDrift,
        physicalVal,
        varianceVal,
        row.unitCost.toFixed(2),
        row.totalValue.toFixed(2),
      ];
    });

    const csvString =
      '\uFEFF' + [headers.join(','), ...csvRows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `inventory-reconciliation-${format(new Date(), 'yyyy-MM-dd-HHmm')}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('স্টক মিলকরণ CSV রিপোর্ট ডাউনলোড হয়েছে!');
  };

  return (
    <div className="space-y-6">
      {/* Top Action Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <ClipboardCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                ইনভেন্টরি হিসাব মেলানো (Stock Reconciliation & Audit)
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                সিস্টেম লেজার স্টক, ক্যাটালগ স্টক এবং গোডাউনের বাস্তব স্টক গননা এক জায়গায় মিলিয়ে নিন ও PDF অডিট শিট প্রিন্ট করুন।
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            onClick={() => handleExportPDF(true)}
            className="gap-2 border-indigo-200 bg-indigo-50/60 text-indigo-700 hover:bg-indigo-100"
          >
            <FileText className="w-4 h-4" />
            ফাঁকা অডিট শিট (PDF)
          </Button>
          <Button
            onClick={() => handleExportPDF(false)}
            className="gap-2 bg-slate-900 hover:bg-slate-800 text-white"
          >
            <FileText className="w-4 h-4" />
            স্টক মিলকরণ PDF রিপোর্ট
          </Button>
          <Button variant="outline" onClick={handleExportCSV} className="gap-2">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            Excel / CSV
          </Button>
        </div>
      </div>

      {/* Database Catalog vs StockLedger Drift Alert Banner */}
      {summary.driftItemsCount > 0 && (
        <div className="bg-amber-50/90 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800/70 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 mt-0.5">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                ক্যাটালগ স্টক এবং স্টক লেজারের মধ্যে {summary.driftItemsCount}টি পণ্যে অমিল (Drift) পাওয়া গেছে!
              </h3>
              <p className="text-xs text-amber-800/90 dark:text-amber-300/80 mt-0.5 leading-relaxed">
                {summary.untrackedCatalogCount > 0
                  ? `এর মধ্যে ${summary.untrackedCatalogCount}টি পণ্যে প্রোডাক্ট টেবিলে স্টক আছে কিন্তু কোনো স্টক লেজার এন্ট্রি নেই। "স্মার্ট অটো-মিলকরণ" বাটনে ক্লিক করলে লেজার-বিহীন পণ্যের জন্য প্রারম্ভিক লেজার তৈরি হবে এবং বাকি পণ্যের স্টক লেজার অনুযায়ী ঠিক হয়ে যাবে।`
                  : 'কিছু পণ্যের প্রোডাক্ট টেবিলের ক্যাশড স্টক এবং স্টক লেজারের যোগফল আলাদা। এক ক্লিকে দুটি হিসাব একদম সমান করে নিন।'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                setStatusFilter(statusFilter === 'DB_DRIFT' ? 'ALL' : 'DB_DRIFT')
              }
              className="border-amber-400 bg-white text-amber-900 hover:bg-amber-100 text-xs"
            >
              {statusFilter === 'DB_DRIFT' ? 'সকল পণ্য দেখুন' : 'অমিল থাকা পণ্য দেখুন'}
            </Button>
            <Button
              size="sm"
              disabled={isSyncingDB}
              onClick={() => handleSmartSyncDB('smart_reconcile')}
              className="bg-amber-600 hover:bg-amber-700 text-white gap-1.5 text-xs"
            >
              {isSyncingDB ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
              স্মার্ট অটো-মিলকরণ করুন
            </Button>
          </div>
        </div>
      )}

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              মোট পণ্য / ভেরিয়েন্ট
            </span>
            <Package className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1.5">
            {filteredRows.length.toLocaleString('en-IN')}{' '}
            <span className="text-xs font-normal text-slate-500">আইটেম</span>
          </div>
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
            <span className="text-amber-600 font-medium">
              লো-স্টক: {summary.lowStockCount}
            </span>
            <span>•</span>
            <span className="text-rose-600 font-medium">
              স্টক-আউট: {summary.outOfStockCount}
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              সিস্টেম লেজার স্টক
            </span>
            <Scale className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1.5">
            {filteredRows
              .reduce((sum, r) => sum + r.ledgerStock, 0)
              .toLocaleString('en-IN')}{' '}
            <span className="text-xs font-normal text-slate-500">ইউনিট</span>
          </div>
          <div className="text-xs text-slate-500 mt-1">
            ক্যাটালগ স্টক: {summary.totalCatalogUnits.toLocaleString('en-IN')} ইউনিট
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              মোট স্টক ভ্যালুয়েশন
            </span>
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">
              ৳ BDT
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1.5">
            ৳
            {filteredRows
              .reduce((sum, r) => sum + r.totalValue, 0)
              .toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            গড় ক্রয়মূল্য (MAC) অনুযায়ী হিসাবকৃত
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              ফিজিক্যাল গননা স্ট্যাটাস
            </span>
            {auditMetrics.varianceItems > 0 ? (
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            )}
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1.5">
            {auditMetrics.countedItems} / {initialRows.length}{' '}
            <span className="text-xs font-normal text-slate-500">গননা হয়েছে</span>
          </div>
          <div className="text-xs mt-1">
            {auditMetrics.varianceItems > 0 ? (
              <span className="text-amber-600 font-semibold">
                {auditMetrics.varianceItems}টি পণ্যে গরমিল (+{auditMetrics.surplusUnits} / -
                {auditMetrics.shortageUnits})
              </span>
            ) : (
              <span className="text-emerald-600 font-medium">
                {summary.driftItemsCount === 0
                  ? 'সিস্টেম ও ক্যাটালগ ১০০% মিল আছে'
                  : `ক্যাটালগ অমিল: ${summary.driftItemsCount}টি`}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Filters & Physical Audit Quick Actions Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
          {/* Search */}
          <div className="lg:col-span-4 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="পণ্যের নাম, SKU বা ভেরিয়েন্ট দিয়ে খুঁজুন..."
              className="pl-9"
            />
          </div>

          {/* Warehouse Selector */}
          <div className="lg:col-span-3">
            <Select value={warehouseId} onValueChange={handleWarehouseChange}>
              <SelectTrigger>
                <SelectValue placeholder="ওয়্যারহাউস নির্বাচন করুন" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">সকল ওয়্যারহাউস (সম্মিলিত)</SelectItem>
                {warehouses.map((w) => (
                  <SelectItem key={w.id} value={w.id}>
                    {w.name} ({w.code}){w.isDefault ? ' ★' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Category Selector */}
          <div className="lg:col-span-2">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="সকল ক্যাটাগরি" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">সকল ক্যাটাগরি</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.name}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status Selector */}
          <div className="lg:col-span-3">
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as StatusFilter)}
            >
              <SelectTrigger>
                <SelectValue placeholder="স্টক স্ট্যাটাস" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">সকল পণ্য ({initialRows.length})</SelectItem>
                <SelectItem value="IN_STOCK">স্টকে থাকা পণ্য (Stock &gt; 0)</SelectItem>
                <SelectItem value="VARIANCE">
                  শুধু গননায় গরমিল থাকা পণ্য ({auditMetrics.varianceItems})
                </SelectItem>
                <SelectItem value="DB_DRIFT">
                  ক্যাটালগ ও লেজার অমিল ({summary.driftItemsCount})
                </SelectItem>
                <SelectItem value="LOW_STOCK">
                  লো-স্টক পণ্য ({summary.lowStockCount})
                </SelectItem>
                <SelectItem value="OUT_OF_STOCK">
                  স্টক-আউট পণ্য ({summary.outOfStockCount})
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Physical Count Helper Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePrefillSystemStock}
              className="text-xs gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              সকল পণ্যে সিস্টেম স্টক বসিয়ে দিন
            </Button>
            {auditMetrics.countedItems > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClearCounts}
                className="text-xs gap-1.5 text-slate-600"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                গননা রিসেট করুন
              </Button>
            )}
          </div>

          {/* Active Variance Adjustment Action */}
          {auditMetrics.varianceItems > 0 && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-indigo-50/90 dark:bg-indigo-950/40 px-3 py-2 rounded-xl border border-indigo-200 dark:border-indigo-800">
              <div className="text-xs text-indigo-950 dark:text-indigo-200 pr-2">
                <span className="font-bold">{auditMetrics.varianceItems}টি পণ্যে পার্থক্য</span>{' '}
                (নেট ভ্যালু:{' '}
                <span
                  className={
                    auditMetrics.netValueImpact >= 0
                      ? 'text-emerald-700 font-bold'
                      : 'text-rose-700 font-bold'
                  }
                >
                  {auditMetrics.netValueImpact >= 0 ? '+' : '-'}৳
                  {Math.abs(auditMetrics.netValueImpact).toLocaleString('en-IN', {
                    maximumFractionDigits: 2,
                  })}
                </span>
                )
              </div>
              <Input
                value={auditNote}
                onChange={(e) => setAuditNote(e.target.value)}
                placeholder="অডিট নোট / কারণ (ঐচ্ছিক)..."
                className="h-8 text-xs bg-white w-full sm:w-52"
              />
              <Button
                size="sm"
                disabled={isPostingCount || warehouseId === 'ALL'}
                onClick={handlePostPhysicalReconciliation}
                className="h-8 bg-indigo-600 hover:bg-indigo-700 text-white text-xs gap-1.5 shrink-0"
              >
                {isPostingCount ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <ClipboardCheck className="w-3.5 h-3.5" />
                )}
                বাস্তব স্টক অনুযায়ী সমন্বয় পোস্ট করুন
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Main Reconciliation Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50/90 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 text-xs uppercase font-bold">
              <tr>
                <th className="py-3.5 px-4 w-10 text-center">#</th>
                <th className="py-3.5 px-4">পণ্যের নাম ও ভেরিয়েন্ট</th>
                <th className="py-3.5 px-3">SKU ও ক্যাটাগরি</th>
                <th className="py-3.5 px-3 text-right">মোট ইন (+)</th>
                <th className="py-3.5 px-3 text-right">মোট আউট (-)</th>
                <th className="py-3.5 px-3 text-right bg-indigo-50/50 dark:bg-indigo-950/20">
                  লেজার স্টক
                </th>
                <th className="py-3.5 px-3 text-right">ক্যাটালগ স্টক</th>
                <th className="py-3.5 px-3 text-right">একক ক্রয়মূল্য</th>
                <th className="py-3.5 px-3 text-right">মোট ভ্যালু (৳)</th>
                <th className="py-3.5 px-4 text-center bg-amber-50/60 dark:bg-amber-950/20 w-40">
                  বাস্তব স্টক গননা
                </th>
                <th className="py-3.5 px-4 text-right w-32">পার্থক্য (Variance)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-500">
                    কোনো পণ্য পাওয়া যায়নি। ফিল্টার পরিবর্তন করে আবার চেষ্টা করুন।
                  </td>
                </tr>
              ) : (
                filteredRows.map((row, idx) => {
                  const rawCount = physicalCounts[row.key];
                  const hasCount = rawCount !== undefined && rawCount.trim() !== '';
                  const parsedCount = hasCount ? parseInt(rawCount, 10) : null;
                  const variance =
                    parsedCount !== null && !Number.isNaN(parsedCount)
                      ? parsedCount - row.ledgerStock
                      : null;

                  return (
                    <tr
                      key={row.key}
                      className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                        variance !== null && variance !== 0
                          ? 'bg-amber-50/30 dark:bg-amber-950/10'
                          : ''
                      }`}
                    >
                      <td className="py-3 px-4 text-center text-xs text-slate-400 font-medium">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 dark:text-white leading-snug">
                          {row.productName}
                        </div>
                        {row.variantName && (
                          <div className="text-xs text-indigo-600 dark:text-indigo-400 font-medium mt-0.5">
                            ভেরিয়েন্ট: {row.variantName}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-mono text-xs text-slate-700 dark:text-slate-300">
                          {row.sku}
                        </div>
                        <div className="text-[11px] text-slate-500">{row.categoryName}</div>
                      </td>
                      <td className="py-3 px-3 text-right font-medium text-emerald-600">
                        +{row.totalIn}
                      </td>
                      <td className="py-3 px-3 text-right font-medium text-rose-600">
                        -{row.totalOut}
                      </td>
                      <td className="py-3 px-3 text-right bg-indigo-50/40 dark:bg-indigo-950/20">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold ${
                            row.ledgerStock <= 0
                              ? 'bg-rose-100 text-rose-700'
                              : row.ledgerStock <= row.minStock
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-indigo-100 text-indigo-800'
                          }`}
                        >
                          {row.ledgerStock}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            {row.catalogStock}
                          </span>
                          {row.dbDrift !== 0 && (
                            <Badge
                              variant="outline"
                              className="text-[10px] px-1.5 py-0 border-amber-300 bg-amber-50 text-amber-800"
                              title="ক্যাটালগ স্টক এবং গ্লোবাল লেজার স্টকের মধ্যে পার্থক্য"
                            >
                              {row.dbDrift > 0 ? `+${row.dbDrift}` : row.dbDrift}
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right text-slate-600 dark:text-slate-400 font-mono text-xs">
                        ৳
                        {row.unitCost.toLocaleString('en-IN', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="py-3 px-3 text-right font-semibold text-slate-900 dark:text-white font-mono text-xs">
                        ৳
                        {row.totalValue.toLocaleString('en-IN', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="py-3 px-4 bg-amber-50/40 dark:bg-amber-950/10">
                        <Input
                          type="number"
                          min={0}
                          value={rawCount ?? ''}
                          onChange={(e) =>
                            handlePhysicalInputChange(row.key, e.target.value)
                          }
                          placeholder={`${row.ledgerStock}`}
                          className="h-8 text-center font-bold bg-white dark:bg-slate-900 border-slate-300 focus:border-indigo-500"
                        />
                      </td>
                      <td className="py-3 px-4 text-right">
                        {variance === null ? (
                          <span className="text-xs text-slate-400">—</span>
                        ) : variance === 0 ? (
                          <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-0">
                            ✓ মিল আছে (0)
                          </Badge>
                        ) : variance > 0 ? (
                          <div>
                            <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-0">
                              +{variance} বেশি
                            </Badge>
                            <div className="text-[10px] text-blue-700 font-mono mt-0.5">
                              +৳{(variance * row.unitCost).toLocaleString('en-IN')}
                            </div>
                          </div>
                        ) : (
                          <div>
                            <Badge className="bg-rose-100 text-rose-800 hover:bg-rose-100 border-0">
                              {variance} কম
                            </Badge>
                            <div className="text-[10px] text-rose-700 font-mono mt-0.5">
                              -৳{(Math.abs(variance) * row.unitCost).toLocaleString('en-IN')}
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
