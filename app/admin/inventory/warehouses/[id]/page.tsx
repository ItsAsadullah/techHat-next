import { getWarehouseById } from '@/lib/actions/warehouse-actions';
import { WarehouseForm } from '../components/warehouse-form';
import { notFound } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Package, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default async function WarehouseDetailsPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = await params;
  const res = await getWarehouseById(resolvedParams.id);
  
  if (!res.success || !res.data) {
    notFound();
  }

  const warehouse = res.data;
  const stockItems = warehouse.stockItems || [];
  const totalValue = warehouse.totalWarehouseValue || 0;

  return (
    <div className="max-w-[1400px] mx-auto space-y-8">
      {/* Edit Form */}
      <WarehouseForm initialData={warehouse} isEditMode={true} />

      <div className="max-w-5xl flex justify-end">
        <Button asChild className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 shadow-md">
          <Link href={`/admin/inventory/warehouses/${warehouse.id}/analytics`}>
            <TrendingUp className="h-4 w-4" />
            View Analytics Dashboard
          </Link>
        </Button>
      </div>

      {/* Stock Details */}
      <Card className="max-w-5xl border-t-4 border-t-primary">
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              <CardTitle>Current Stock in {warehouse.name}</CardTitle>
            </div>
            <CardDescription className="mt-1">
              Live inventory holding based on stock ledger calculations.
            </CardDescription>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider mb-1">Total Stock Value</p>
            <p className="text-2xl font-mono font-bold text-emerald-600 dark:text-emerald-400">
              ৳{totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead className="text-right">Available Qty</TableHead>
                <TableHead className="text-right">Unit Cost</TableHead>
                <TableHead className="text-right">Total Value</TableHead>
                <TableHead className="text-center">Velocity (30d)</TableHead>
                <TableHead className="text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stockItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                    No stock currently available in this warehouse.
                  </TableCell>
                </TableRow>
              ) : (
                stockItems.map((item: any) => (
                  <TableRow key={item.id} className="hover:bg-muted/10">
                    <TableCell>
                      <div className="font-medium text-sm">{item.name}</div>
                      {item.variantName && (
                        <div className="text-xs text-muted-foreground">{item.variantName}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-2 py-1 rounded">{item.sku}</code>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="font-bold font-mono">{item.stock}</div>
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs text-muted-foreground">
                      ৳{item.unitCost?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}
                    </TableCell>
                    <TableCell className="text-right font-mono text-indigo-600 dark:text-indigo-400 font-medium">
                      ৳{item.totalValue?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}
                    </TableCell>
                    <TableCell className="text-center font-mono text-sm">
                      {item.out30Days} <span className="text-[10px] text-muted-foreground">out</span>
                    </TableCell>
                    <TableCell className="text-center">
                      {item.velocityStatus === 'FAST_MOVER' ? (
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1 pr-3">
                          <TrendingUp className="h-3 w-3" /> Fast
                        </Badge>
                      ) : item.velocityStatus === 'SLOW_MOVER' ? (
                        <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 gap-1 pr-3">
                          <TrendingDown className="h-3 w-3" /> Slow
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200 gap-1 pr-3">
                          <Minus className="h-3 w-3" /> Normal
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
