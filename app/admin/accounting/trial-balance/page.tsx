import { getTrialBalance } from '@/lib/actions/accounting-reports-actions';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Printer } from 'lucide-react';
import Link from 'next/link';

export default async function TrialBalancePage() {
  const res = await getTrialBalance();
  const data = res.success && res.data ? res.data : { accounts: [], totalDebit: 0, totalCredit: 0, isBalanced: false };

  return (
    <div className="space-y-6 max-w-[1000px] mx-auto print:max-w-none print:p-0">
      <div className="flex justify-between items-center print:hidden">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/accounting">
            <ChevronLeft className="mr-2 h-4 w-4" /> Back to Dashboard
          </Link>
        </Button>
        <Button className="gap-2">
          <Printer className="h-4 w-4" /> Print
        </Button>
      </div>

      <Card className="print:shadow-none print:border-none">
        <CardContent className="p-8 print:p-0">
          <div className="text-center mb-8 pb-4 border-b">
            <h1 className="text-3xl font-bold tracking-tight uppercase">Trial Balance</h1>
            <p className="text-muted-foreground mt-2">Active Fiscal Period</p>
            {data.isBalanced ? (
              <Badge variant="default" className="mt-4 bg-emerald-600">Balanced</Badge>
            ) : (
              <Badge variant="destructive" className="mt-4">Out of Balance</Badge>
            )}
          </div>

          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Account Code</TableHead>
                <TableHead>Account Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right border-l">Debit (৳)</TableHead>
                <TableHead className="text-right border-l">Credit (৳)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data.accounts as Array<{ id: string; code: string; name: string; type: string; balanceType: string; netBalance: number }>).map((acc) => (
                <TableRow key={acc.id}>
                  <TableCell className="font-mono text-xs">{acc.code}</TableCell>
                  <TableCell className="font-medium">
                    <Link href={`/admin/accounting/general-ledger?account=${acc.id}`} className="hover:underline text-primary">
                      {acc.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px]">{acc.type}</Badge>
                  </TableCell>
                  <TableCell className="text-right border-l font-medium text-emerald-700">
                    {acc.balanceType === 'Debit' ? acc.netBalance.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                  </TableCell>
                  <TableCell className="text-right border-l font-medium text-blue-700">
                    {acc.balanceType === 'Credit' ? acc.netBalance.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                  </TableCell>
                </TableRow>
              ))}
              {data.accounts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No active accounts found in this period.
                  </TableCell>
                </TableRow>
              )}
              
              <TableRow className="bg-muted/30 font-bold border-t-2 text-lg">
                <TableCell colSpan={3} className="text-right">Grand Total</TableCell>
                <TableCell className="text-right border-l text-emerald-700">
                  ৳{data.totalDebit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </TableCell>
                <TableCell className="text-right border-l text-blue-700">
                  ৳{data.totalCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>

        </CardContent>
      </Card>
    </div>
  );
}
