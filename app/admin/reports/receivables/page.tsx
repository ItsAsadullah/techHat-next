import { getReceivablesSummary } from '@/lib/actions/receivables-actions';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarClock } from 'lucide-react';
import Link from 'next/link';

export default async function ReceivablesSummaryPage() {
  const res = await getReceivablesSummary();
  if (!res.success) {
    console.error('Failed to get receivables summary:', res.error);
  }
  const summary = (res.data as any) || { totalReceivable: 0, totalAdvance: 0, customerCount: 0, customers: [] };

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Receivables Summary</h1>
          <p className="text-muted-foreground">Overview of customer balances and outstanding receivables</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/admin/reports/receivables/aging">
            <CalendarClock className="mr-2 h-4 w-4" />
            Aging Report
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-emerald-500/10 border-emerald-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-emerald-600">Total Receivables</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600">
              ৳{summary.totalReceivable.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Money owed to you by customers</p>
          </CardContent>
        </Card>
        
        <Card className="bg-destructive/10 border-destructive/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-destructive">Customer Advances / Overpayments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive">
              ৳{summary.totalAdvance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Money you owe to customers</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Customer Balances</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Group</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Balance (৳)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summary.customers.map((customer: any) => (
                <TableRow key={customer.id}>
                  <TableCell className="font-medium">
                    <Link href={`/admin/customers/${customer.id}`} className="hover:underline text-primary">
                      {customer.name}
                    </Link>
                  </TableCell>
                  <TableCell>{customer.phone || '-'}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px]">{customer.customerGroup}</Badge>
                  </TableCell>
                  <TableCell>
                    {customer.balance > 0 ? (
                      <Badge variant="default" className="bg-emerald-600 hover:bg-emerald-700">To Receive</Badge>
                    ) : customer.balance < 0 ? (
                      <Badge variant="destructive">Advance</Badge>
                    ) : (
                      <Badge variant="secondary">Settled</Badge>
                    )}
                  </TableCell>
                  <TableCell className={`text-right font-bold ${customer.balance > 0 ? 'text-emerald-600' : customer.balance < 0 ? 'text-destructive' : ''}`}>
                    {customer.balance > 0 
                      ? customer.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })
                      : customer.balance < 0 
                        ? `(${Math.abs(customer.balance).toLocaleString(undefined, { minimumFractionDigits: 2 })})`
                        : '0.00'}
                  </TableCell>
                </TableRow>
              ))}
              {summary.customers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No customers found.
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
