import { prisma } from '@/lib/prisma';
import { DueCollectionClient } from './due-collection-client';

export const metadata = {
  title: 'Due Collection Workspace | TechHat POS',
};

export default async function DueCollectionPage() {
  const customers = await prisma.customer.findMany({
    where: { balance: { gt: 0 } },
    select: {
      id: true,
      name: true,
      phone: true,
      balance: true,
    },
    orderBy: { balance: 'desc' }
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Due Collection</h1>
        <p className="text-gray-500 mt-1 text-sm sm:text-base">Collect payments and auto-allocate to outstanding invoices.</p>
      </div>

      <DueCollectionClient customers={customers} />
    </div>
  );
}
