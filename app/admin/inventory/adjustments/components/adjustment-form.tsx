// @ts-nocheck
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Loader2, ArrowLeft, Plus, Trash2, Search as SearchIcon, Settings2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createAdjustment, getSystemQtyForAdjustment, AdjustmentFormData } from '@/lib/actions/adjustment-actions';
import { searchProductsForPO } from '@/lib/actions/po-actions'; // we can reuse product search
import { StockAdjustmentReason } from '@prisma/client';

interface AdjFormProps {
  warehouses: any[];
}

export function AdjustmentForm({ warehouses }: AdjFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Core Form State
  const [warehouseId, setWarehouseId] = useState('');
  const [reason, setReason] = useState<StockAdjustmentReason>('COUNT');
  const [note, setNote] = useState('');

  // Items State
  const [items, setItems] = useState<any[]>([]);

  // Product Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Product Search Effect
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.length >= 2) {
        setIsSearching(true);
        const res = await searchProductsForPO(searchQuery);
        if (('data' in res)) setSearchResults(('data' in res ? res.data : null) || []);
        setIsSearching(false);
      } else {
        setSearchResults([]);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const addProductToAdjustment = async (product: any, variant: any = null) => {
    if (!warehouseId) return toast.error('Please select a warehouse first');

    // Check if already added
    const exists = items.find(i => i.productId === product.id && i.variantId === (variant?.id || null));
    if (exists) return toast.error('Product already added to list');

    const loadingToast = toast.loading('Fetching physical stock...');
    const { qty } = await getSystemQtyForAdjustment(product.id, variant ? variant.id : null, warehouseId);
    toast.dismiss(loadingToast);
    
    const systemQty = qty || 0;

    setItems(prev => [
      ...prev,
      {
        id: Math.random().toString(),
        productId: product.id,
        variantId: variant ? variant.id : null,
        name: product.name,
        variantName: variant ? variant.name : null,
        sku: variant ? variant.sku : product.sku,
        systemQty,
        actualQty: systemQty,
        adjustedQty: 0,
        unitCost: variant ? (variant.costPrice || product.costPrice || 0) : (product.costPrice || 0),
      }
    ]);
    setSearchQuery('');
    setSearchResults([]);
  };

  const updateItem = (id: string, field: string, value: number) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        if (field === 'actualQty') {
          updated.adjustedQty = value - updated.systemQty;
        } else if (field === 'adjustedQty') {
          updated.actualQty = updated.systemQty + value;
        }
        return updated;
      }
      return item;
    }));
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!warehouseId) return toast.error('Please select a warehouse.');
    if (!reason) return toast.error('Please select a reason.');
    if (items.length === 0) return toast.error('Please add at least one item to adjust.');

    setLoading(true);

    try {
      const payload: AdjustmentFormData = {
        warehouseId,
        reason,
        note,
        items: items.map(i => ({
          productId: i.productId,
          variantId: i.variantId,
          systemQty: i.systemQty,
          actualQty: i.actualQty,
          adjustedQty: i.adjustedQty,
          unitCost: i.unitCost,
        }))
      };

      const res = await createAdjustment(payload);

      if (('data' in res)) {
        toast.success('Adjustment Draft created!');
        router.push(`/admin/inventory/adjustments/${('data' in res ? res.data : null).id}`);
      } else {
        toast.error(('error' in res ? res.error : 'Error') || 'Something went wrong.');
      }
    } catch (error) {
      toast.error('Failed to submit form.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 max-w-[1400px] mx-auto pb-24">
      {/* Header */}
      <div className="flex items-center justify-between sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b py-3 -mx-6 px-6 shadow-sm">
        <div className="flex items-center gap-3">
          <Button type="button" variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">New Stock Adjustment</h1>
            <p className="text-xs text-muted-foreground">Draft a new inventory correction.</p>
          </div>
        </div>
        <Button type="submit" disabled={loading}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Draft Adjustment
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-4">
        {/* Main Section */}
        <div className="md:col-span-3 space-y-6">
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Warehouse <span className="text-red-500">*</span></Label>
              <Select value={warehouseId} onValueChange={setWarehouseId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select warehouse..." />
                </SelectTrigger>
                <SelectContent>
                  {warehouses.map(w => (
                    <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Reason <span className="text-red-500">*</span></Label>
              <Select value={reason} onValueChange={(val: any) => setReason(val)} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select reason..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="COUNT">Physical Count (Reconciliation)</SelectItem>
                  <SelectItem value="DAMAGE">Damaged Goods</SelectItem>
                  <SelectItem value="THEFT">Lost or Stolen</SelectItem>
                  <SelectItem value="EXPIRED">Expired Items</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
            <div className="p-4 border-b bg-muted/20">
              <h3 className="font-semibold flex items-center gap-2">
                <Settings2 className="h-5 w-5 text-primary" /> Adjusted Items
              </h3>
            </div>
            
            <div className="p-4 border-b relative">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products by name or SKU to add..."
                  className="pl-9 h-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {isSearching && <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-muted-foreground" />}
              </div>
              
              {searchResults.length > 0 && (
                <div className="absolute top-full left-4 right-4 mt-1 bg-popover text-popover-foreground border rounded-md shadow-lg z-50 max-h-[300px] overflow-y-auto">
                  {searchResults.map((product) => (
                    <div key={product.id} className="p-2 border-b last:border-0">
                      {product.variations.length > 0 ? (
                        <div className="space-y-1">
                          <div className="text-sm font-semibold px-2 text-muted-foreground">{product.name} (Select Variant)</div>
                          {product.variations.map((v: any) => (
                            <button
                              key={v.id}
                              type="button"
                              onClick={() => addProductToAdjustment(product, v)}
                              className="w-full text-left px-2 py-1.5 text-sm hover:bg-muted rounded flex justify-between items-center"
                            >
                              <span>{v.name} <span className="text-xs text-muted-foreground ml-2 font-mono">{v.sku}</span></span>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => addProductToAdjustment(product)}
                          className="w-full text-left px-2 py-1.5 text-sm hover:bg-muted rounded flex justify-between items-center"
                        >
                          <span className="font-medium">{product.name} <span className="text-xs text-muted-foreground ml-2 font-mono">{product.sku}</span></span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/10">
                  <TableRow>
                    <TableHead className="w-[300px]">Product / SKU</TableHead>
                    <TableHead className="w-[120px] text-center">System Qty</TableHead>
                    <TableHead className="w-[140px] text-center">Actual Qty</TableHead>
                    <TableHead className="w-[140px] text-center">Adjustment (+/-)</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No items added. Search products to adjust.
                      </TableCell>
                    </TableRow>
                  )}
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="font-medium text-sm">{item.name}</div>
                        {item.variantName && <div className="text-xs text-muted-foreground">{item.variantName}</div>}
                        <div className="text-[10px] font-mono text-muted-foreground mt-0.5">{item.sku}</div>
                      </TableCell>
                      <TableCell className="text-center font-mono text-muted-foreground bg-muted/20">
                        {item.systemQty}
                      </TableCell>
                      <TableCell>
                        <Input 
                          type="number" className="h-8 text-center"
                          value={item.actualQty}
                          onChange={(e) => updateItem(item.id, 'actualQty', parseInt(e.target.value) || 0)}
                        />
                      </TableCell>
                      <TableCell>
                        <Input 
                          type="number" className={`h-8 text-center font-bold ${item.adjustedQty > 0 ? 'text-green-600' : item.adjustedQty < 0 ? 'text-red-600' : ''}`}
                          value={item.adjustedQty}
                          onChange={(e) => updateItem(item.id, 'adjustedQty', parseInt(e.target.value) || 0)}
                        />
                      </TableCell>
                      <TableCell>
                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeItem(item.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <h2 className="text-sm font-semibold mb-3">Adjustment Notes</h2>
            <Textarea 
              value={note} 
              onChange={(e) => setNote(e.target.value)} 
              placeholder="Why is this adjustment being made?" 
              className="min-h-[120px]"
            />
          </div>
        </div>
      </div>
    </form>
  );
}
