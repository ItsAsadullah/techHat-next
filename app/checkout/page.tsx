import CheckoutClient from './checkout-client';
import { getPaymentMethodSettings, getBrandingSettings } from '@/lib/actions/invoice-settings-actions';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Checkout | TechHat',
  description: 'Complete your purchase securely on TechHat.',
};

export default async function CheckoutPage() {
  const [paymentSettings, branding] = await Promise.all([
    getPaymentMethodSettings(),
    getBrandingSettings(),
  ]);
  
  return <CheckoutClient paymentSettings={paymentSettings} hotline={branding.topbarHotline} />;
}
