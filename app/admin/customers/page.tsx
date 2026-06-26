import { getAllCustomersReport } from '@/lib/actions/ledger-actions';
import { getInvoiceSettings } from '@/lib/actions/invoice-settings-actions';
import { POSCustomersClient } from '@/app/admin/pos/customers/pos-customers-client';

export default async function CustomersPage() {
  const [customers, invoiceSettings] = await Promise.all([
    getAllCustomersReport(),
    getInvoiceSettings(),
  ]);
  
  return <POSCustomersClient customers={customers} invoiceSettings={invoiceSettings} />;
}
