import { getSupplierStatement } from '@/lib/actions/supplier-statement-actions';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { PrintButton } from '@/components/admin/print-button';

export default async function SupplierStatementPage({ params, searchParams }: { params: Promise<{ id: string }>, searchParams: Promise<{ from?: string, to?: string }> }) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const { id } = resolvedParams;
  const res = await getSupplierStatement(id, resolvedSearchParams.from, resolvedSearchParams.to);
  
  if (!res.success || !res.data) {
    return <div>Error loading statement: {res.error}</div>;
  }

  const { supplier, openingBalance, lines, closingBalance, fromDate, toDate } = res.data;

  return (
    <div className="space-y-6 max-w-[1000px] mx-auto print:max-w-none print:p-0">
      <div className="flex justify-between items-center print:hidden">
        <Link href={`/admin/suppliers/${id}`}>
          <Button variant="ghost" size="sm">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Supplier
          </Button>
        </Link>
        <PrintButton label="Print Statement" />
      </div>

      <Card className="print:shadow-none print:border-none print:m-0">
        <CardContent className="p-8 print:p-0">
          {/* Header */}
          <div className="flex justify-between items-start mb-8 pb-8 border-b">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Statement of Account</h1>
              <p className="text-muted-foreground mt-1">TechHat Enterprise</p>
            </div>
            <div className="text-right">
              <h3 className="font-bold text-lg">{supplier.name}</h3>
              <p className="text-muted-foreground">{supplier.phone}</p>
              <p className="text-muted-foreground">{supplier.email}</p>
              <div className="mt-4 text-sm">
                <span className="font-semibold">Period:</span> {format(new Date(fromDate), 'dd MMM yyyy')} to {format(new Date(toDate), 'dd MMM yyyy')}
              </div>
            </div>
          </div>

          {/* Ledger Table */}
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Date</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Debit</TableHead>
                <TableHead className="text-right">Credit</TableHead>
                <TableHead className="text-right font-bold">Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow className="bg-muted/10 font-medium">
                <TableCell colSpan={5} className="text-right italic text-muted-foreground">Opening Balance</TableCell>
                <TableCell className="text-right">
                  ৳{openingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </TableCell>
              </TableRow>

              {lines.map((l: any) => (
                <TableRow key={l.id}>
                  <TableCell>{format(new Date(l.date), 'dd MMM yyyy')}</TableCell>
                  <TableCell className="font-mono text-xs">{l.referenceId || '-'}</TableCell>
                  <TableCell>{l.type} {l.note && `- ${l.note}`}</TableCell>
                  <TableCell className="text-right text-emerald-600">
                    {l.debit > 0 ? `৳${l.debit.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '-'}
                  </TableCell>
                  <TableCell className="text-right text-destructive">
                    {l.credit > 0 ? `৳${l.credit.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '-'}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    ৳{l.runningBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </TableCell>
                </TableRow>
              ))}

              <TableRow className="bg-muted/30 font-bold border-t-2">
                <TableCell colSpan={5} className="text-right">Closing Balance</TableCell>
                <TableCell className="text-right text-lg">
                  ৳{closingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>

          {/* Footer */}
          <div className="mt-12 text-center text-sm text-muted-foreground print:block hidden">
            This is a computer generated statement and requires no signature.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
