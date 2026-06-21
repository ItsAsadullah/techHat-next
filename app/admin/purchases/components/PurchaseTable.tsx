import { Trash2, Package, TrendingDown, TrendingUp, AlertCircle, Info } from 'lucide-react';
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface PurchaseTableProps {
  items: any[];
  updateItem: (id: string, field: string, value: number) => void;
  removeItem: (id: string) => void;
}

export function PurchaseTable({ items, updateItem, removeItem }: PurchaseTableProps) {
  
  const getCostIndicator = (current: number, last: number) => {
    if (!last || last === 0) return null;
    if (current > last) return <span className="text-red-500 flex items-center text-[10px]"><TrendingUp className="w-3 h-3 mr-0.5"/> higher than last (৳{last})</span>;
    if (current < last) return <span className="text-emerald-500 flex items-center text-[10px]"><TrendingDown className="w-3 h-3 mr-0.5"/> lower than last (৳{last})</span>;
    return <span className="text-gray-400 text-[10px]">same as last</span>;
  };

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-sm overflow-hidden mt-6">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-800">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[280px] text-xs font-semibold uppercase tracking-wider text-gray-500">Item Details</TableHead>
              <TableHead className="w-[120px] text-xs font-semibold uppercase tracking-wider text-gray-500">Inventory</TableHead>
              <TableHead className="w-[120px] text-xs font-semibold uppercase tracking-wider text-gray-500">Qty</TableHead>
              <TableHead className="w-[140px] text-xs font-semibold uppercase tracking-wider text-gray-500">Unit Cost (৳)</TableHead>
              <TableHead className="w-[120px] text-xs font-semibold uppercase tracking-wider text-gray-500">Disc (৳)</TableHead>
              <TableHead className="w-[120px] text-xs font-semibold uppercase tracking-wider text-gray-500">Tax (৳)</TableHead>
              <TableHead className="w-[140px] text-xs font-semibold uppercase tracking-wider text-gray-500 text-right">Line Total (৳)</TableHead>
              <TableHead className="w-[60px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12">
                  <div className="flex flex-col items-center justify-center text-gray-400">
                    <Package className="w-12 h-12 mb-3 opacity-20" />
                    <p className="text-sm font-medium">No items in purchase order</p>
                    <p className="text-xs mt-1 opacity-70">Use the smart selector above to add products.</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
            {items.map((item) => (
              <TableRow key={item.id} className="group hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                <TableCell className="align-top py-4">
                  <div className="flex gap-3">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-10 h-10 rounded border border-gray-200 object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded bg-gray-100 dark:bg-gray-800 flex items-center justify-center border border-gray-200 dark:border-gray-700">
                        <Package className="w-5 h-5 text-gray-400" />
                      </div>
                    )}
                    <div>
                      <div className="font-semibold text-sm text-gray-900 dark:text-gray-100 line-clamp-1">{item.name}</div>
                      {item.variantName && <div className="text-xs font-medium text-indigo-600 dark:text-indigo-400 mt-0.5">{item.variantName}</div>}
                      <div className="text-[10px] font-mono text-gray-500 mt-1 bg-gray-100 dark:bg-gray-800 inline-block px-1.5 py-0.5 rounded">{item.sku}</div>
                    </div>
                  </div>
                </TableCell>
                
                <TableCell className="align-top py-4">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="cursor-help flex flex-col gap-1">
                          <span className={`text-xs font-semibold flex items-center gap-1 ${item.currentStock <= 5 ? 'text-red-600' : 'text-gray-700 dark:text-gray-300'}`}>
                            {item.currentStock <= 5 && <AlertCircle className="w-3 h-3" />}
                            {item.currentStock} in stock
                          </span>
                          <span className="text-[10px] text-gray-500 flex items-center gap-1">
                            +{item.incomingStock || 0} incoming <Info className="w-3 h-3" />
                          </span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="bg-gray-900 text-white p-3 rounded-xl border-gray-800 shadow-xl">
                        <div className="space-y-1.5 text-xs">
                          <p className="font-semibold border-b border-gray-700 pb-1 mb-1">Inventory Intelligence</p>
                          <div className="flex justify-between gap-4"><span>Current Stock:</span> <span className="font-mono">{item.currentStock}</span></div>
                          <div className="flex justify-between gap-4"><span>Reserved:</span> <span className="font-mono text-red-300">-{item.reservedStock || 0}</span></div>
                          <div className="flex justify-between gap-4"><span>Incoming:</span> <span className="font-mono text-emerald-400">+{item.incomingStock || 0}</span></div>
                          <div className="flex justify-between gap-4 pt-1 border-t border-gray-700 font-semibold">
                            <span>Available:</span> <span className="font-mono">{item.currentStock - (item.reservedStock || 0)}</span>
                          </div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableCell>

                <TableCell className="align-top py-4">
                  <Input 
                    type="number" min="1" className="h-9 w-20 text-center font-mono border-gray-300 dark:border-gray-700 focus:ring-indigo-500"
                    value={item.quantity === 0 ? '' : item.quantity}
                    onChange={(e) => updateItem(item.id, 'quantity', e.target.value === '' ? 0 : (parseFloat(e.target.value) || 0))}
                  />
                </TableCell>
                
                <TableCell className="align-top py-4">
                  <Input 
                    type="number" min="0" step="0.01" className="h-9 font-mono border-gray-300 dark:border-gray-700 focus:ring-indigo-500"
                    value={item.unitCost === 0 ? '' : item.unitCost}
                    onChange={(e) => updateItem(item.id, 'unitCost', e.target.value === '' ? 0 : (parseFloat(e.target.value) || 0))}
                  />
                  <div className="mt-1.5">
                    {getCostIndicator(item.unitCost, item.lastPurchaseCost)}
                  </div>
                </TableCell>
                
                <TableCell className="align-top py-4">
                  <Input 
                    type="number" min="0" step="0.01" className="h-9 font-mono border-gray-300 dark:border-gray-700 focus:ring-indigo-500"
                    value={item.discount === 0 ? '' : item.discount}
                    onChange={(e) => updateItem(item.id, 'discount', e.target.value === '' ? 0 : (parseFloat(e.target.value) || 0))}
                  />
                </TableCell>
                
                <TableCell className="align-top py-4">
                  <Input 
                    type="number" min="0" step="0.01" className="h-9 font-mono border-gray-300 dark:border-gray-700 focus:ring-indigo-500"
                    value={item.tax === 0 ? '' : item.tax}
                    onChange={(e) => updateItem(item.id, 'tax', e.target.value === '' ? 0 : (parseFloat(e.target.value) || 0))}
                  />
                </TableCell>
                
                <TableCell className="align-top py-4 text-right">
                  <div className="font-mono font-bold text-gray-900 dark:text-gray-100 text-base mt-1">
                    ৳{item.subtotal.toLocaleString()}
                  </div>
                </TableCell>
                
                <TableCell className="align-top py-4 text-right">
                  <Button type="button" variant="ghost" size="icon" className="h-9 w-9 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => removeItem(item.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
