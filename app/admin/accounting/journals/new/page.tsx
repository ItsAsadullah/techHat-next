import { getChartOfAccounts } from '@/lib/actions/accounting-actions';
import { JournalForm } from './components/journal-form';
import { AccountingCheatSheet } from './components/accounting-cheat-sheet';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';

export default async function NewJournalEntryPage() {
  const res = await getChartOfAccounts();
  const accounts = res.success && res.data ? res.data : [];

  return (
    <div className="max-w-6xl mx-auto space-y-6 relative pb-10">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/accounting/journals">
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">New Journal Entry (নতুন জার্নাল এন্ট্রি)</h1>
          <p className="text-muted-foreground mt-1">Record a manual double-entry accounting transaction (ম্যানুয়ালি একটি জার্নাল এন্ট্রি করুন)</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2">
          <JournalForm accounts={accounts} />
        </div>
        <div className="lg:col-span-1 hidden lg:block sticky top-6">
          <AccountingCheatSheet />
        </div>
      </div>
    </div>
  );
}
