import { Metadata } from 'next';
import { PackageSearch, Plus, Search, Filter, MoreHorizontal, Edit, Eye, Building2, Phone } from "lucide-react";
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
import { getSuppliers } from '@/lib/actions/supplier-actions';

export const metadata: Metadata = {
  title: 'Supplier Management | ERP',
  description: 'Manage vendors and suppliers for purchasing',
};

export default async function SuppliersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; status?: string  }>
}) {
  const query = (await searchParams).q || '';
  const page = Number((await searchParams).page) || 1;
  const statusFilter = (await searchParams).status || '';

  const [stats, result] = await Promise.all([
    prisma.supplier.aggregate({
      _count: { _all: true },
      _sum: { openingBalance: true },
    }),
    getSuppliers({ page, limit: 15, search: query, status: statusFilter }),
  ]);

  const suppliers = result.success ? result.data?.suppliers || [] : [];
  const totalCount = result.success ? result.data?.totalCount || 0 : 0;

  return (
    <div className="flex flex-col gap-6 p-6 pb-24 max-w-[1600px] mx-auto">
      {/* Header section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Suppliers</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Manage your purchase vendors, outstanding balances, and supplier performance.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/suppliers/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Supplier
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Total Suppliers</h3>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold">{stats._count._all}</div>
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Total Opening Balances</h3>
          </div>
          <div className="text-2xl font-bold">৳{(stats._sum.openingBalance || 0).toLocaleString()}</div>
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
              placeholder="Search suppliers by name, code, phone..."
              className="pl-8 bg-background"
            />
          </form>
          <Button variant="outline" className="shrink-0 bg-background">
            <Filter className="mr-2 h-4 w-4" />
            Filters
          </Button>
        </div>
        
        {suppliers.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {suppliers.map((supplier) => (
                  <TableRow key={supplier.id} className="hover:bg-muted/20">
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {supplier.supplierCode}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{supplier.name}</div>
                      {supplier.companyName && (
                        <div className="text-xs text-muted-foreground">{supplier.companyName}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-sm">
                        <Phone className="h-3 w-3 text-muted-foreground" />
                        {supplier.phone}
                      </div>
                      {supplier.contactPerson && (
                        <div className="text-xs text-muted-foreground mt-0.5">{supplier.contactPerson}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{supplier.district || '-'}</div>
                      <div className="text-xs text-muted-foreground">{supplier.country || 'Bangladesh'}</div>
                    </TableCell>
                    <TableCell className="text-right font-mono font-medium">
                      ৳{supplier.openingBalance.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={supplier.status === 'ACTIVE' ? 'default' : 'secondary'} className="text-[10px] uppercase">
                        {supplier.status}
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
                            <Link href={`/admin/suppliers/${supplier.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/suppliers/edit/${supplier.id}`}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Supplier
                            </Link>
                          </DropdownMenuItem>
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
            <h3 className="text-lg font-medium mb-2">No suppliers found</h3>
            <p className="text-sm text-muted-foreground max-w-sm mb-6">
              {query ? `No results found for "${query}". Try adjusting your search.` : 'Get started by adding your first supplier to track purchases and ledger balances.'}
            </p>
            {!query && (
              <Button asChild>
                <Link href="/admin/suppliers/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Supplier
                </Link>
              </Button>
            )}
          </div>
        )}
        
        {totalCount > 15 && (
          <div className="p-4 border-t text-xs text-muted-foreground text-center bg-muted/10">
            Showing {suppliers.length} of {totalCount} suppliers. Pagination controls pending.
          </div>
        )}
      </div>
    </div>
  );
}
