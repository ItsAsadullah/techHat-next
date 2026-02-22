import { getInvoiceSettings } from '@/lib/actions/invoice-settings-actions';
import { InvoiceSettingsClient } from './invoice-settings-client';

export const dynamic = 'force-dynamic';

export default async function InvoiceSettingsPage() {
  const settings = await getInvoiceSettings();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Invoice Settings</h1>
        <p className="text-sm text-gray-500">Configure your invoice appearance and details.</p>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <InvoiceSettingsClient initialSettings={settings} />
      </div>
    </div>
  );
}
