import { getAllCustomersReport } from '@/lib/actions/ledger-actions';
import { getInvoiceSettings } from '@/lib/actions/invoice-settings-actions';
import { POSCustomersClient } from './pos-customers-client';

export default async function POSCustomersPage() {
  const [customers, invoiceSettings] = await Promise.all([
    getAllCustomersReport(),
    getInvoiceSettings(),
  ]);
  return <POSCustomersClient customers={customers} invoiceSettings={invoiceSettings} />;
}
