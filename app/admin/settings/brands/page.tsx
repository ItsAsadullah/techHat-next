import { prisma } from '@/lib/prisma';
import { BrandManager } from '@/components/admin/settings/brand-manager';
import { Tags } from 'lucide-react';

export default async function BrandsSettingsPage() {
  const brands = await prisma.brand.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      shortCode: true,
      logo: true,
      _count: {
        select: {
          products: true,
        },
      },
    },
    orderBy: { name: 'asc' },
  });

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-white rounded-xl shadow-sm border border-gray-200">
              <Tags className="w-6 h-6 text-gray-700" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Brand Management</h1>
              <p className="text-gray-600 font-medium mt-1">Create, edit, and delete brands with SKU short codes</p>
            </div>
          </div>
        </div>

        <BrandManager initialBrands={brands} />
      </div>
    </div>
  );
}
