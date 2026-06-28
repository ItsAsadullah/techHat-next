import { getChartOfAccounts } from '@/lib/actions/accounting-actions';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import InitAccountsButton from './init-accounts-button';

export default async function ChartOfAccountsPage() {
  const res = await getChartOfAccounts();
  const accounts = res.success && res.data ? res.data : [];

  type Account = (typeof accounts)[number];
  const groupedAccounts = accounts.reduce((acc: Record<string, Account[]>, account: Account) => {
    if (!acc[account.type]) acc[account.type] = [];
    acc[account.type].push(account);
    return acc;
  }, {} as Record<string, Account[]>);

  const accountTypes = ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'];

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/accounting">
              <ChevronLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Chart of Accounts (চার্ট অফ অ্যাকাউন্টস)</h1>
            <p className="text-muted-foreground mt-1">Manage your general ledger accounts and track balances (অ্যাকাউন্ট এবং ব্যালেন্স পরিচালনা করুন)</p>
          </div>
        </div>
        <div className="flex gap-2">
          {accounts.length === 0 && <InitAccountsButton />}
          {accounts.length > 0 && (
            <Button asChild className="bg-blue-600 hover:bg-blue-700">
              <Link href="/admin/accounting/chart-of-accounts/new">
                <Plus className="w-4 h-4 mr-2" />
                New Account (নতুন অ্যাকাউন্ট)
              </Link>
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-8">
        {accountTypes.map((type) => {
          const typeAccounts = groupedAccounts[type] || [];
          if (typeAccounts.length === 0) return null;

          const totalBalance = typeAccounts.reduce((sum: number, acc: Account) => sum + (acc.balance || 0), 0);

          return (
            <Card key={type}>
              <CardHeader className="bg-muted/30 pb-4 border-b">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {type}
                    <Badge variant="outline" className="text-xs font-normal">{typeAccounts.length} accounts</Badge>
                  </CardTitle>
                  <div className="text-lg font-bold">
                    ৳{totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                      <TableHead className="w-[150px] font-semibold text-slate-700">Account Code (কোড)</TableHead>
                      <TableHead className="font-semibold text-slate-700">Account Name (নাম)</TableHead>
                      <TableHead className="text-right font-semibold text-slate-700">Current Balance (বর্তমান ব্যালেন্স)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {typeAccounts.map((acc: Account) => (
                      <TableRow key={acc.id}>
                        <TableCell className="font-mono text-muted-foreground">{acc.code}</TableCell>
                        <TableCell className="font-medium">{acc.name}</TableCell>
                        <TableCell className="text-right font-medium text-indigo-600 dark:text-indigo-400">
                          ৳{(acc.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
