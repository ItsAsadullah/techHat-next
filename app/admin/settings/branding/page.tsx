import { getBrandingSettings } from '@/lib/actions/invoice-settings-actions';
import { BrandingClient } from './branding-client';

export default async function BrandingSettingsPage() {
  const initial = await getBrandingSettings();
  return <BrandingClient initial={initial} />;
}
