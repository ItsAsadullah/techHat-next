"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getProductStockHistory } from "@/lib/actions/product-history-actions";
import { format } from "date-fns";
import {
  ArrowDownRight,
  ArrowUpRight,
  ExternalLink,
  History,
  Loader2,
  Package,
  Receipt,
  ShoppingCart,
  Truck,
} from "lucide-react";
import Link from "next/link";

interface StockHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string | null;
  productName?: string;
}

const TYPE_COLORS: Record<string, string> = {
  GRN: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:text-emerald-400",
  "POS Sale": "bg-blue-500/10 text-blue-700 border-blue-500/20 dark:text-blue-400",
  ONLINE_SALE: "bg-indigo-500/10 text-indigo-700 border-indigo-500/20 dark:text-indigo-400",
  SALE: "bg-blue-500/10 text-blue-700 border-blue-500/20 dark:text-blue-400",
  RETURN: "bg-purple-500/10 text-purple-700 border-purple-500/20 dark:text-purple-400",
  EXCHANGE: "bg-violet-500/10 text-violet-700 border-violet-500/20 dark:text-violet-400",
  PURCHASE_RETURN: "bg-rose-500/10 text-rose-700 border-rose-500/20 dark:text-rose-400",
  ADJUSTMENT: "bg-amber-500/10 text-amber-700 border-amber-500/20 dark:text-amber-400",
  TRANSFER_DISPATCH: "bg-orange-500/10 text-orange-700 border-orange-500/20 dark:text-orange-400",
  TRANSFER_RECEIPT: "bg-teal-500/10 text-teal-700 border-teal-500/20 dark:text-teal-400",
  ADD: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:text-emerald-400",
  REDUCE: "bg-rose-500/10 text-rose-700 border-rose-500/20 dark:text-rose-400",
};

function safeFormatDate(dateVal: string | Date | null | undefined, fmt = "dd MMM yyyy, HH:mm") {
  if (!dateVal) return "—";
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return "—";
  return format(d, fmt);
}

export function StockHistoryModal({
  isOpen,
  onClose,
  productId,
  productName,
}: StockHistoryModalProps) {
  const [data, setData] = useState<Awaited<ReturnType<typeof getProductStockHistory>> | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && productId) {
      setIsLoading(true);
      getProductStockHistory(productId)
        .then((res) => setData(res))
        .catch((err) => {
          console.error("Error loading stock history:", err);
        })
        .finally(() => setIsLoading(false));
    }
  }, [isOpen, productId]);

  const movements = data?.movements || [];
  const grnItems = data?.grnItems || [];
  const poItems = data?.poItems || [];
  const orderItems = data?.orderItems || [];
  const summary = data?.summary || {
    currentStock: 0,
    totalIn: 0,
    totalOut: 0,
    costPrice: 0,
    lastPurchaseCost: 0,
  };
  const product = data?.product;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[900px] max-h-[88vh] flex flex-col p-0 overflow-hidden bg-white dark:bg-zinc-950 border-slate-200 dark:border-zinc-800">
        {/* Header */}
        <DialogHeader className="px-6 pt-5 pb-4 border-b border-slate-100 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-900/50 shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pr-6">
            <div>
              <DialogTitle className="text-base font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                <History className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span>Stock History</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 dark:text-zinc-400 mt-1 flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-slate-700 dark:text-zinc-300">
                  {product?.name || productName || "Product"}
                </span>
                {product?.sku && (
                  <span className="font-mono text-[10px] bg-slate-200/70 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-slate-700 dark:text-zinc-300">
                    SKU: {product.sku}
                  </span>
                )}
                {product?.model && (
                  <span className="font-mono text-[10px] bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-200 dark:border-indigo-800">
                    {product.model}
                  </span>
                )}
              </DialogDescription>
            </div>

            {productId && (
              <div className="flex items-center gap-2 shrink-0">
                <Button variant="outline" size="sm" className="h-7 text-xs px-2.5" asChild>
                  <Link href={`/admin/inventory/ledger?productId=${productId}`} onClick={onClose}>
                    <ExternalLink className="h-3 w-3 mr-1.5" />
                    Full Ledger
                  </Link>
                </Button>
                <Button variant="outline" size="sm" className="h-7 text-xs px-2.5" asChild>
                  <Link href={`/admin/products/${productId}`} onClick={onClose}>
                    <Package className="h-3 w-3 mr-1.5" />
                    Product Details
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </DialogHeader>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-500 gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
              <span className="text-xs font-medium">Loading stock history...</span>
            </div>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/40 p-3">
                  <p className="text-[11px] font-medium text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                    Current Stock
                  </p>
                  <p className="text-lg font-bold font-mono text-slate-900 dark:text-zinc-100 mt-0.5">
                    {summary.currentStock}{" "}
                    <span className="text-xs font-normal text-slate-400">units</span>
                  </p>
                </div>

                <div className="rounded-lg border border-emerald-200/60 dark:border-emerald-900/40 bg-emerald-50/40 dark:bg-emerald-950/20 p-3">
                  <p className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                    Total Stock In
                  </p>
                  <p className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
                    +{summary.totalIn}{" "}
                    <span className="text-xs font-normal opacity-75">units</span>
                  </p>
                </div>

                <div className="rounded-lg border border-rose-200/60 dark:border-rose-900/40 bg-rose-50/40 dark:bg-rose-950/20 p-3">
                  <p className="text-[11px] font-medium text-rose-700 dark:text-rose-400 uppercase tracking-wider">
                    Total Stock Out
                  </p>
                  <p className="text-lg font-bold font-mono text-rose-600 dark:text-rose-400 mt-0.5">
                    -{summary.totalOut}{" "}
                    <span className="text-xs font-normal opacity-75">units</span>
                  </p>
                </div>

                <div className="rounded-lg border border-indigo-200/60 dark:border-indigo-900/40 bg-indigo-50/40 dark:bg-indigo-950/20 p-3">
                  <p className="text-[11px] font-medium text-indigo-700 dark:text-indigo-400 uppercase tracking-wider">
                    Moving Avg Cost
                  </p>
                  <p className="text-lg font-bold font-mono text-indigo-600 dark:text-indigo-400 mt-0.5">
                    ৳{Number(summary.costPrice || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              {/* Variants Breakdown (if multiple variants) */}
              {product?.variants && product.variants.length > 1 && (
                <div className="rounded-lg border border-slate-200 dark:border-zinc-800 p-3 bg-slate-50/30 dark:bg-zinc-900/20">
                  <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Variant Stock Breakdown
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {product.variants.map((v) => (
                      <div
                        key={v.id}
                        className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs"
                      >
                        <span className="font-medium text-slate-700 dark:text-zinc-300">{v.name}</span>
                        <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                          {v.stock} units
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tabs */}
              <Tabs defaultValue="movements" className="w-full">
                <TabsList className="bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 h-9 p-0.5 w-full sm:w-auto justify-start">
                  <TabsTrigger value="movements" className="text-xs h-8 px-3">
                    Stock Movements ({movements.length})
                  </TabsTrigger>
                  <TabsTrigger value="purchases" className="text-xs h-8 px-3">
                    Purchases & GRN ({grnItems.length + poItems.length})
                  </TabsTrigger>
                  <TabsTrigger value="sales" className="text-xs h-8 px-3">
                    Sales Orders ({orderItems.length})
                  </TabsTrigger>
                </TabsList>

                {/* Tab 1: Stock Movements (Ledger + Legacy + Orders) */}
                <TabsContent value="movements" className="mt-3">
                  {movements.length === 0 ? (
                    <div className="py-12 text-center border border-dashed rounded-lg bg-slate-50/50 dark:bg-zinc-900/30">
                      <History className="mx-auto h-8 w-8 text-slate-300 dark:text-zinc-600 mb-2" />
                      <h4 className="text-sm font-semibold text-slate-700 dark:text-zinc-300">
                        No Stock Movements Recorded
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                        No GRN receipts, sales, or stock adjustments found for this product yet.
                      </p>
                    </div>
                  ) : (
                    <div className="border border-slate-200 dark:border-zinc-800 rounded-lg overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left">
                          <thead className="bg-slate-50 dark:bg-zinc-900 text-slate-500 dark:text-zinc-400 uppercase border-b border-slate-200 dark:border-zinc-800">
                            <tr>
                              <th className="px-3 py-2.5 font-semibold whitespace-nowrap">Date</th>
                              <th className="px-3 py-2.5 font-semibold">Type & Note</th>
                              <th className="px-3 py-2.5 font-semibold">Warehouse</th>
                              <th className="px-3 py-2.5 font-semibold text-right">Opening</th>
                              <th className="px-3 py-2.5 font-semibold text-right">In</th>
                              <th className="px-3 py-2.5 font-semibold text-right">Out</th>
                              <th className="px-3 py-2.5 font-semibold text-right">Balance</th>
                              <th className="px-3 py-2.5 font-semibold text-right">Unit Cost</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/70">
                            {movements.map((m) => (
                              <tr
                                key={m.id}
                                className="hover:bg-slate-50/80 dark:hover:bg-zinc-900/40 transition-colors"
                              >
                                <td className="px-3 py-2.5 whitespace-nowrap font-mono text-[11px] text-slate-500 dark:text-zinc-400">
                                  {safeFormatDate(m.createdAt)}
                                </td>
                                <td className="px-3 py-2.5">
                                  <div className="flex flex-col gap-0.5">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span
                                        className={`inline-flex px-1.5 py-0.5 rounded border text-[10px] font-bold tracking-wide ${
                                          TYPE_COLORS[m.referenceType] ||
                                          "bg-slate-100 text-slate-700 border-slate-200 dark:bg-zinc-800 dark:text-zinc-300"
                                        }`}
                                      >
                                        {String(m.referenceType).replaceAll("_", " ")}
                                      </span>
                                      {m.variantName && (
                                        <span className="text-[10px] font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-1.5 py-0.5 rounded">
                                          {m.variantName}
                                        </span>
                                      )}
                                    </div>
                                    {(m.note || m.referenceId) && (
                                      <span
                                        className="text-[11px] text-slate-500 dark:text-zinc-400 line-clamp-1 max-w-[260px]"
                                        title={m.note || m.referenceId}
                                      >
                                        {m.note || `Ref: ${m.referenceId}`}
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-3 py-2.5 whitespace-nowrap">
                                  <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300">
                                    {m.warehouseName}
                                  </span>
                                </td>
                                <td className="px-3 py-2.5 text-right font-mono text-slate-500">
                                  {m.openingQty}
                                </td>
                                <td className="px-3 py-2.5 text-right font-mono">
                                  {m.inQty > 0 ? (
                                    <span className="inline-flex items-center justify-end gap-0.5 font-bold text-emerald-600 dark:text-emerald-400">
                                      <ArrowDownRight className="h-3 w-3" />+{m.inQty}
                                    </span>
                                  ) : (
                                    <span className="text-slate-300 dark:text-zinc-700">—</span>
                                  )}
                                </td>
                                <td className="px-3 py-2.5 text-right font-mono">
                                  {m.outQty > 0 ? (
                                    <span className="inline-flex items-center justify-end gap-0.5 font-bold text-rose-600 dark:text-rose-400">
                                      <ArrowUpRight className="h-3 w-3" />-{m.outQty}
                                    </span>
                                  ) : (
                                    <span className="text-slate-300 dark:text-zinc-700">—</span>
                                  )}
                                </td>
                                <td className="px-3 py-2.5 text-right font-mono font-bold text-slate-900 dark:text-zinc-100">
                                  {m.balanceQty}
                                </td>
                                <td className="px-3 py-2.5 text-right font-mono text-slate-600 dark:text-zinc-300">
                                  ৳{Number(m.unitCost || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </TabsContent>

                {/* Tab 2: Purchases & GRN */}
                <TabsContent value="purchases" className="mt-3 space-y-4">
                  {/* GRNs */}
                  <div className="border border-slate-200 dark:border-zinc-800 rounded-lg overflow-hidden">
                    <div className="px-4 py-2.5 bg-slate-50 dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 flex items-center gap-2">
                      <Truck className="h-3.5 w-3.5 text-emerald-600" />
                      <h4 className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                        Goods Receive Notes (GRN) ({grnItems.length})
                      </h4>
                    </div>
                    {grnItems.length === 0 ? (
                      <div className="py-6 text-center text-xs text-slate-500">
                        No GRN receipts found for this product.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left">
                          <thead className="bg-slate-50/50 dark:bg-zinc-900/50 text-slate-500 uppercase border-b border-slate-100 dark:border-zinc-800">
                            <tr>
                              <th className="px-3 py-2 font-semibold">Date</th>
                              <th className="px-3 py-2 font-semibold">GRN #</th>
                              <th className="px-3 py-2 font-semibold">PO #</th>
                              <th className="px-3 py-2 font-semibold">Supplier</th>
                              <th className="px-3 py-2 font-semibold">Warehouse</th>
                              <th className="px-3 py-2 font-semibold text-right">Accepted</th>
                              <th className="px-3 py-2 font-semibold text-right">Unit Cost</th>
                              <th className="px-3 py-2 font-semibold">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/70">
                            {grnItems.map((item: any) => (
                              <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-zinc-900/40">
                                <td className="px-3 py-2 whitespace-nowrap font-mono text-[11px] text-slate-500">
                                  {safeFormatDate(item.goodsReceiveNote?.receivedDate, "dd MMM yyyy")}
                                </td>
                                <td className="px-3 py-2 font-mono font-semibold text-emerald-700 dark:text-emerald-400">
                                  <Link
                                    href={`/admin/inventory/grn/${item.goodsReceiveNote?.id}`}
                                    onClick={onClose}
                                    className="hover:underline"
                                  >
                                    {item.goodsReceiveNote?.grnNumber}
                                  </Link>
                                </td>
                                <td className="px-3 py-2 font-mono text-slate-600 dark:text-zinc-400">
                                  {item.goodsReceiveNote?.purchaseOrder?.poNumber || "—"}
                                </td>
                                <td className="px-3 py-2 text-slate-700 dark:text-zinc-300">
                                  {item.goodsReceiveNote?.supplier?.name || "—"}
                                </td>
                                <td className="px-3 py-2 text-slate-600 dark:text-zinc-400">
                                  {item.goodsReceiveNote?.warehouse?.name || "—"}
                                </td>
                                <td className="px-3 py-2 text-right font-mono font-bold text-emerald-600">
                                  +{item.acceptedQty}
                                </td>
                                <td className="px-3 py-2 text-right font-mono">
                                  ৳{Number(item.unitCost || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                </td>
                                <td className="px-3 py-2">
                                  <Badge variant="outline" className="text-[10px] uppercase">
                                    {item.goodsReceiveNote?.status}
                                  </Badge>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Purchase Orders */}
                  <div className="border border-slate-200 dark:border-zinc-800 rounded-lg overflow-hidden">
                    <div className="px-4 py-2.5 bg-slate-50 dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 flex items-center gap-2">
                      <Receipt className="h-3.5 w-3.5 text-indigo-600" />
                      <h4 className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                        Purchase Orders ({poItems.length})
                      </h4>
                    </div>
                    {poItems.length === 0 ? (
                      <div className="py-6 text-center text-xs text-slate-500">
                        No Purchase Orders found for this product.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left">
                          <thead className="bg-slate-50/50 dark:bg-zinc-900/50 text-slate-500 uppercase border-b border-slate-100 dark:border-zinc-800">
                            <tr>
                              <th className="px-3 py-2 font-semibold">Date</th>
                              <th className="px-3 py-2 font-semibold">PO #</th>
                              <th className="px-3 py-2 font-semibold">Supplier</th>
                              <th className="px-3 py-2 font-semibold text-right">Ordered</th>
                              <th className="px-3 py-2 font-semibold text-right">Received</th>
                              <th className="px-3 py-2 font-semibold text-right">Unit Cost</th>
                              <th className="px-3 py-2 font-semibold">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/70">
                            {poItems.map((item: any) => (
                              <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-zinc-900/40">
                                <td className="px-3 py-2 whitespace-nowrap font-mono text-[11px] text-slate-500">
                                  {safeFormatDate(item.purchaseOrder?.date, "dd MMM yyyy")}
                                </td>
                                <td className="px-3 py-2 font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                                  <Link
                                    href={`/admin/purchases/${item.purchaseOrder?.id}`}
                                    onClick={onClose}
                                    className="hover:underline"
                                  >
                                    {item.purchaseOrder?.poNumber}
                                  </Link>
                                </td>
                                <td className="px-3 py-2 text-slate-700 dark:text-zinc-300">
                                  {item.purchaseOrder?.supplier?.name || "—"}
                                </td>
                                <td className="px-3 py-2 text-right font-mono">{item.quantity}</td>
                                <td className="px-3 py-2 text-right font-mono font-semibold text-emerald-600">
                                  {item.receivedQty}
                                </td>
                                <td className="px-3 py-2 text-right font-mono">
                                  ৳{Number(item.unitCost || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                </td>
                                <td className="px-3 py-2">
                                  <Badge variant="outline" className="text-[10px] uppercase">
                                    {item.purchaseOrder?.status}
                                  </Badge>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* Tab 3: Sales Orders */}
                <TabsContent value="sales" className="mt-3">
                  {orderItems.length === 0 ? (
                    <div className="py-12 text-center border border-dashed rounded-lg bg-slate-50/50 dark:bg-zinc-900/30">
                      <ShoppingCart className="mx-auto h-8 w-8 text-slate-300 dark:text-zinc-600 mb-2" />
                      <h4 className="text-sm font-semibold text-slate-700 dark:text-zinc-300">
                        No Sales Orders Yet
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                        This product has not been sold in any POS or Online orders yet.
                      </p>
                    </div>
                  ) : (
                    <div className="border border-slate-200 dark:border-zinc-800 rounded-lg overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left">
                          <thead className="bg-slate-50 dark:bg-zinc-900 text-slate-500 uppercase border-b border-slate-200 dark:border-zinc-800">
                            <tr>
                              <th className="px-3 py-2.5 font-semibold">Date</th>
                              <th className="px-3 py-2.5 font-semibold">Order #</th>
                              <th className="px-3 py-2.5 font-semibold">Channel</th>
                              <th className="px-3 py-2.5 font-semibold">Customer</th>
                              <th className="px-3 py-2.5 font-semibold text-right">Qty</th>
                              <th className="px-3 py-2.5 font-semibold text-right">Unit Price</th>
                              <th className="px-3 py-2.5 font-semibold text-right">Total</th>
                              <th className="px-3 py-2.5 font-semibold">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/70">
                            {orderItems.map((oi: any) => (
                              <tr key={oi.id} className="hover:bg-slate-50/80 dark:hover:bg-zinc-900/40">
                                <td className="px-3 py-2.5 whitespace-nowrap font-mono text-[11px] text-slate-500">
                                  {safeFormatDate(oi.order?.createdAt || oi.createdAt)}
                                </td>
                                <td className="px-3 py-2.5 font-mono font-semibold text-blue-600 dark:text-blue-400">
                                  {oi.order?.orderNumber || "—"}
                                </td>
                                <td className="px-3 py-2.5">
                                  <Badge variant="secondary" className="text-[10px]">
                                    {oi.order?.isPos ? "POS" : "Online"}
                                  </Badge>
                                </td>
                                <td className="px-3 py-2.5 text-slate-700 dark:text-zinc-300">
                                  {oi.order?.customerName || "Walk-in Customer"}
                                </td>
                                <td className="px-3 py-2.5 text-right font-mono font-bold text-rose-600">
                                  -{oi.quantity}
                                </td>
                                <td className="px-3 py-2.5 text-right font-mono">
                                  ৳{Number(oi.unitPrice || 0).toLocaleString()}
                                </td>
                                <td className="px-3 py-2.5 text-right font-mono font-semibold">
                                  ৳{Number(oi.total || 0).toLocaleString()}
                                </td>
                                <td className="px-3 py-2.5">
                                  <Badge variant="outline" className="text-[10px] uppercase">
                                    {oi.order?.status || "—"}
                                  </Badge>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
