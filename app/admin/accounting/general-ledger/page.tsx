import { getGeneralLedger } from '@/lib/actions/accounting-reports-actions';
import { prisma } from '@/lib/prisma';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Printer } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

export default async function GeneralLedgerPage({ searchParams }: { searchParams: Promise<{ account?: string, from?: string, to?: string  }> }) {
  const resolvedParams = await searchParams;
  const accountId = resolvedParams.account;

  // We need to fetch accounts for a rudimentary selector if not using a client component combobox
  const accounts = await prisma.chartOfAccount.findMany({ orderBy: [{ type: 'asc' }, { code: 'asc' }] });

  // If no account selected, just show the selector
  if (!accountId) {
    const groupedAccounts = accounts.reduce((acc, curr) => {
      if (!acc[curr.type]) acc[curr.type] = [];
      acc[curr.type].push(curr);
      return acc;
    }, {} as Record<string, typeof accounts>);

    const typeConfig: Record<string, { title: string, color: string, badge: string }> = {
      ASSET: { title: 'ASSET (সম্পদ)', color: 'border-emerald-100 bg-emerald-50/30 hover:bg-emerald-50 hover:border-emerald-300', badge: 'bg-emerald-100 text-emerald-800' },
      LIABILITY: { title: 'LIABILITY (দায়)', color: 'border-rose-100 bg-rose-50/30 hover:bg-rose-50 hover:border-rose-300', badge: 'bg-rose-100 text-rose-800' },
      EQUITY: { title: 'EQUITY (মূলধন)', color: 'border-purple-100 bg-purple-50/30 hover:bg-purple-50 hover:border-purple-300', badge: 'bg-purple-100 text-purple-800' },
      REVENUE: { title: 'REVENUE (আয়)', color: 'border-blue-100 bg-blue-50/30 hover:bg-blue-50 hover:border-blue-300', badge: 'bg-blue-100 text-blue-800' },
      EXPENSE: { title: 'EXPENSE (ব্যয়)', color: 'border-orange-100 bg-orange-50/30 hover:bg-orange-50 hover:border-orange-300', badge: 'bg-orange-100 text-orange-800' },
      COGS: { title: 'COGS (বিক্রিত পণ্যের ব্যয়)', color: 'border-stone-100 bg-stone-50/30 hover:bg-stone-50 hover:border-stone-300', badge: 'bg-stone-100 text-stone-800' }
    };

    return (
      <div className="space-y-6 max-w-[1000px] mx-auto animate-in fade-in duration-500">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/accounting">
              <ChevronLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">General Ledger (সাধারণ খতিয়ান)</h1>
            <p className="text-muted-foreground mt-1">Select an account to view its chronological ledger (বিস্তারিত খতিয়ান দেখতে একটি অ্যাকাউন্ট নির্বাচন করুন)</p>
          </div>
        </div>

        <div className="space-y-8">
          {Object.entries(groupedAccounts).map(([type, typeAccounts]) => {
            const config = typeConfig[type] || { title: type, color: 'border-slate-200 hover:border-slate-300', badge: 'bg-slate-100 text-slate-800' };
            
            return (
              <div key={type} className="space-y-3">
                <div className="flex items-center gap-2 border-b pb-2">
                  <h3 className="font-semibold text-lg text-slate-800">{config.title}</h3>
                  <Badge variant="secondary" className="rounded-full text-xs">{typeAccounts.length} accounts</Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {typeAccounts.map(acc => (
                    <Link key={acc.id} href={`/admin/accounting/general-ledger?account=${acc.id}`}>
                      <div className={`border rounded-xl p-4 transition-all duration-200 cursor-pointer flex flex-col justify-between shadow-sm hover:shadow-md h-full ${config.color}`}>
                        <div className="flex justify-between items-start w-full">
                          <div>
                            <div className="font-mono text-xs text-slate-500 mb-1 font-medium">{acc.code}</div>
                            <div className="font-semibold text-slate-900">{acc.name}</div>
                          </div>
                          <Badge variant="outline" className={`border-none ${config.badge}`}>{acc.type}</Badge>
                        </div>
                        <div className="mt-4 pt-3 border-t border-slate-200/40 flex justify-between items-center w-full">
                          <span className="text-xs text-slate-500 font-medium">Balance (বর্তমান ব্যালেন্স):</span>
                          <span className="font-bold text-slate-900 text-lg">৳{(acc.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
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
    <div className="space-y-6 max-w-[1200px] mx-auto print:max-w-none print:p-0 animate-in fade-in duration-500">
      <div className="flex justify-between items-center print:hidden">
        <Button variant="ghost" size="sm" asChild className="hover:bg-slate-100">
          <Link href="/admin/accounting/general-ledger">
            <ChevronLeft className="mr-2 h-4 w-4" /> Back to Accounts (অ্যাকাউন্টস-এ ফিরে যান)
          </Link>
        </Button>
        <Button className="gap-2 bg-slate-900 hover:bg-slate-800">
          <Printer className="h-4 w-4" /> Print Ledger (প্রিন্ট করুন)
        </Button>
      </div>

      <Card className="print:shadow-none print:border-none print:m-0 border-slate-200 shadow-sm overflow-hidden">
        <CardContent className="p-0 print:p-0">
          <div className="bg-slate-50 border-b border-slate-200 p-8 print:bg-transparent print:border-b-2 print:border-slate-900 flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">General Ledger (সাধারণ খতিয়ান)</h1>
              <p className="text-slate-500 mt-1">Detailed Account Transactions (বিস্তারিত লেনদেন)</p>
            </div>
            <div className="text-right">
              <h3 className="text-xl font-bold text-slate-900">{account.name}</h3>
              <p className="font-mono text-slate-500 font-medium mt-1">Code: {account.code}</p>
              <Badge variant="outline" className="mt-2 border-slate-300 bg-white text-slate-700 shadow-sm">{account.type}</Badge>
            </div>
          </div>

          <div className="p-0 print:p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-100/50 hover:bg-slate-100/50 border-b-slate-200">
                  <TableHead className="font-semibold text-slate-700 h-12 px-6">Date (তারিখ)</TableHead>
                  <TableHead className="font-semibold text-slate-700 h-12">Journal No</TableHead>
                  <TableHead className="font-semibold text-slate-700 h-12">Reference (রেফারেন্স)</TableHead>
                  <TableHead className="font-semibold text-slate-700 h-12">Description (বিবরণ)</TableHead>
                  <TableHead className="text-right font-semibold text-slate-700 h-12 border-l border-slate-200">Debit (ইন)</TableHead>
                  <TableHead className="text-right font-semibold text-slate-700 h-12 border-l border-slate-200">Credit (আউট)</TableHead>
                  <TableHead className="text-right font-bold text-slate-900 h-12 border-l border-slate-200 px-6 bg-slate-100">Balance (ব্যালেন্স)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lines.map((l) => (
                  <TableRow key={l.id} className="hover:bg-slate-50 transition-colors">
                    <TableCell className="whitespace-nowrap px-6 py-4 text-slate-600 font-medium">{format(new Date(l.date), 'dd MMM yyyy')}</TableCell>
                    <TableCell className="font-mono text-xs text-blue-600 bg-blue-50/50 px-2 py-1 rounded inline-flex mt-3 ml-2">{l.journalNumber}</TableCell>
                    <TableCell className="font-mono text-xs text-slate-500">{l.referenceId || '-'}</TableCell>
                    <TableCell className="text-slate-700 max-w-[250px] truncate" title={l.description || undefined}>{l.description || '-'}</TableCell>
                    <TableCell className="text-right border-l border-slate-100 text-emerald-600 font-semibold">
                      {l.debit > 0 ? `৳${l.debit.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '-'}
                    </TableCell>
                    <TableCell className="text-right border-l border-slate-100 text-rose-600 font-semibold">
                      {l.credit > 0 ? `৳${l.credit.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '-'}
                    </TableCell>
                    <TableCell className={`text-right border-l border-slate-100 font-bold px-6 ${l.runningBalance < 0 ? 'text-red-600' : 'text-slate-900'}`}>
                      ৳{l.runningBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </TableCell>
                  </TableRow>
                ))}
                {lines.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-slate-400 bg-slate-50/30">
                      No transactions found for this account in the specified period.<br/>
                      (এই অ্যাকাউন্টে কোনো লেনদেন পাওয়া যায়নি)
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
