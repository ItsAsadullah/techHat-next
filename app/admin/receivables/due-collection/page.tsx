import { prisma } from '@/lib/prisma';
import { ReceivablesDashboardClient } from './receivables-dashboard-client';

export const metadata = {
  title: 'Customer Credit & Due Collection | TechHat ERP',
};

export default async function DueCollectionPage() {
  const customers = await prisma.customer.findMany({
    orderBy: { balance: 'desc' },
    select: {
      id: true,
      name: true,
      phone: true,
      balance: true,
      creditLimit: true,
      creditRating: true,
      creditScore: true,
      customerGroup: true,
      lastPaymentDate: true,
    }
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Customer Credit & Receivables</h1>
        <p className="text-gray-500 mt-1 text-sm sm:text-base">Manage customer due, credit limits, and collections.</p>
      </div>

      <ReceivablesDashboardClient customers={customers} />
    </div>
  );
}
