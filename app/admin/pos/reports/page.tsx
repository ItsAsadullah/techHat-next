import { getPOSSalesReport } from '@/lib/actions/pos-customer-actions';
import { getDailySalesSummary } from '@/lib/actions/pos-actions';
import { getInvoiceSettings } from '@/lib/actions/invoice-settings-actions';
import { POSSalesReport } from './pos-sales-report-client';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'POS Sales Report - TechHat',
  description: 'Point of Sale Sales Analytics',
};

export default async function POSSalesReportPage() {
  const [salesData, dailySummary, invoiceSettings] = await Promise.all([
    getPOSSalesReport(),
    getDailySalesSummary(),
    getInvoiceSettings(),
  ]);

  return (
    <POSSalesReport
      initialData={salesData as any}
      dailySummary={dailySummary as any}
      invoiceSettings={invoiceSettings}
    />
  );
}
