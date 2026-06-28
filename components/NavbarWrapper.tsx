import MainHeader from '@/components/homepage/MainHeader';
import { getCategoriesTree } from '@/lib/actions/category-actions';
import { getBrandingSettings } from '@/lib/actions/invoice-settings-actions';

export default async function NavbarWrapper() {
  const categories = await getCategoriesTree();
  const branding = await getBrandingSettings();
  return (
    <MainHeader
      initialCategories={categories}
      branding={{
        hotline:      branding.topbarHotline,
        deliveryText: branding.topbarDelivery,
        showDelivery: branding.topbarShowDelivery,
        siteLogo:     branding.siteLogo,
      }}
    />
  );
}

