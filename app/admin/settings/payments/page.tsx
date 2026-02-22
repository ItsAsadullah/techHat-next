import { getPaymentMethodSettings } from '@/lib/actions/invoice-settings-actions';
import { PaymentSettingsClient } from './payments-client';

export default async function PaymentSettingsPage() {
  const initial = await getPaymentMethodSettings();
  return <PaymentSettingsClient initial={initial} />;
}