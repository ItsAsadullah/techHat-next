import { getJournalEntries } from '@/lib/actions/accounting-actions';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

export default async function JournalEntriesPage() {
  const res = await getJournalEntries();
  const entries = res.success ? res.data : [];

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Journal Entries</h1>
          <p className="text-muted-foreground">Record and review double-entry accounting transactions</p>
        </div>
        <Link href="/admin/accounting/journals/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Journal Entry
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>All manual and automated journal entries</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {entries?.map((entry: any) => {
              const totalDebit = entry.items.reduce((sum: number, item: any) => sum + item.debit, 0);

              return (
                <div key={entry.id} className="border rounded-lg overflow-hidden">
                  <div className="bg-muted/30 px-4 py-3 flex justify-between items-center border-b">
                    <div className="flex items-center gap-4">
                      <span className="font-bold">{entry.entryNumber}</span>
                      <span className="text-sm text-muted-foreground">{format(new Date(entry.date), 'dd MMM yyyy')}</span>
                      {entry.reference && <span className="text-xs border px-2 py-0.5 rounded bg-background">Ref: {entry.reference}</span>}
                    </div>
                    <div className="font-medium text-sm">
                      Total: ৳{totalDebit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                  
                  {entry.notes && (
                    <div className="px-4 py-2 text-sm text-muted-foreground border-b italic">
                      {entry.notes}
                    </div>
                  )}

                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead>Account</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Debit</TableHead>
                        <TableHead className="text-right">Credit</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {entry.items.map((item: any) => (
                        <TableRow key={item.id} className="hover:bg-transparent">
                          <TableCell>
                            <div className="font-medium">{item.account?.name}</div>
                            <div className="text-xs text-muted-foreground font-mono">{item.account?.code}</div>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">{item.description}</TableCell>
                          <TableCell className="text-right font-medium">
                            {item.debit > 0 ? `৳${item.debit.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '-'}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {item.credit > 0 ? `৳${item.credit.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              );
            })}

            {(!entries || entries.length === 0) && (
              <div className="text-center py-12 text-muted-foreground border border-dashed rounded-lg">
                No journal entries found.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
