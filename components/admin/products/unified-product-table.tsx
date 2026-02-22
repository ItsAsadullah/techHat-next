"use client";

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  RowSelectionState,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Package, PackagePlus, PackageMinus, Archive, Trash2, CheckSquare } from "lucide-react";
import { BulkActionModal, BulkActionType } from "./bulk-action-modal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface UnifiedProductTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  pageCount: number;
}

export function UnifiedProductTable<TData, TValue>({
  columns,
  data,
  pageCount,
}: UnifiedProductTableProps<TData, TValue>) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  
  // Bulk Action State
  const [bulkActionOpen, setBulkActionOpen] = useState(false);
  const [currentBulkAction, setCurrentBulkAction] = useState<BulkActionType>(null);

  // Pagination state from URL
  const page = Number(searchParams.get("page")) || 1;
  const ALLOWED_LIMITS = [10, 20, 50, 100];
  const rawLimit = Number(searchParams.get("limit"));
  const pageSize = ALLOWED_LIMITS.includes(rawLimit) ? rawLimit : 20;

  const table = useReactTable({
    data,
    columns,
    pageCount,
    state: {
      rowSelection,
      pagination: {
        pageIndex: page - 1,
        pageSize,
      },
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row: any) => row.id, // Important for rowSelection to store IDs
    manualPagination: true,
    onPaginationChange: (updater) => {
        // We handle pagination via URL, so we don't strictly need this unless we want to use table.setPageIndex
        // But since we drive state from URL, we just push URL on click.
    }
  });

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.push(`?${params.toString()}`);
  };

  const selectedCount = Object.keys(rowSelection).length;
  const selectedIds = Object.keys(rowSelection);

  const openBulkAction = (action: BulkActionType) => {
    // Need to defer state update slightly to avoid conflict with dropdown closing
    setTimeout(() => {
        setCurrentBulkAction(action);
        setBulkActionOpen(true);
    }, 100);
  };

  const handleBulkSuccess = () => {
    setRowSelection({});
    router.refresh();
  };

  return (
    <div className="space-y-4">
      {/* Bulk Action Modal */}
      <BulkActionModal 
        open={bulkActionOpen}
        onOpenChange={setBulkActionOpen}
        selectedIds={selectedIds}
        actionType={currentBulkAction}
        onSuccess={handleBulkSuccess}
      />

      {/* Bulk Actions Bar */}
      {selectedCount > 0 && (
          <div className="bg-gray-900 text-white px-4 py-2 rounded-md flex items-center justify-between shadow-lg animate-in slide-in-from-bottom-2 fade-in">
              <div className="flex items-center gap-4">
                 <span className="text-sm font-medium bg-gray-800 px-2 py-1 rounded">{selectedCount} selected</span>
                 <div className="h-4 w-px bg-gray-700"></div>
                 <span className="text-xs text-gray-400">Apply actions to selected items</span>
              </div>
              <div className="flex gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="secondary" size="sm" className="hover:bg-gray-200 text-gray-900">
                        Bulk Actions ▼
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel>Inventory</DropdownMenuLabel>
                      <DropdownMenuItem onSelect={() => openBulkAction('add_stock')}>
                        <PackagePlus className="mr-2 h-4 w-4" /> Add Stock
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => openBulkAction('reduce_stock')}>
                        <PackageMinus className="mr-2 h-4 w-4" /> Reduce Stock
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel>Status</DropdownMenuLabel>
                      <DropdownMenuItem onSelect={() => openBulkAction('change_status')}>
                        <Archive className="mr-2 h-4 w-4" /> Update Status
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onSelect={() => openBulkAction('delete')} className="text-red-600 focus:text-red-600 focus:bg-red-50">
                        <Trash2 className="mr-2 h-4 w-4" /> Delete Products
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-gray-400 hover:text-white hover:bg-gray-800"
                    onClick={() => setRowSelection({})}
                  >
                      Clear Selection
                  </Button>
              </div>
          </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-gray-50/80 border-b border-gray-100">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent border-gray-100">
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} className="font-semibold text-gray-600 uppercase text-xs tracking-wider h-12">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="hover:bg-blue-50/30 transition-colors border-gray-50 data-[state=selected]:bg-blue-50"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-3 px-4">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-32 text-center"
                >
                  <div className="flex flex-col items-center justify-center text-gray-500">
                      <div className="bg-gray-100 p-3 rounded-full mb-2">
                          <Package className="h-6 w-6 text-gray-400" />
                      </div>
                      <p>No products found matching your filters.</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between px-2">
        <div className="flex-1 text-sm text-muted-foreground">
          {Object.keys(rowSelection).length} of{" "}
          {data.length} row(s) selected.
        </div>
        <div className="flex items-center space-x-6 lg:space-x-8">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium">
              Page {page} of {pageCount}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => handlePageChange(1)}
              disabled={page === 1}
            >
              <span className="sr-only">Go to first page</span>
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
            >
              <span className="sr-only">Go to previous page</span>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => handlePageChange(page + 1)}
              disabled={page === pageCount}
            >
              <span className="sr-only">Go to next page</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => handlePageChange(pageCount)}
              disabled={page === pageCount}
            >
              <span className="sr-only">Go to last page</span>
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
