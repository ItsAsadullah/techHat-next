import { getAllCustomersReport } from '@/lib/actions/ledger-actions';
import { getInvoiceSettings } from '@/lib/actions/invoice-settings-actions';
import { getReceivablesSummary } from '@/lib/actions/receivables-actions';
import { POSCustomersClient } from '@/app/admin/pos/customers/pos-customers-client';

export default async function CustomersPage() {
  const [customers, invoiceSettings, receivablesRes] = await Promise.all([
    getAllCustomersReport(),
    getInvoiceSettings(),
    getReceivablesSummary(),
  ]);
  
  const receivablesSummary = receivablesRes.success ? receivablesRes.data : null;

  return <POSCustomersClient customers={customers} invoiceSettings={invoiceSettings} receivablesSummary={receivablesSummary} />;
}
