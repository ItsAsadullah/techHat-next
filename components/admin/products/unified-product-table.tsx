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
import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Package, PackagePlus, PackageMinus, Archive, Trash2, CheckSquare, Loader2, ArrowUpRight, ArrowDownRight, History, MoreVertical, Plus, Minus, X } from "lucide-react";
import { BulkActionModal, BulkActionType } from "./bulk-action-modal";
import { getProducts, updateStock } from "@/lib/actions/product-stock-actions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Image from "next/image";
import Link from "next/link";

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
  const [isSelectMode, setIsSelectMode] = useState(false);
  
  // Bulk Action State
  const [bulkActionOpen, setBulkActionOpen] = useState(false);
  const [currentBulkAction, setCurrentBulkAction] = useState<BulkActionType>(null);

  // Pagination state from URL
  const page = Number(searchParams.get("page")) || 1;
  const ALLOWED_LIMITS = [10, 20, 50, 100];
  const rawLimit = Number(searchParams.get("limit"));
  const pageSize = ALLOWED_LIMITS.includes(rawLimit) ? rawLimit : 20;

  // Infinite Scroll & Expandable Row State
  const [localData, setLocalData] = useState<TData[]>(data);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(page < pageCount);
  const [currentPage, setCurrentPage] = useState(page);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [updatingStockId, setUpdatingStockId] = useState<string | null>(null);

  const handleInlineStockUpdate = async (productId: string, action: 'ADD' | 'REDUCE', qty: number) => {
      setUpdatingStockId(productId);
      const res = await updateStock(productId, null, action, qty, "Quick Update", `Inline ${action} ${qty}`);
      if (res.success) {
         setLocalData(prev => prev.map(p => (p as any).id === productId ? { ...p, stock: (res as any).newStock } : p));
      }
      setUpdatingStockId(null);
  };

  // Sync data when props change
  useEffect(() => {
    setLocalData(data);
    setCurrentPage(page);
    setHasMore(page < pageCount);
  }, [data, page, pageCount]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const nextPage = currentPage + 1;
      const res = await getProducts({
        page: nextPage,
        limit: pageSize,
        search: searchParams.get('search') || undefined,
        categoryId: searchParams.get('category') || undefined,
        brandId: searchParams.get('brand') || undefined,
        stockStatus: searchParams.get('stock_status') as any,
        status: searchParams.get('status') as any,
      });

      if (res.products) {
        const formatted = res.products.map((p: any) => ({
          id: p.id,
          name: p.name,
          price: p.price,
          costPrice: p.costPrice,
          stock: p.stock,
          category: p.category?.name || '',
          status: p.isActive,
          images: p.productImages || [],
          variants: p.variants || [],
          minStock: p.minStock,
          updatedAt: p.updatedAt,
          sku: p.sku,
        })) as unknown as TData[];
        
        setLocalData((prev) => [...prev, ...formatted]);
        setCurrentPage(nextPage);
        setHasMore(nextPage < res.totalPages);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMore(false);
    }
  }, [currentPage, hasMore, loadingMore, pageSize, searchParams]);

  const observerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !loadingMore) {
        loadMore();
      }
    }, { rootMargin: '200px' });
    
    if (observerRef.current) observer.observe(observerRef.current);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, loadMore]);

  // PERF: Memoize columns so useReactTable doesn't re-calculate table structure
  // on every render (which happens when row selection changes or bulk actions open)
  const memoizedColumns = useMemo(() => columns, [columns]);

  const table = useReactTable({
    data: localData,
    columns: memoizedColumns,
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

  const handleLimitChange = (newLimit: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("limit", newLimit.toString());
    params.set("page", "1"); // Reset to page 1 when changing limit
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

      {/* ── Bulk Actions Bar ── */}
      {selectedCount > 0 && (
          <div className="sticky bottom-[60px] md:static z-40 mx-2 md:mx-0 mb-2 md:mb-0 bg-slate-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-3 py-2 rounded-md flex items-center justify-between shadow-xl shadow-slate-900/10 dark:shadow-none animate-in slide-in-from-bottom-4 fade-in">
              <div className="flex items-center gap-2">
                 <span className="text-xs font-bold bg-indigo-600 text-white px-2 py-0.5 rounded">{selectedCount}</span>
                 <div className="hidden md:block h-3 w-px bg-slate-700 dark:bg-zinc-300"></div>
                 <span className="hidden md:inline text-xs font-medium text-slate-300 dark:text-zinc-600">Selected</span>
              </div>
              <div className="flex items-center gap-1.5">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="secondary" size="sm" className="h-8 px-3 rounded text-xs font-semibold bg-white/10 dark:bg-zinc-900/10 hover:bg-white/20 dark:hover:bg-zinc-900/20 text-white dark:text-zinc-900 border-none transition-colors">
                        Actions <ChevronRight className="ml-1 h-3 w-3 rotate-90" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 rounded-md p-1 font-medium">
                      <DropdownMenuLabel className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide px-2 py-1">Inventory</DropdownMenuLabel>
                      <DropdownMenuItem onSelect={() => openBulkAction('add_stock')} className="rounded focus:bg-slate-50 dark:focus:bg-zinc-800 cursor-pointer text-sm">
                        <PackagePlus className="mr-2 h-3.5 w-3.5 text-indigo-500" /> Add Stock
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => openBulkAction('reduce_stock')} className="rounded focus:bg-slate-50 dark:focus:bg-zinc-800 cursor-pointer text-sm">
                        <PackageMinus className="mr-2 h-3.5 w-3.5 text-amber-500" /> Reduce Stock
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="my-1" />
                      <DropdownMenuLabel className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide px-2 py-1">Status</DropdownMenuLabel>
                      <DropdownMenuItem onSelect={() => openBulkAction('change_status')} className="rounded focus:bg-slate-50 dark:focus:bg-zinc-800 cursor-pointer text-sm">
                        <Archive className="mr-2 h-3.5 w-3.5 text-emerald-500" /> Update Status
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="my-1" />
                      <DropdownMenuItem onSelect={() => openBulkAction('delete')} className="rounded text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950 cursor-pointer text-sm">
                        <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0 rounded text-slate-400 hover:text-white hover:bg-white/10 dark:text-zinc-500 dark:hover:text-zinc-900 dark:hover:bg-zinc-900/10"
                    onClick={() => setRowSelection({})}
                    title="Clear selection"
                  >
                      <X className="h-4 w-4" />
                  </Button>
              </div>
          </div>
      )}

      <div className="hidden md:block overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50 dark:bg-zinc-900 border-y border-slate-200 dark:border-zinc-800">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent border-slate-200 dark:border-zinc-800">
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} className="font-semibold text-slate-600 dark:text-zinc-400 uppercase text-[10px] tracking-wide h-10">
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
                  className="hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-colors border-slate-100 dark:border-zinc-800/50 data-[state=selected]:bg-indigo-50 dark:data-[state=selected]:bg-indigo-900/20"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-2.5 px-4 text-sm font-medium">
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
                  className="h-24 text-center"
                >
                  <div className="flex flex-col items-center justify-center text-slate-400 dark:text-zinc-500">
                      <p className="font-medium text-sm">No products found.</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>      {/* ── Mobile Top Bar (List Header) ── */}
      <div className="md:hidden flex items-center justify-between px-3 py-2 bg-slate-50 dark:bg-zinc-900 border-t border-slate-200 dark:border-zinc-800">
        <span className="text-[10px] font-bold text-slate-500 dark:text-zinc-500 uppercase tracking-widest">{data.length} Products</span>
        <button 
           onClick={() => {
              setIsSelectMode(!isSelectMode);
              if (isSelectMode) setRowSelection({});
           }}
           className="text-[12px] font-bold text-indigo-600 dark:text-indigo-400 active:opacity-70 transition-opacity"
        >
          {isSelectMode ? "Done" : "Select"}
        </button>
      </div>

      {/* ── Mobile Dense List ── */}
      <div className="md:hidden flex flex-col pb-6 border-t border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
        {table.getRowModel().rows?.length ? (
          table.getRowModel().rows.map((row) => {
            const product = row.original as any;
            const imgUrl = product.images?.[0]?.url;
            const isSelected = row.getIsSelected();

            return (
              <div key={row.id} className="flex flex-col relative border-b border-slate-100 dark:border-zinc-800/50">
                <div 
                  className={`relative flex items-center gap-2 p-2 transition-colors ${
                    isSelected 
                    ? 'bg-indigo-50/50 dark:bg-indigo-900/10' 
                    : 'active:bg-slate-50 dark:active:bg-zinc-800/50'
                  }`}
                onClick={() => {
                  if (isSelectMode) row.toggleSelected();
                }}
              >
                {/* Checkbox (Only in select mode) */}
                {isSelectMode && (
                    <div className="shrink-0 pl-1" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={row.getToggleSelectedHandler()}
                          className="w-4 h-4 rounded border-slate-300 dark:border-zinc-700 text-indigo-600 focus:ring-indigo-500"
                        />
                    </div>
                )}

                {/* Image */}
                <div className="w-8 h-8 rounded border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 overflow-hidden relative shrink-0">
                  {imgUrl ? (
                    <Image src={imgUrl} alt={product.name} fill className="object-cover" sizes="32px" />
                  ) : (
                    <Package className="w-3.5 h-3.5 text-slate-400 absolute inset-0 m-auto" />
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0 flex flex-col justify-center ml-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-[13px] text-slate-900 dark:text-zinc-100 truncate leading-tight">
                      {product.name}
                    </p>
                    <span className="font-bold text-[13px] text-slate-900 dark:text-zinc-100 shrink-0">
                      ৳{product.price.toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between mt-0.5">
                    <div className="flex items-center gap-1.5 text-[11px]">
                      <span className="text-slate-500 dark:text-zinc-400 truncate max-w-[80px]">
                        {product.sku || "No SKU"}
                      </span>
                      <span className="text-slate-300 dark:text-zinc-600">•</span>
                      <span className={`font-bold ${
                        product.stock <= 0 
                          ? 'text-red-600' 
                          : product.stock <= (product.minStock || 5) / 2
                            ? 'text-rose-600'
                            : product.stock <= (product.minStock || 5)
                              ? 'text-amber-600' 
                              : 'text-emerald-600'
                      }`}>
                        {product.stock <= 0 ? 'Out of Stock' : product.stock <= (product.minStock || 5) / 2 ? 'Critical' : product.stock <= (product.minStock || 5) ? 'Low Stock' : 'Healthy'}
                      </span>
                    </div>
                    <button 
                      onClick={() => setExpandedRowId(expandedRowId === product.id ? null : product.id)}
                      className="text-[10px] font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 dark:text-indigo-400 px-2 py-0.5 rounded mr-1"
                    >
                      Adjust
                    </button>
                  </div>
                </div>

                {/* Dropdown Menu replacing actions */}
                <div className="shrink-0">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="w-6 h-8 flex items-center justify-center text-slate-400 transition-colors">
                                <MoreVertical className="w-4 h-4" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-32 rounded-md">
                            <DropdownMenuItem asChild className="rounded font-medium cursor-pointer text-sm">
                              <Link href={`/admin/products/edit/${product.id}`}>Edit Product</Link>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
              </div>
              
              {/* Expandable Action Panel */}
              {expandedRowId === product.id && (
                <div className="bg-slate-50 dark:bg-zinc-900/50 p-2 pl-12 flex flex-col gap-2 border-t border-slate-100 dark:border-zinc-800 animate-in slide-in-from-top-2 fade-in">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                    <span>Quick Adjust</span>
                    <span className="text-slate-700 dark:text-zinc-300">Current: {product.stock}</span>
                  </div>
                  
                  {updatingStockId === product.id ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleInlineStockUpdate(product.id, 'ADD', 10)} className="flex-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 py-1.5 rounded text-xs font-bold hover:bg-emerald-200 active:bg-emerald-300 transition-colors">
                          +10
                        </button>
                        <button onClick={() => handleInlineStockUpdate(product.id, 'ADD', 20)} className="flex-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 py-1.5 rounded text-xs font-bold hover:bg-emerald-200 active:bg-emerald-300 transition-colors">
                          +20
                        </button>
                        <button onClick={() => handleInlineStockUpdate(product.id, 'ADD', 50)} className="flex-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 py-1.5 rounded text-xs font-bold hover:bg-emerald-200 active:bg-emerald-300 transition-colors">
                          +50
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleInlineStockUpdate(product.id, 'REDUCE', 1)} className="flex-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 py-1.5 rounded text-xs font-bold hover:bg-red-200 active:bg-red-300 transition-colors">
                          -1
                        </button>
                        <button onClick={() => handleInlineStockUpdate(product.id, 'REDUCE', 5)} className="flex-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 py-1.5 rounded text-xs font-bold hover:bg-red-200 active:bg-red-300 transition-colors">
                          -5
                        </button>
                        <button onClick={() => handleInlineStockUpdate(product.id, 'REDUCE', 10)} className="flex-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 py-1.5 rounded text-xs font-bold hover:bg-red-200 active:bg-red-300 transition-colors">
                          -10
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          );
          })
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400 dark:text-zinc-600">
            <Package className="h-6 w-6 mb-2" />
            <p className="text-sm font-medium">No products found</p>
          </div>
        )}
        
        {/* Infinite Scroll Trigger */}
        {hasMore && (
          <div ref={observerRef} className="py-6 flex justify-center items-center">
            <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
          </div>
        )}
      </div>

      {/* ── Pagination Controls ── */}
      {/* ── Desktop Pagination Controls ── */}
      <div className="hidden md:flex flex-row items-center justify-between px-2 md:px-0 gap-4 mt-3">
        <div className="text-xs font-medium text-slate-500 dark:text-zinc-400">
          {Object.keys(rowSelection).length} of{" "}
          {data.length} row(s) selected.
        </div>
        <div className="flex flex-row items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-600 dark:text-zinc-300 mr-2">Rows per page:</span>
            <select
              className="h-8 w-[60px] rounded-md border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1 text-xs font-medium focus:ring-1 focus:ring-indigo-500"
              value={pageSize}
              onChange={(e) => handleLimitChange(Number(e.target.value))}
            >
              {ALLOWED_LIMITS.map((limit) => (
                <option key={limit} value={limit}>
                  {limit}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-xs font-medium text-slate-700 dark:text-zinc-300 px-2">
              Page {page} of {pageCount}
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                className="h-8 w-8 p-0 rounded-md border-slate-200 dark:border-zinc-700"
                onClick={() => handlePageChange(1)}
                disabled={page === 1}
              >
                <span className="sr-only">First page</span>
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="h-8 w-8 p-0 rounded-md border-slate-200 dark:border-zinc-700"
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
              >
                <span className="sr-only">Previous page</span>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="h-8 w-8 p-0 rounded-md border-slate-200 dark:border-zinc-700"
                onClick={() => handlePageChange(page + 1)}
                disabled={page === pageCount}
              >
                <span className="sr-only">Next page</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="h-8 w-8 p-0 rounded-md border-slate-200 dark:border-zinc-700"
                onClick={() => handlePageChange(pageCount)}
                disabled={page === pageCount}
              >
                <span className="sr-only">Last page</span>
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
