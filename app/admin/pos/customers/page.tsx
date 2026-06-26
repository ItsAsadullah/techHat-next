import { getAllCustomersReport } from '@/lib/actions/ledger-actions';
import { getInvoiceSettings } from '@/lib/actions/invoice-settings-actions';
import { getReceivablesSummary, getReceivablesAging } from '@/lib/actions/receivables-actions';
import { POSCustomersClient } from './pos-customers-client';

export default async function POSCustomersPage() {
  const [customers, invoiceSettings, receivablesRes, agingRes] = await Promise.all([
    getAllCustomersReport(),
    getInvoiceSettings(),
    getReceivablesSummary(),
    getReceivablesAging(),
  ]);

  const receivablesSummary = receivablesRes.success ? receivablesRes.data : null;
  const agingData = agingRes.success ? agingRes.data : [];

  return <POSCustomersClient 
            customers={customers} 
            invoiceSettings={invoiceSettings} 
            receivablesSummary={receivablesSummary} 
            agingData={agingData} 
          />;
}
