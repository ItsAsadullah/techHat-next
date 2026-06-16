'use client';

import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { format } from 'date-fns';

interface ExportValuationButtonProps {
  data: any[];
  totalValue: number;
}

export function ExportValuationButton({ data, totalValue }: ExportValuationButtonProps) {
  const handleExport = () => {
    if (!data || data.length === 0) return;

    // Build CSV Headers
    let csv = 'Product Name,Variant,SKU,Physical Qty,Unit MAC (BDT),Total Value (BDT)\n';

    // Build Rows
    data.forEach(item => {
      // Escape strings containing commas
      const name = `"${(item.productName || '').replace(/"/g, '""')}"`;
      const variant = `"${(item.variantName || '').replace(/"/g, '""')}"`;
      const sku = `"${item.sku || ''}"`;
      
      csv += `${name},${variant},${sku},${item.qty},${item.mac},${item.totalValue}\n`;
    });

    // Add Grand Total Row
    csv += `\n,,,,,GRAND TOTAL:\n`;
    csv += `,,,,,${totalValue}\n`;

    // Create Blob and trigger download
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
    <Button onClick={handleExport} variant="default" className="bg-violet-600 hover:bg-violet-700 text-white">
      <Download className="mr-2 h-4 w-4" />
      Export to CSV
    </Button>
  );
}
