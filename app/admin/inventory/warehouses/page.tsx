import { getWarehouses } from '@/lib/actions/warehouse-actions';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Plus, Search, Edit2, MapPin, Building2, BarChart3 } from 'lucide-react';
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

export const dynamic = 'force-dynamic';

function getWarehouseTypeBadge(type: string) {
  switch (type) {
    case 'MAIN':
      return <Badge variant="outline" className="bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/20 text-[10px] font-bold">MAIN HUB</Badge>;
    case 'STORE':
      return <Badge variant="outline" className="bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20 text-[10px] font-bold">STORE</Badge>;
    case 'DAMAGE':
      return <Badge variant="outline" className="bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20 text-[10px] font-bold">DAMAGE / QUARANTINE</Badge>;
    case 'TRANSIT':
      return <Badge variant="outline" className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20 text-[10px] font-bold">IN-TRANSIT</Badge>;
    default:
      return <Badge variant="outline" className="text-[10px] font-bold">{type}</Badge>;
  }
}

export default async function WarehousesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const query = (await searchParams).q || '';
  const page = parseInt((await searchParams).page || '1');

  const res = await getWarehouses({ search: query, page, limit: 20 });
  const warehouses = res.success ? res.data?.warehouses || [] : [];

  return (
    <div className="space-y-5">
      {/* Header & Controls Card */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-5 rounded-xl border shadow-sm">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
            <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg font-bold tracking-tight">Warehouses & Storage Locations</h2>
              <Badge variant="secondary" className="font-mono text-xs">{warehouses.length} Locations</Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Manage main hubs, retail branches, and quarantine/damage zones across your network.
            </p>
          </div>
        </div>
        <div className="flex w-full sm:w-auto items-center gap-2.5">
          <form className="relative flex-1 sm:w-[260px]">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              name="q"
              defaultValue={query}
              placeholder="Search warehouse or code..."
              className="pl-9 h-9 bg-muted/40 text-sm"
            />
          </form>
          <Button size="sm" className="h-9 shadow-sm shrink-0" asChild>
            <Link href="/admin/inventory/warehouses/new">
              <Plus className="mr-1.5 h-4 w-4" /> Add Warehouse
            </Link>
          </Button>
        </div>
      </div>

      {/* Table Card */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="text-xs uppercase tracking-wider font-semibold">Facility Name & Address</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-semibold">Location Code</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-semibold">Facility Type</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-semibold">Operational Status</TableHead>
                <TableHead className="text-right text-xs uppercase tracking-wider font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {warehouses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-16">
                    <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                      <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center mb-3">
                        <Building2 className="h-6 w-6 text-blue-600" />
                      </div>
                      <h3 className="text-sm font-semibold">No warehouses found</h3>
                      <p className="text-xs text-muted-foreground mt-1 mb-4">
                        Add your first main warehouse, store branch, or damage location to start tracking stock.
                      </p>
                      <Button size="sm" asChild>
                        <Link href="/admin/inventory/warehouses/new">
                          <Plus className="mr-1.5 h-4 w-4" /> Create Warehouse
                        </Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                warehouses.map((wh: any) => (
                  <TableRow key={wh.id} className="hover:bg-muted/20 transition-colors">
                    <TableCell>
                      <div className="font-semibold text-sm text-foreground">{wh.name}</div>
                      {wh.address ? (
                        <div className="flex items-center text-xs text-muted-foreground mt-1">
                          <MapPin className="h-3 w-3 mr-1 shrink-0 text-muted-foreground/70" /> {wh.address}
                        </div>
                      ) : (
                        <div className="text-[11px] text-muted-foreground/60 mt-0.5 italic">No address specified</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <code className="text-xs font-mono font-bold bg-muted px-2.5 py-1 rounded border">
                        {wh.code}
                      </code>
                    </TableCell>
                    <TableCell>
                      {getWarehouseTypeBadge(wh.type)}
                    </TableCell>
                    <TableCell>
                      {wh.isActive ? (
                        <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20 border-emerald-500/20 shadow-none text-[10px]">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-muted-foreground shadow-none text-[10px]">
                          Inactive
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <Button variant="ghost" size="sm" className="h-8 text-xs" asChild>
                          <Link href={`/admin/inventory/warehouses/${wh.id}/analytics`}>
                            <BarChart3 className="h-3.5 w-3.5 mr-1.5 text-indigo-500" /> Analytics
                          </Link>
                        </Button>
                        <Button variant="outline" size="sm" className="h-8 text-xs" asChild>
                          <Link href={`/admin/inventory/warehouses/${wh.id}`}>
                            <Edit2 className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" /> Manage
                          </Link>
                        </Button>
                      </div>
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
