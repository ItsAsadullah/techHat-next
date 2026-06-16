import { Metadata } from 'next';
import { PackageSearch, Plus, Search, Filter, MoreHorizontal, Edit, Eye, ShoppingCart, TrendingUp } from "lucide-react";
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from '@/components/ui/badge';
import { getPurchaseOrders } from '@/lib/actions/po-actions';

export const metadata: Metadata = {
  title: 'Purchase Orders | ERP',
  description: 'Manage Purchase Orders to suppliers',
};

function getStatusColor(status: string) {
  switch (status) {
    case 'DRAFT': return 'secondary';
    case 'SUBMITTED': return 'default';
    case 'APPROVED': return 'default';
    case 'PARTIALLY_RECEIVED': return 'warning';
    case 'RECEIVED': return 'success';
    case 'CLOSED': return 'success';
    case 'CANCELLED': return 'destructive';
    default: return 'secondary';
  }
}

export default async function PurchaseOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; status?: string; supplierId?: string  }>
}) {
  const query = (await searchParams).q || '';
  const page = Number((await searchParams).page) || 1;
  const statusFilter = (await searchParams).status || '';
  const supplierId = (await searchParams).supplierId || '';

  const [stats, result] = await Promise.all([
    prisma.purchaseOrder.aggregate({
      _count: { _all: true },
      _sum: { grandTotal: true },
    }),
    getPurchaseOrders({ page, limit: 15, search: query, status: statusFilter, supplierId }),
  ]);

  const pos = result.success ? result.data?.pos || [] : [];
  const totalCount = result.success ? result.data?.totalCount || 0 : 0;

  return (
    <div className="flex flex-col gap-6 p-6 pb-24 max-w-[1600px] mx-auto">
      {/* Header section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Purchase Orders</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Create, track, and manage purchase orders to your suppliers.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/purchases/new">
            <Plus className="mr-2 h-4 w-4" />
            Create PO
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Total Orders</h3>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold">{stats._count._all}</div>
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Total PO Value</h3>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold">৳{(stats._sum.grandTotal || 0).toLocaleString()}</div>
        </div>
      </div>

      {/* Table Area */}
      <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-muted/20 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <form className="relative flex-1 max-w-md">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              name="q"
              defaultValue={query}
              placeholder="Search PO number..."
              className="pl-8 bg-background"
            />
            {supplierId && <input type="hidden" name="supplierId" value={supplierId} />}
          </form>
          <Button variant="outline" className="shrink-0 bg-background">
            <Filter className="mr-2 h-4 w-4" />
            Filters
          </Button>
        </div>
        
        {pos.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>PO Number</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-center">Items</TableHead>
                  <TableHead className="text-right">Grand Total</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pos.map((po) => (
                  <TableRow key={po.id} className="hover:bg-muted/20">
                    <TableCell className="whitespace-nowrap">
                      {new Date(po.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="font-mono font-medium text-primary">
                      <Link href={`/admin/purchases/${po.id}`}>
                        {po.poNumber}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{po.supplier.name}</div>
                      {po.supplier.companyName && (
                        <div className="text-[10px] text-muted-foreground">{po.supplier.companyName}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{po.warehouse?.name || 'Unassigned'}</div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="font-mono">{po._count.items}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono font-medium">
                      ৳{po.grandTotal.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={getStatusColor(po.status) as any} className="text-[10px] uppercase">
                        {po.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/purchases/${po.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          {po.status === 'DRAFT' && (
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/purchases/edit/${po.id}`}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit PO
                              </Link>
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <PackageSearch className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-medium mb-2">No purchase orders found</h3>
            <p className="text-sm text-muted-foreground max-w-sm mb-6">
              {query ? `No results found for "${query}". Try adjusting your search.` : 'Get started by creating your first purchase order.'}
            </p>
            {!query && (
              <Button asChild>
                <Link href="/admin/purchases/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Create PO
                </Link>
              </Button>
            )}
          </div>
        )}
        
        {totalCount > 15 && (
          <div className="p-4 border-t text-xs text-muted-foreground text-center bg-muted/10">
            Showing {pos.length} of {totalCount} POs. Pagination controls pending.
          </div>
        )}
      </div>
    </div>
  );
}
