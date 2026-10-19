'use client';

import { Button } from '@/components/ui/button';
import { Download, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { openInventoryPDFReport } from '@/components/admin/inventory/inventory-pdf-report';
import { toast } from 'sonner';

interface ExportValuationButtonProps {
  data: any[];
  totalValue: number;
}

export function ExportValuationButton({ data, totalValue }: ExportValuationButtonProps) {
  const handlePDF = () => {
    if (!data || data.length === 0) {
      toast.error('রিপোর্ট তৈরি করার মতো কোনো ডেটা নেই।');
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
        totalIn: data.reduce((s, i) => s + (Number(i.qty) || 0), 0),
        totalOut: 0,
        totalValue: totalValue || 0,
        totalSkus: data.length,
        totalPhysicalUnits: data.reduce((s, i) => s + (Number(i.qty) || 0), 0),
      },
      reconciliationItems: data.map((item) => ({
        productId: String(item.id),
        variantId: null,
        productName: item.productName || 'Unknown Product',
        variantName: item.variantName || null,
        sku: item.sku || 'N/A',
        categoryName: 'Inventory',
        warehouseName: 'সকল ওয়্যারহাউস',
        warehouseCode: 'ALL',
        openingStock: 0,
        totalIn: Number(item.qty) || 0,
        totalOut: 0,
        closingStock: Number(item.qty) || 0,
        unitCost: Number(item.mac) || 0,
        totalValue: Number(item.totalValue) || 0,
        physicalCount: null,
      })),
    });
  };

  const handleExport = () => {
    if (!data || data.length === 0) return;

    let csv = '\uFEFFProduct Name,Variant,SKU,Physical Qty,Unit MAC (BDT),Total Value (BDT)\n';

    data.forEach((item) => {
      const name = `"${(item.productName || '').replace(/"/g, '""')}"`;
      const variant = `"${(item.variantName || '').replace(/"/g, '""')}"`;
      const sku = `"${item.sku || ''}"`;

      csv += `${name},${variant},${sku},${item.qty},${item.mac},${item.totalValue}\n`;
    });

    csv += `\n,,,,,GRAND TOTAL:\n`;
    csv += `,,,,,${totalValue}\n`;

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `inventory_valuation_${format(new Date(), 'yyyyMMdd_HHmm')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex items-center gap-2">
      <Button onClick={handlePDF} variant="default" className="bg-slate-900 hover:bg-slate-800 text-white">
        <FileText className="mr-2 h-4 w-4" />
        PDF রিপোর্ট প্রিন্ট
      </Button>
      <Button onClick={handleExport} variant="default" className="bg-violet-600 hover:bg-violet-700 text-white">
        <Download className="mr-2 h-4 w-4" />
        Export to CSV
      </Button>
    </div>
  );
}
