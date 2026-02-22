import { getPOSConfig, initializePOSSettings } from '@/lib/actions/settings-actions';
import { POSSettingsClient } from './pos-settings-client';

export default async function POSSettingsPage() {
  await initializePOSSettings();
  const config = await getPOSConfig();
  return <POSSettingsClient initial={config} />;
}
