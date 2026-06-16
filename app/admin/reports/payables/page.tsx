import { getPayablesSummary } from '@/lib/actions/payables-report-actions';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarClock } from 'lucide-react';
import Link from 'next/link';

export default async function PayablesSummaryPage() {
  const res = await getPayablesSummary();
  const summary = (res.data as any) || { totalPayable: 0, totalAdvance: 0, supplierCount: 0, suppliers: [] };

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payables Summary</h1>
          <p className="text-muted-foreground">Overview of supplier balances and outstanding liabilities</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/admin/reports/payables/aging">
            <CalendarClock className="mr-2 h-4 w-4" />
            Aging Report
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-destructive/10 border-destructive/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-destructive">Total Payables</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive">
              ৳{summary.totalPayable.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-emerald-500/10 border-emerald-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-emerald-600">Supplier Advances (Overpayments)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600">
              ৳{summary.totalAdvance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Supplier Balances</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Supplier Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Balance (৳)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summary.suppliers.map((supplier: any) => (
                <TableRow key={supplier.id}>
                  <TableCell className="font-medium">
                    <Link href={`/admin/suppliers/${supplier.id}`} className="hover:underline text-primary">
                      {supplier.name}
                    </Link>
                  </TableCell>
                  <TableCell>{supplier.phone || '-'}</TableCell>
                  <TableCell>
                    {supplier.balance > 0 ? (
                      <Badge variant="destructive">To Pay</Badge>
                    ) : supplier.balance < 0 ? (
                      <Badge variant="outline" className="text-emerald-600 border-emerald-600">Advance</Badge>
                    ) : (
                      <Badge variant="secondary">Settled</Badge>
                    )}
                  </TableCell>
                  <TableCell className={`text-right font-bold ${supplier.balance > 0 ? 'text-destructive' : supplier.balance < 0 ? 'text-emerald-600' : ''}`}>
                    {supplier.balance > 0 
                      ? supplier.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })
                      : supplier.balance < 0 
                        ? `(${Math.abs(supplier.balance).toLocaleString(undefined, { minimumFractionDigits: 2 })})`
                        : '0.00'}
                  </TableCell>
                </TableRow>
              ))}
              {summary.suppliers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    No suppliers found.
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
