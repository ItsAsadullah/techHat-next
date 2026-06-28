import { getFiscalYears } from '@/lib/actions/fiscal-year-actions';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import FiscalYearFormModal from './fiscal-year-form-modal';
import TogglePeriodButton from './toggle-period-button';

export default async function FiscalYearsPage() {
  const res = await getFiscalYears();
  type FiscalYear = NonNullable<typeof res.data>[number];
  type Period = FiscalYear extends { periods: Array<infer P> } ? P : never;
  const years = (res.data ?? []) as FiscalYear[];

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
            <h1 className="text-3xl font-bold tracking-tight">Fiscal Years (অর্থবছর)</h1>
            <p className="text-muted-foreground mt-1">Manage your accounting periods and financial years (অ্যাকাউন্টিং পিরিয়ড এবং বছর পরিচালনা করুন)</p>
          </div>
        </div>
        <FiscalYearFormModal />
      </div>

      <div className="space-y-8">
        {years.map((year: FiscalYear) => (
          <Card key={year.id}>
            <CardHeader className="bg-muted/30 pb-4 border-b">
              <div className="flex justify-between items-center">
                <CardTitle className="text-xl flex items-center gap-2">
                  {year.name}
                  <Badge variant={year.isClosed ? 'destructive' : 'default'} className="text-xs">
                    {year.isClosed ? 'Closed' : 'Active'}
                  </Badge>
                </CardTitle>
                <div className="text-sm text-muted-foreground">
                  {format(new Date(year.startDate), 'PP')} - {format(new Date(year.endDate), 'PP')}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Period Name</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(year as FiscalYear & { periods: Period[] }).periods.map((period: Period) => (
                    <TableRow key={period.id}>
                      <TableCell className="font-medium">{period.name}</TableCell>
                      <TableCell>{format(new Date(period.startDate), 'PP')}</TableCell>
                      <TableCell>{format(new Date(period.endDate), 'PP')}</TableCell>
                      <TableCell>
                        <Badge variant={period.isClosed ? 'secondary' : 'outline'}>
                          {period.isClosed ? 'Closed' : 'Open'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <TogglePeriodButton periodId={period.id} isClosed={period.isClosed} />
                      </TableCell>
                    </TableRow>
                  ))}
                  {year.periods.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                        No periods generated for this fiscal year.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))}
        {years.length === 0 && (
          <div className="text-center py-20 bg-muted/20 rounded-lg border border-dashed">
            <h3 className="text-lg font-semibold">No Fiscal Years Setup</h3>
            <p className="text-muted-foreground mt-2 mb-4">You need at least one fiscal year to start posting journal entries.</p>
            <FiscalYearFormModal />
          </div>
        )}
      </div>
    </div>
  );
}
