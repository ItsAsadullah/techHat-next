import { getPOSCategories, getDailySalesSummary } from '@/lib/actions/pos-actions';
import { getInvoiceSettings } from '@/lib/actions/invoice-settings-actions';
import { POSClient } from './pos-client';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'POS - TechHat',
  description: 'Point of Sale Terminal',
};

export default async function POSPage() {
  const [categories, dailySummary, invoiceSettings] = await Promise.all([
    getPOSCategories(),
    getDailySalesSummary(),
    getInvoiceSettings(),
  ]);

  return (
    <POSClient
      categories={categories}
      initialDailySummary={dailySummary}
      invoiceSettings={invoiceSettings}
    />
  );
}
