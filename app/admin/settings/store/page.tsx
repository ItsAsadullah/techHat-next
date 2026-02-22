import { getStoreSettings } from '@/lib/actions/invoice-settings-actions';
import { StoreSettingsClient } from './store-client';

export default async function StoreSettingsPage() {
  const initial = await getStoreSettings();
  return <StoreSettingsClient initial={initial} />;
}
