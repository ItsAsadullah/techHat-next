import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { PrintButton } from '@/components/admin/print-button';

export default async function DebitNotePage({ params }: { params: { id: string } }) {
  const pr = await prisma.purchaseReturn.findUnique({
    where: { id: params.id },
    include: {
      supplier: true,
      warehouse: true,
      purchaseOrder: true,
      items: {
        include: { product: true, variant: true }
      }
    }
  });

  if (!pr) notFound();

  // Debit note amount is the total returned cost
  const totalAmount = pr.items.reduce((sum, item) => sum + (item.returnQty * item.unitCost), 0);

  return (
    <div className="space-y-6 max-w-[1000px] mx-auto print:max-w-none print:p-0">
      <div className="flex justify-between items-center print:hidden">
        <Link href={`/admin/purchases/returns/${pr.id}`}>
          <Button variant="ghost" size="sm">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Return
          </Button>
        </Link>
        <PrintButton label="Print Debit Note" />
      </div>

      <Card className="print:shadow-none print:border-none print:m-0 border-2">
        <CardContent className="p-10 print:p-0">
          {/* Header */}
          <div className="flex justify-between items-start mb-8 pb-8 border-b-2">
            <div>
              <h1 className="text-4xl font-bold uppercase tracking-tight text-destructive">Debit Note</h1>
              <p className="text-muted-foreground mt-2 font-medium">TechHat Enterprise</p>
              <p className="text-sm text-muted-foreground">123 ERP Street, Business District</p>
            </div>
            <div className="text-right space-y-1">
              <div className="text-xl font-bold">{pr.returnNumber}</div>
              <div className="text-sm text-muted-foreground">Date: {format(new Date(pr.date), 'dd MMM yyyy')}</div>
              <div className="text-sm text-muted-foreground">Status: <span className="font-semibold">{pr.status}</span></div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 mb-8">
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase text-muted-foreground tracking-wider">To Supplier</h3>
              <div className="font-semibold text-lg">{pr.supplier.name}</div>
              <div className="text-sm">{pr.supplier.phone}</div>
              <div className="text-sm">{pr.supplier.email}</div>
              <div className="text-sm text-muted-foreground mt-2">
                We have debited your account with the following amount due to returned goods.
              </div>
            </div>
            
            <div className="space-y-2 text-right">
              <h3 className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Reference</h3>
              <div className="text-sm">
                <span className="font-medium">Original PO:</span> {pr.purchaseOrder.poNumber}
              </div>
              <div className="text-sm">
                <span className="font-medium">Warehouse:</span> {pr.warehouse.name}
              </div>
              {pr.reason && (
                <div className="text-sm mt-4 italic text-muted-foreground">
                  "{pr.reason}"
                </div>
              )}
            </div>
          </div>

          {/* Items Table */}
          <Table className="mt-8 border">
            <TableHeader>
              <TableRow className="bg-muted">
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Return Qty</TableHead>
                <TableHead className="text-right">Unit Cost</TableHead>
                <TableHead className="text-right font-bold">Total Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pr.items.map((item: any) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="font-medium">{item.product.name}</div>
                    {item.productVariant && <div className="text-xs text-muted-foreground">Variant: {item.productVariant.sku}</div>}
                  </TableCell>
                  <TableCell className="text-right">{item.returnQty}</TableCell>
                  <TableCell className="text-right">
                    ৳{item.unitCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    ৳{(item.returnQty * item.unitCost).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </TableCell>
                </TableRow>
              ))}

              <TableRow className="bg-muted/50 font-bold border-t-2">
                <TableCell colSpan={3} className="text-right uppercase tracking-wider text-xs">
                  Total Debit Amount
                </TableCell>
                <TableCell className="text-right text-lg text-destructive">
                  ৳{totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>

          {/* Footer Signatures */}
          <div className="grid grid-cols-2 gap-8 mt-32 pt-8">
            <div className="border-t text-center pt-2 w-48">
              <span className="text-sm font-medium">Prepared By</span>
            </div>
            <div className="border-t text-center pt-2 w-48 justify-self-end">
              <span className="text-sm font-medium">Supplier Signature</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
