import { AccountForm } from './components/account-form';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';

export default function NewAccountPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/accounting/chart-of-accounts">
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">New Account (নতুন অ্যাকাউন্ট)</h1>
          <p className="text-muted-foreground mt-1">Add a new account to the General Ledger (চার্ট অফ অ্যাকাউন্টস-এ নতুন অ্যাকাউন্ট যুক্ত করুন)</p>
        </div>
      </div>

      <AccountForm />
    </div>
  );
}
