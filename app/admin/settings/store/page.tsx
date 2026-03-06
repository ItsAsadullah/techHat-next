import { getStoreSettings, getShippingSettings } from '@/lib/actions/invoice-settings-actions';
import { StoreSettingsClient } from './store-client';

export default async function StoreSettingsPage() {
  const [initial, initialShipping] = await Promise.all([
    getStoreSettings(),
    getShippingSettings(),
  ]);
  return <StoreSettingsClient initial={initial} initialShipping={initialShipping} />;
}
