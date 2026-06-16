import { getCustomerById } from '@/lib/actions/customer-actions';
import { notFound } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, ChevronLeft, Receipt, User, Mail, Phone, MapPin, Building2 } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

export default async function CustomerDetailsPage({ params }: { params: { id: string } }) {
  const res = await getCustomerById(params.id);
  const customer = res.success ? res.data : null;

  if (!customer) notFound();

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/customers">
              <ChevronLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight">{customer.name}</h1>
              <Badge variant={customer.status === 'ACTIVE' ? 'default' : 'secondary'}>
                {customer.status}
              </Badge>
              <Badge variant="outline">{customer.customerGroup}</Badge>
            </div>
            <p className="text-muted-foreground font-mono text-sm mt-1">Code: {customer.customerCode}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/admin/customers/${customer.id}/statement`}>
              <Receipt className="mr-2 h-4 w-4" />
              Statement
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/admin/customers/edit/${customer.id}`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Customer
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Customer Profile */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Profile Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {customer.companyName && (
              <div className="flex items-center gap-3">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span>{customer.companyName}</span>
              </div>
            )}
            {customer.phone && (
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{customer.phone}</span>
              </div>
            )}
            {customer.email && (
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{customer.email}</span>
              </div>
            )}
            {customer.address && (
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                <span className="flex-1">{customer.address}</span>
              </div>
            )}
            <div className="pt-4 border-t mt-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground text-sm">Credit Limit:</span>
                <span className="font-medium">৳{customer.creditLimit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground text-sm">Outstanding Receivable:</span>
                <span className={`font-bold text-lg ${customer.balance > 0 ? 'text-destructive' : ''}`}>
                  ৳{customer.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ledger & Recent Activity */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Ledger & Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead className="text-right">Debit (+)</TableHead>
                  <TableHead className="text-right">Credit (-)</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customer.customerLedgers.map((l: any) => (
                  <TableRow key={l.id}>
                    <TableCell className="whitespace-nowrap">{format(new Date(l.date), 'dd MMM yyyy')}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] uppercase">{l.type}</Badge>
                      {l.note && <p className="text-xs text-muted-foreground mt-1">{l.note}</p>}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{l.referenceId || '-'}</TableCell>
                    <TableCell className="text-right text-destructive font-medium">
                      {l.debit > 0 ? `৳${l.debit.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '-'}
                    </TableCell>
                    <TableCell className="text-right text-emerald-600 font-medium">
                      {l.credit > 0 ? `৳${l.credit.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '-'}
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      ৳{l.runningBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </TableCell>
                  </TableRow>
                ))}
                {customer.customerLedgers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                      No ledger history found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
