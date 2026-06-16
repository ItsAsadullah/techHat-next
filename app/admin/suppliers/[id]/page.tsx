import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Edit, Building2, MapPin, Phone, Mail, Receipt, TrendingUp, Package, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getSupplierLedger } from '@/lib/actions/supplier-ledger-actions';
import { SupplierLedgerTable } from './components/supplier-ledger-table';

export const metadata: Metadata = {
  title: 'Supplier Details | ERP',
  description: 'View supplier information and performance metrics',
};

export default async function SupplierDetailsPage({ params }: { params: { id: string } }) {
  const supplier = await prisma.supplier.findUnique({
    where: { id: params.id },
    include: {
      purchaseOrders: {
        orderBy: { date: 'desc' },
        take: 5,
        include: {
          _count: { select: { items: true } }
        }
      },
      grns: {
        orderBy: { receivedDate: 'desc' },
        take: 5,
        include: {
          purchaseOrder: { select: { poNumber: true } }
        }
      },
      _count: {
        select: { purchaseOrders: true, grns: true, purchaseReturns: true }
      }
    }
  });

  if (!supplier) notFound();

  const [totalPurchases, lastPurchase, ledgerResult] = await Promise.all([
    prisma.purchaseOrder.aggregate({
      where: { supplierId: supplier.id, status: { in: ['RECEIVED', 'PARTIALLY_RECEIVED', 'CLOSED'] } },
      _sum: { grandTotal: true },
    }),
    prisma.purchaseOrder.findFirst({
      where: { supplierId: supplier.id },
      orderBy: { date: 'desc' },
    }),
    getSupplierLedger(supplier.id)
  ]);

  const totalSpent = totalPurchases._sum.grandTotal || 0;
  
  // Real payable calculated accurately via the chronological ledger
  const currentPayable = ledgerResult.success ? ledgerResult.data!.currentPayable : (supplier.openingBalance + totalSpent);
  const ledger = ledgerResult.success ? ledgerResult.data!.ledger : [];

  return (
    <div className="flex flex-col gap-6 p-6 pb-24 max-w-[1400px] mx-auto">
      {/* Header section */}
      <div className="flex items-center justify-between sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b py-3 -mx-6 px-6 shadow-sm">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
          >
            <Link href="/admin/suppliers">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold">{supplier.name}</h1>
              <Badge variant={supplier.status === 'ACTIVE' ? 'default' : 'secondary'} className="text-[10px] uppercase">
                {supplier.status}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground font-mono mt-0.5">
              Code: {supplier.supplierCode || 'N/A'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/admin/suppliers/${supplier.id}/statement`}>
              <Receipt className="mr-2 h-4 w-4" />
              Statement
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/admin/suppliers/edit/${supplier.id}`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Supplier
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Total Purchase Orders</h3>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold">{supplier._count.purchaseOrders}</div>
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Total Spend</h3>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold font-mono">৳{totalSpent.toLocaleString()}</div>
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Outstanding Payable</h3>
          </div>
          <div className="text-2xl font-bold font-mono text-red-600 dark:text-red-400">৳{currentPayable.toLocaleString()}</div>
          <p className="text-[10px] text-muted-foreground mt-1">Includes ৳{supplier.openingBalance} opening balance</p>
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Last Purchase</h3>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-xl font-bold">
            {lastPurchase ? new Date(lastPurchase.date).toLocaleDateString() : 'Never'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Supplier Info */}
        <div className="md:col-span-1 space-y-6">
          <div className="rounded-xl border bg-card p-5 shadow-sm space-y-4">
            <h3 className="font-semibold text-sm flex items-center gap-2 border-b pb-2">
              <Building2 className="h-4 w-4" /> Company Details
            </h3>
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-muted-foreground block text-xs">Legal Name</span>
                <span className="font-medium">{supplier.companyName || '-'}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-xs">Trade License</span>
                <span className="font-medium">{supplier.tradeLicenseNo || '-'}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-muted-foreground block text-xs">BIN</span>
                  <span className="font-medium">{supplier.binNumber || '-'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-xs">TIN</span>
                  <span className="font-medium">{supplier.tinNumber || '-'}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border bg-card p-5 shadow-sm space-y-4">
            <h3 className="font-semibold text-sm flex items-center gap-2 border-b pb-2">
              <Phone className="h-4 w-4" /> Contact Info
            </h3>
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-muted-foreground block text-xs">Contact Person</span>
                <span className="font-medium">{supplier.contactPerson || '-'}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-xs">Phone</span>
                <span className="font-medium">{supplier.phone}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-xs">Email</span>
                <span className="font-medium">{supplier.email || '-'}</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border bg-card p-5 shadow-sm space-y-4">
            <h3 className="font-semibold text-sm flex items-center gap-2 border-b pb-2">
              <MapPin className="h-4 w-4" /> Location
            </h3>
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-muted-foreground block text-xs">Address</span>
                <span className="font-medium block leading-relaxed">{supplier.address || '-'}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-muted-foreground block text-xs">District</span>
                  <span className="font-medium">{supplier.district || '-'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-xs">Country</span>
                  <span className="font-medium">{supplier.country || 'Bangladesh'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Transactions & History via Tabs */}
        <div className="md:col-span-2">
          <Tabs defaultValue="ledger" className="space-y-4">
            <TabsList className="bg-card border h-9 p-0.5 gap-0.5">
              <TabsTrigger value="ledger" className="h-8 px-4 text-xs capitalize">Financial Ledger</TabsTrigger>
              <TabsTrigger value="purchases" className="h-8 px-4 text-xs capitalize">Purchase Orders ({supplier._count.purchaseOrders})</TabsTrigger>
              <TabsTrigger value="grn" className="h-8 px-4 text-xs capitalize">Goods Receive ({supplier._count.grns})</TabsTrigger>
            </TabsList>

            <TabsContent value="ledger" className="mt-0">
              <SupplierLedgerTable ledger={ledger} />
            </TabsContent>

            <TabsContent value="purchases" className="mt-0">
              <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
                <div className="p-4 border-b bg-muted/20 flex items-center justify-between">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <Receipt className="h-4 w-4" /> Recent Purchase Orders
                  </h3>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/admin/purchases?supplierId=${supplier.id}`}>View All</Link>
                  </Button>
                </div>
                {supplier.purchaseOrders.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>PO Number</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-center">Items</TableHead>
                        <TableHead className="text-right">Total Amount</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {supplier.purchaseOrders.map((po: any) => (
                        <TableRow key={po.id}>
                          <TableCell className="font-mono font-medium text-primary">
                            <Link href={`/admin/purchases/${po.id}`}>{po.poNumber}</Link>
                          </TableCell>
                          <TableCell>{new Date(po.date).toLocaleDateString()}</TableCell>
                          <TableCell className="text-center">{po._count.items}</TableCell>
                          <TableCell className="text-right font-mono">৳{po.grandTotal.toLocaleString()}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant="secondary" className="text-[10px] uppercase">
                              {po.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="p-8 text-center text-sm text-muted-foreground">
                    No purchase orders found for this supplier.
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="grn" className="mt-0">
              <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
                <div className="p-4 border-b bg-muted/20 flex items-center justify-between">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <Package className="h-4 w-4" /> Recent Goods Receives (GRN)
                  </h3>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/admin/inventory/grn?supplierId=${supplier.id}`}>View All</Link>
                  </Button>
                </div>
                {supplier.grns.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>GRN Number</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Against PO</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {supplier.grns.map((grn: any) => (
                        <TableRow key={grn.id}>
                          <TableCell className="font-mono font-medium text-primary">
                            <Link href={`/admin/inventory/grn/${grn.id}`}>{grn.grnNumber}</Link>
                          </TableCell>
                          <TableCell>{new Date(grn.receivedDate).toLocaleDateString()}</TableCell>
                          <TableCell className="font-mono">{grn.purchaseOrder.poNumber}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className="text-[10px] uppercase">
                              {grn.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="p-8 text-center text-sm text-muted-foreground">
                    No goods receive notes found for this supplier.
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
