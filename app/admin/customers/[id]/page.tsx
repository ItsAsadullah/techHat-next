import { getCustomerById } from '@/lib/actions/customer-actions';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Edit } from 'lucide-react';
import Link from 'next/link';
import { DueCollectionClient } from '@/app/admin/receivables/due-collection/due-collection-client';

export const metadata = {
  title: 'Customer Workspace | TechHat ERP',
};

export default async function CustomerDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const res = await getCustomerById(resolvedParams.id);
  const customer = res.success ? res.data : null;

  if (!customer) notFound();

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-12">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-foreground">
          <Link href="/admin/customers">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Customers
          </Link>
        </Button>
        
        <Button asChild variant="outline" size="sm">
          <Link href={`/admin/customers/edit/${customer.id}`}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Customer Details
          </Link>
        </Button>
      </div>

      {/* Financial Workspace */}
      <DueCollectionClient customer={customer} />
    </div>
  );
}
