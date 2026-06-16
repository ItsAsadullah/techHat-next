import { getWarehouses } from '@/lib/actions/warehouse-actions';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Plus, Search, Edit2, MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';

export default async function WarehousesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string  }>;
}) {
  const query = (await searchParams).q || '';
  const page = parseInt((await searchParams).page || '1');

  const res = await getWarehouses({ search: query, page, limit: 20 });
  const warehouses = res.success ? res.data?.warehouses || [] : [];

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-background p-4 rounded-xl border shadow-sm">
        <div>
          <h2 className="text-lg font-bold">Warehouses</h2>
          <p className="text-sm text-muted-foreground">Manage your storage locations and facilities.</p>
        </div>
        <div className="flex w-full sm:w-auto items-center gap-3">
          <form className="relative w-full sm:w-[300px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              name="q"
              defaultValue={query}
              placeholder="Search warehouses..."
              className="pl-9 bg-muted/50"
            />
          </form>
          <Button asChild>
            <Link href="/admin/inventory/warehouses/new">
              <Plus className="mr-2 h-4 w-4" /> Add Warehouse
            </Link>
          </Button>
        </div>
      </div>

      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead>Warehouse Details</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {warehouses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                    No warehouses found. <Link href="/admin/inventory/warehouses/new" className="text-primary hover:underline">Create one</Link> to get started.
                  </TableCell>
                </TableRow>
              ) : (
                warehouses.map((wh: any) => (
                  <TableRow key={wh.id} className="hover:bg-muted/10">
                    <TableCell>
                      <div className="font-semibold text-sm">{wh.name}</div>
                      {wh.address && (
                        <div className="flex items-center text-xs text-muted-foreground mt-1">
                          <MapPin className="h-3 w-3 mr-1" /> {wh.address}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-2 py-1 rounded">{wh.code}</code>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20 hover:bg-blue-500/20">
                        {wh.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {wh.isActive ? (
                        <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-500/20 shadow-none">Active</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-muted-foreground shadow-none">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/admin/inventory/warehouses/${wh.id}`}>
                          <Edit2 className="h-4 w-4 mr-2 text-muted-foreground" /> Manage
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
