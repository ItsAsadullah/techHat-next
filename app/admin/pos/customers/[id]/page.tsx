import { getCustomerLedger } from '@/lib/actions/ledger-actions';
import { getInvoiceSettings } from '@/lib/actions/invoice-settings-actions';
import { CustomerLedgerClient } from './customer-ledger-client';
import { notFound } from 'next/navigation';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function CustomerLedgerPage({ params }: Props) {
  const { id } = await params;
  const [ledgerData, invoiceSettings] = await Promise.all([
    getCustomerLedger(id),
    getInvoiceSettings(),
  ]);
  if (!ledgerData) notFound();
  return <CustomerLedgerClient data={ledgerData} invoiceSettings={invoiceSettings} />;
}
