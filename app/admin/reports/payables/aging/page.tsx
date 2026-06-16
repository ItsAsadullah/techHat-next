import { getPayablesAging } from '@/lib/actions/payables-report-actions';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Link from 'next/link';

export default async function PayablesAgingPage() {
  const res = await getPayablesAging();
  const agingData = (res.data as any[]) || [];

  const totals = agingData.reduce((acc: any, row: any) => {
    acc.totalPayable += row.totalPayable;
    acc.current += row.current;
    acc.days31To60 += row.days31To60;
    acc.days61To90 += row.days61To90;
    acc.over90 += row.over90;
    return acc;
  }, { totalPayable: 0, current: 0, days31To60: 0, days61To90: 0, over90: 0 });

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Accounts Payable Aging</h1>
        <p className="text-muted-foreground">Detailed breakdown of outstanding liabilities by age</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Supplier Name</TableHead>
                <TableHead className="text-right border-l">Current (0-30 Days)</TableHead>
                <TableHead className="text-right border-l">31 - 60 Days</TableHead>
                <TableHead className="text-right border-l text-orange-600">61 - 90 Days</TableHead>
                <TableHead className="text-right border-l text-destructive">90+ Days</TableHead>
                <TableHead className="text-right border-l font-bold bg-muted/20">Total Payable</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {agingData.map((row: any) => (
                <TableRow key={row.supplierId}>
                  <TableCell className="font-medium">
                    <Link href={`/admin/suppliers/${row.supplierId}`} className="hover:underline text-primary">
                      {row.supplierName}
                    </Link>
                  </TableCell>
                  <TableCell className="text-right border-l">
                    {row.current > 0 ? row.current.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                  </TableCell>
                  <TableCell className="text-right border-l">
                    {row.days31To60 > 0 ? row.days31To60.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                  </TableCell>
                  <TableCell className="text-right border-l text-orange-600 font-medium">
                    {row.days61To90 > 0 ? row.days61To90.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                  </TableCell>
                  <TableCell className="text-right border-l text-destructive font-bold">
                    {row.over90 > 0 ? row.over90.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                  </TableCell>
                  <TableCell className="text-right border-l font-bold bg-muted/10">
                    ৳{row.totalPayable.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </TableCell>
                </TableRow>
              ))}
              
              {/* TOTALS ROW */}
              {agingData.length > 0 ? (
                <TableRow className="bg-muted/50 font-bold border-t-2">
                  <TableCell>Grand Total</TableCell>
                  <TableCell className="text-right border-l">
                    ৳{totals.current.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-right border-l">
                    ৳{totals.days31To60.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-right border-l text-orange-600">
                    ৳{totals.days61To90.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-right border-l text-destructive">
                    ৳{totals.over90.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-right border-l text-lg">
                    ৳{totals.totalPayable.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </TableCell>
                </TableRow>
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No outstanding payables found.
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
