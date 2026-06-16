// @ts-nocheck
import { getChartOfAccounts } from '@/lib/actions/accounting-actions';
import { JournalForm } from './components/journal-form';

export default async function NewJournalEntryPage() {
  const res = await getChartOfAccounts();
  const accounts = res.success ? res.data : [];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">New Journal Entry</h1>
        <p className="text-muted-foreground">Record a manual double-entry accounting transaction</p>
      </div>

      <JournalForm accounts={accounts} />
    </div>
  );
}
