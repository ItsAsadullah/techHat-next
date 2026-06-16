import { getInventoryValuation } from '@/lib/actions/valuation-actions';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calculator, Download } from 'lucide-react';
import { ExportValuationButton } from './components/export-valuation-button';
import { format } from 'date-fns';

export default async function InventoryValuationPage() {
  const res = await getInventoryValuation();
  const data = res.success ? res.data : { items: [], grandTotalValue: 0 };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory Valuation</h1>
          <p className="text-muted-foreground">Financial report based on Moving Average Cost (MAC) from Stock Ledger</p>
        </div>
        <ExportValuationButton data={data?.items || []} totalValue={data?.grandTotalValue || 0} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1 shadow-sm bg-gradient-to-br from-violet-500/10 to-indigo-500/10 border-violet-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-violet-500 text-white rounded-full">
                <Calculator className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Inventory Value (MAC)</p>
                <h2 className="text-3xl font-bold text-violet-700 dark:text-violet-400">
                  ৳{(data?.grandTotalValue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </h2>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-4 italic">
              Report generated on {format(new Date(), 'dd MMM yyyy, hh:mm a')}. Useful for end-of-month financial closing.
            </p>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 shadow-sm">
          <CardHeader>
            <CardTitle>Valuation Details</CardTitle>
            <CardDescription>Breakdown by product and variant, sorted by total value.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-[600px] overflow-auto border rounded-md">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
                  <TableRow>
                    <TableHead>Product / Variant</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead className="text-right">Physical Qty</TableHead>
                    <TableHead className="text-right">Unit MAC</TableHead>
                    <TableHead className="text-right font-bold">Total Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.items.map((item: any) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="font-medium text-sm">{item.productName}</div>
                        {item.variantName && <div className="text-xs text-muted-foreground">{item.variantName}</div>}
                      </TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground">{item.sku}</TableCell>
                      <TableCell className="text-right font-medium">{item.qty}</TableCell>
                      <TableCell className="text-right text-xs">
                        ৳{item.mac.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-right font-medium text-indigo-600 dark:text-indigo-400">
                        ৳{item.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                    </TableRow>
                  ))}
                  {data?.items.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                        No active stock found for valuation.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
