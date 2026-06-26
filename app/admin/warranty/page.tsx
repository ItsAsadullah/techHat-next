import { getWarrantyClaims, getWarrantyStats } from '@/lib/actions/warranty-actions';
import WarrantyCenterClient from '@/components/admin/warranty/warranty-center-client';

export const metadata = {
  title: 'Warranty Center | TechHat Admin',
  description: 'Manage warranty claims, supplier returns, and customer deliveries',
};

export default async function WarrantyCenterPage() {
  const [claims, stats] = await Promise.all([
    getWarrantyClaims(),
    getWarrantyStats(),
  ]);

  return <WarrantyCenterClient initialClaims={claims} initialStats={stats} />;
}
