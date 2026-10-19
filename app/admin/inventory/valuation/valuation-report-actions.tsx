'use client';

import { Button } from '@/components/ui/button';
import { openInventoryPDFReport } from '@/components/admin/inventory/inventory-pdf-report';
import { FileText, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface ValuationItem {
  productId: string;
  variantId?: string | null;
  sku: string | null;
  name: string;
  categoryName?: string | null;
  stock: number;
  unitCost: number;
  totalValue: number;
}

export function ValuationReportActions({ items }: { items: ValuationItem[] }) {
  const handlePDF = () => {
    if (items.length === 0) {
      toast.error('রিপোর্ট তৈরি করার মতো কোনো ভ্যালুয়েশন ডেটা নেই।');
      return;
    }

    openInventoryPDFReport({
      title: 'ইনভেন্টরি ভ্যালুয়েশন ও স্টক মিলকরণ রিপোর্ট (MAC)',
      subtitle: 'Moving Average Cost (MAC) অনুযায়ী বর্তমান স্টকের আর্থিক মূল্যায়ন ও অডিট শিট',
      defaultMode: 'reconciliation',
      filterSummary: {
        warehouse: 'সকল সক্রিয় ওয়্যারহাউস',
      },
      summary: {
        totalIn: items.reduce((s, i) => s + i.stock, 0),
        totalOut: 0,
        totalValue: items.reduce((s, i) => s + i.totalValue, 0),
        totalSkus: items.length,
        totalPhysicalUnits: items.reduce((s, i) => s + i.stock, 0),
      },
      reconciliationItems: items.map((item) => ({
        productId: item.productId,
        variantId: item.variantId || null,
        productName: item.name,
        variantName: null,
        sku: item.sku || 'N/A',
        categoryName: item.categoryName || 'Uncategorized',
        warehouseName: 'সকল ওয়্যারহাউস',
        warehouseCode: 'ALL',
        openingStock: 0,
        totalIn: item.stock,
        totalOut: 0,
        closingStock: item.stock,
        unitCost: item.unitCost,
        totalValue: item.totalValue,
        physicalCount: null,
      })),
    });
  };

  const handleCSV = () => {
    if (items.length === 0) {
      toast.error('এক্সপোর্ট করার মতো কোনো ডেটা নেই।');
      return;
    }

    const headers = [
      'SL',
      'SKU',
      'Product / Variant Name',
      'Category',
      'Physical Stock',
      'Unit Cost (MAC BDT)',
      'Total Asset Value (BDT)',
    ];

    const rows = items.map((item, idx) => [
      idx + 1,
      `"${(item.sku || 'N/A').replace(/"/g, '""')}"`,
      `"${item.name.replace(/"/g, '""')}"`,
      `"${(item.categoryName || 'Uncategorized').replace(/"/g, '""')}"`,
      item.stock,
      item.unitCost.toFixed(2),
      item.totalValue.toFixed(2),
    ]);

    const csvString = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `inventory-valuation-${format(new Date(), 'yyyy-MM-dd-HHmm')}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('ভ্যালুয়েশন CSV রিপোর্ট ডাউনলোড হয়েছে!');
  };

  return (
    <div className="flex flex-wrap items-center gap-2 shrink-0">
      <Button
        size="sm"
        onClick={handlePDF}
        className="gap-2 bg-slate-900 hover:bg-slate-800 text-white"
      >
        <FileText className="w-4 h-4" />
        ভ্যালুয়েশন PDF রিপোর্ট
      </Button>
      <Button size="sm" variant="outline" onClick={handleCSV} className="gap-2">
        <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
        Export CSV
      </Button>
    </div>
  );
}
