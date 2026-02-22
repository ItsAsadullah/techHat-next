import { getPaymentHistory } from '@/lib/actions/ledger-actions';
import { getInvoiceSettings } from '@/lib/actions/invoice-settings-actions';
import { prisma } from '@/lib/prisma';
import { PaymentHistoryClient } from './payment-history-client';

export const dynamic = 'force-dynamic';

export default async function PaymentHistoryPage() {
  const [initialData, invoiceSettings, customers] = await Promise.all([
    getPaymentHistory(),
    getInvoiceSettings(),
    prisma.pOSCustomer.findMany({
      select: { id: true, name: true, phone: true },
      orderBy: { name: 'asc' },
    }),
  ]);

  return (
    <div className="p-6 min-h-screen bg-gray-50/50">
      <PaymentHistoryClient
        initialData={initialData as any}
        customers={customers.map((c) => ({
          id: c.id,
          name: c.name,
          phone: c.phone ?? '',
        }))}
        invoiceSettings={invoiceSettings}
      />
    </div>
  );
}
