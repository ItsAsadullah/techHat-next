import { getGeneralLedger } from '@/lib/actions/accounting-reports-actions';
import { prisma } from '@/lib/prisma';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Printer, Search } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

export default async function GeneralLedgerPage({ searchParams }: { searchParams: Promise<{ account?: string, from?: string, to?: string  }> }) {
  const resolvedParams = await searchParams;
  const accountId = resolvedParams.account;

  // We need to fetch accounts for a rudimentary selector if not using a client component combobox
  const accounts = await prisma.chartOfAccount.findMany({ orderBy: [{ type: 'asc' }, { code: 'asc' }] });

  // If no account selected, just show the selector
  if (!accountId) {
    return (
      <div className="space-y-6 max-w-[1000px] mx-auto">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/accounting">
              <ChevronLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">General Ledger</h1>
            <p className="text-muted-foreground">Select an account to view its chronological ledger</p>
          </div>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {accounts.map(acc => (
                <Link key={acc.id} href={`/admin/accounting/general-ledger?account=${acc.id}`}>
                  <div className="border rounded-lg p-4 hover:border-primary hover:bg-primary/5 transition-colors cursor-pointer flex justify-between items-center">
                    <div>
                      <div className="font-mono text-xs text-muted-foreground mb-1">{acc.code}</div>
                      <div className="font-medium">{acc.name}</div>
                    </div>
                    <Badge variant="outline">{acc.type}</Badge>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Load the specific ledger
  const res = await getGeneralLedger(accountId, resolvedParams.from, resolvedParams.to);
  
  if (!res.success || !res.data) {
    return <div>Error loading ledger: {res.error}</div>;
  }

  const { account, lines } = res.data;

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto print:max-w-none print:p-0">
      <div className="flex justify-between items-center print:hidden">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/accounting/general-ledger">
            <ChevronLeft className="mr-2 h-4 w-4" /> Back to Accounts
          </Link>
        </Button>
        <Button className="gap-2">
          <Printer className="h-4 w-4" /> Print Ledger
        </Button>
      </div>

      <Card className="print:shadow-none print:border-none print:m-0">
        <CardContent className="p-8 print:p-0">
          <div className="flex justify-between items-end mb-8 pb-4 border-b">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">General Ledger</h1>
              <p className="text-muted-foreground mt-1">Detailed Account Transactions</p>
            </div>
            <div className="text-right">
              <h3 className="text-xl font-bold">{account.name}</h3>
              <p className="font-mono text-muted-foreground">Code: {account.code}</p>
              <Badge variant="outline" className="mt-2">{account.type}</Badge>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Date</TableHead>
                <TableHead>Journal No</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right border-l">Debit</TableHead>
                <TableHead className="text-right border-l">Credit</TableHead>
                <TableHead className="text-right font-bold border-l">Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lines.map((l: any) => (
                <TableRow key={l.id}>
                  <TableCell className="whitespace-nowrap">{format(new Date(l.date), 'dd MMM yyyy')}</TableCell>
                  <TableCell className="font-mono text-xs">{l.journalNumber}</TableCell>
                  <TableCell className="font-mono text-xs">{l.referenceId || '-'}</TableCell>
                  <TableCell>{l.description || '-'}</TableCell>
                  <TableCell className="text-right border-l text-emerald-700">
                    {l.debit > 0 ? `৳${l.debit.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '-'}
                  </TableCell>
                  <TableCell className="text-right border-l text-blue-700">
                    {l.credit > 0 ? `৳${l.credit.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '-'}
                  </TableCell>
                  <TableCell className="text-right border-l font-bold">
                    ৳{l.runningBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </TableCell>
                </TableRow>
              ))}
              {lines.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No transactions found for this account in the specified period.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
