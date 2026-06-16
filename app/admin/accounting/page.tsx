import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, CalendarRange, Scale, ArrowRightLeft, BookMarked } from 'lucide-react';
import Link from 'next/link';

export default function AccountingDashboard() {
  return (
    <div className="space-y-6 max-w-[1200px] mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Financial Accounting</h1>
        <p className="text-muted-foreground">Manage your chart of accounts, journal entries, and financial statements.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Foundation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Chart of Accounts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              The foundation of your accounting system. Manage assets, liabilities, equity, income, and expenses.
            </p>
            <Button asChild className="w-full" variant="outline">
              <Link href="/admin/accounting/chart-of-accounts">Manage Accounts</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Periods */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarRange className="h-5 w-5 text-primary" />
              Fiscal Years
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Define financial years and accounting periods. Close periods to prevent historical modifications.
            </p>
            <Button asChild className="w-full" variant="outline">
              <Link href="/admin/accounting/fiscal-years">Manage Periods</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Journal Entries */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5 text-primary" />
              Journal Entries
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              View automated entries or post manual double-entry journals for adjustments and corrections.
            </p>
            <Button asChild className="w-full" variant="outline">
              <Link href="/admin/accounting/journals">View Journals</Link>
            </Button>
          </CardContent>
        </Card>

        {/* General Ledger */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookMarked className="h-5 w-5 text-emerald-600" />
              General Ledger
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Dive deep into specific accounts. View a chronological ledger of all debits and credits.
            </p>
            <Button asChild className="w-full bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-none">
              <Link href="/admin/accounting/general-ledger">Open Ledger</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Trial Balance */}
        <Card className="border-blue-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scale className="h-5 w-5 text-blue-600" />
              Trial Balance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Ensure your books are balanced. View net debit and credit balances across all active accounts.
            </p>
            <Button asChild className="w-full bg-blue-600 hover:bg-blue-700 text-white border-none">
              <Link href="/admin/accounting/trial-balance">Run Trial Balance</Link>
            </Button>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
