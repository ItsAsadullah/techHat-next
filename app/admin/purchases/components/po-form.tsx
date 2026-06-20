'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Loader2, ArrowLeft, Plus, Trash2, Search as SearchIcon, Package } from 'lucide-react';
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
import { createPurchaseOrder, updatePurchaseOrder, PurchaseOrderFormData, searchProductsForPO, POItemInput } from '@/lib/actions/po-actions';

interface POFormProps {
  initialData?: any;
  isEditMode?: boolean;
  suppliers: any[];
  warehouses: any[];
}

export function PurchaseOrderForm({ initialData, isEditMode, suppliers, warehouses }: POFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Core Form State
  const [supplierId, setSupplierId] = useState(initialData?.supplierId || '');
  const [warehouseId, setWarehouseId] = useState(initialData?.warehouseId || '');
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState(
    initialData?.expectedDeliveryDate ? new Date(initialData.expectedDeliveryDate).toISOString().split('T')[0] : ''
  );
  const [note, setNote] = useState(initialData?.note || '');

  // Costs State
  const [shippingCost, setShippingCost] = useState<number>(initialData?.shippingCost || 0);
  const [otherCost, setOtherCost] = useState<number>(initialData?.otherCost || 0);

  // Items State
  const [items, setItems] = useState<any[]>(
    initialData?.items?.map((item: any) => ({
      id: Math.random().toString(), // temporary UI id
      productId: item.productId,
      variantId: item.variantId || null,
      name: item.product?.name,
      variantName: item.variant?.name,
      sku: item.variant?.sku || item.product?.sku,
      quantity: item.quantity,
      unitCost: item.unitCost,
      discount: item.discount || 0,
      tax: item.tax || 0,
    })) || []
  );

  // Product Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Derived Totals
  const totals = useMemo(() => {
    let subtotal = 0;
    let totalDiscount = 0;
    let totalTax = 0;

    const formattedItems = items.map(item => {
      const itemSubtotal = (item.quantity * item.unitCost) + (item.tax || 0) - (item.discount || 0);
      subtotal += (item.quantity * item.unitCost);
      totalDiscount += (item.discount || 0);
      totalTax += (item.tax || 0);
      return { ...item, subtotal: itemSubtotal };
    });

    const grandTotal = subtotal + shippingCost + otherCost + totalTax - totalDiscount;

    return { subtotal, totalDiscount, totalTax, grandTotal, formattedItems };
  }, [items, shippingCost, otherCost]);

  // Product Search Effect
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      const res = await searchProductsForPO(searchQuery);
      if (res.success) setSearchResults(res.data || []);
      setIsSearching(false);
    }, 200);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const filteredSearchResults = useMemo(() => {
    const results = [];
    for (const product of searchResults) {
      const hasVariants = product.variants && product.variants.length > 0;
      
      if (hasVariants) {
        const remainingVariants = product.variants.filter((v: any) => 
          !items.some(item => item.productId === product.id && item.variantId === v.id)
        );
        if (remainingVariants.length > 0) {
          results.push({ ...product, variants: remainingVariants });
        }
      } else {
        const isAdded = items.some(item => item.productId === product.id && !item.variantId);
        if (!isAdded) {
          results.push(product);
        }
      }
    }
    return results;
  }, [searchResults, items]);

  const addProductToPO = (product: any, variant: any = null) => {
    setItems(prev => {
      const existingItemIndex = prev.findIndex(item => 
        item.productId === product.id && 
        item.variantId === (variant ? variant.id : null)
      );

      if (existingItemIndex >= 0) {
        const newItems = [...prev];
        newItems[existingItemIndex].quantity += 1;
        toast.success(`Increased quantity of ${variant ? variant.name : product.name}`);
        return newItems;
      }

      return [
        ...prev,
        {
          id: Math.random().toString(),
          productId: product.id,
          variantId: variant ? variant.id : null,
          name: product.name,
          variantName: variant ? variant.name : null,
          sku: variant ? variant.sku : product.sku,
          quantity: 1,
          unitCost: variant ? (variant.costPrice || product.costPrice || 0) : (product.costPrice || 0),
          discount: 0,
          tax: 0,
        }
      ];
    });
    setSearchQuery('');
    setIsSearchFocused(false);
    document.getElementById('product-search-input')?.blur();
  };

  const updateItem = (id: string, field: string, value: number) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierId) return toast.error('Please select a supplier.');
    if (items.length === 0) return toast.error('Please add at least one item to the PO.');

    setLoading(true);

    try {
      const payload: PurchaseOrderFormData = {
        supplierId,
        warehouseId: warehouseId || undefined,
        expectedDeliveryDate: expectedDeliveryDate ? new Date(expectedDeliveryDate) : undefined,
        totalAmount: totals.subtotal,
        discount: totals.totalDiscount,
        tax: totals.totalTax,
        shippingCost,
        otherCost,
        grandTotal: totals.grandTotal,
        note,
        items: totals.formattedItems.map(i => ({
          productId: i.productId,
          variantId: i.variantId,
          quantity: i.quantity,
          unitCost: i.unitCost,
          discount: i.discount,
          tax: i.tax,
          subtotal: i.subtotal,
        }))
      };

      let res;
      if (isEditMode && initialData?.id) {
        res = await updatePurchaseOrder(initialData.id, payload);
      } else {
        res = await createPurchaseOrder(payload);
      }

      if (res.success) {
        toast.success(isEditMode ? 'Purchase Order updated!' : 'Purchase Order created!');
        router.push(isEditMode ? `/admin/purchases/${initialData.id}` : '/admin/purchases');
      } else {
        toast.error(res.error || 'Something went wrong.');
      }
    } catch (error) {
      console.error(error);
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
            <h1 className="text-xl font-bold">{isEditMode ? `Edit PO: ${initialData?.poNumber}` : 'New Purchase Order'}</h1>
            <p className="text-xs text-muted-foreground">
              {isEditMode ? 'Modify draft purchase order details.' : 'Draft a new purchase order for a supplier.'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
            Discard
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {isEditMode ? 'Save PO' : 'Create Draft PO'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-4">
        {/* Main Section (Left 3 Cols) */}
        <div className="md:col-span-3 space-y-6">
          
          {/* Top Bar Details */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2 col-span-1">
              <Label>Supplier <span className="text-red-500">*</span></Label>
              <Select value={supplierId} onValueChange={setSupplierId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select supplier..." />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 col-span-1">
              <Label>Expected Delivery Date</Label>
              <Input type="date" value={expectedDeliveryDate} onChange={e => setExpectedDeliveryDate(e.target.value)} />
            </div>
            <div className="space-y-2 col-span-1">
              <Label>Target Warehouse</Label>
              <Select value={warehouseId} onValueChange={setWarehouseId}>
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
          </div>

          {/* Product Items Table */}
          <div className="rounded-xl border bg-card shadow-sm">
            <div className="p-4 border-b bg-muted/20 rounded-t-xl">
              <h3 className="font-semibold flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" /> Purchase Items
              </h3>
            </div>
            
            {/* Search Input for Products */}
            <div className="p-4 border-b relative">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="product-search-input"
                  placeholder="Search products by name or SKU to add..."
                  className="pl-9 h-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                />
                {isSearching && <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-muted-foreground" />}
              </div>
              
              {/* Dropdown Results */}
              {isSearchFocused && filteredSearchResults.length > 0 && (
                <div className="absolute top-full left-4 right-4 mt-1 bg-popover text-popover-foreground border rounded-lg shadow-xl z-50 max-h-[350px] overflow-y-auto divide-y">
                  {filteredSearchResults.map((product) => (
                    <div key={product.id} className="p-1">
                      {product.variants?.length > 0 ? (
                        <div className="space-y-1">
                          <div className="text-xs font-semibold px-3 py-1.5 text-muted-foreground uppercase tracking-wider bg-muted/30 rounded flex items-center gap-2">
                            {product.images?.[0]?.url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={product.images[0].url} alt={product.name} className="w-5 h-5 rounded object-cover" />
                            ) : (
                              <Package className="h-4 w-4" />
                            )}
                            {product.name}
                          </div>
                          {product.variants.map((v: any) => (
                            <button
                              key={v.id}
                              type="button"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                addProductToPO(product, v);
                              }}
                              className="w-full text-left px-3 py-2 text-sm hover:bg-indigo-50 dark:hover:bg-indigo-950/30 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-md flex justify-between items-center transition-colors group"
                            >
                              <div className="flex items-center gap-3">
                                {v.images?.[0]?.url ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={v.images[0].url} alt={v.name} className="w-8 h-8 rounded border object-cover" />
                                ) : (
                                  <div className="w-8 h-8 rounded border bg-muted/50 flex items-center justify-center">
                                    <Package className="h-4 w-4 text-muted-foreground" />
                                  </div>
                                )}
                                <div>
                                  <div className="font-medium">{v.name}</div>
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                    <span className="font-mono bg-muted px-1.5 py-0.5 rounded">{v.sku}</span>
                                    <span className={v.stock <= 0 ? 'text-red-500 font-medium' : 'text-emerald-600 dark:text-emerald-400'}>
                                      Stock: {v.stock}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-xs text-muted-foreground mb-0.5">Cost Price</div>
                                <div className="text-sm font-mono font-medium">৳{v.costPrice || product.costPrice || 0}</div>
                              </div>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <button
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            addProductToPO(product);
                          }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-indigo-50 dark:hover:bg-indigo-950/30 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-md flex justify-between items-center transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            {product.images?.[0]?.url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={product.images[0].url} alt={product.name} className="w-8 h-8 rounded border object-cover" />
                            ) : (
                              <div className="w-8 h-8 rounded border bg-muted/50 flex items-center justify-center">
                                <Package className="h-4 w-4 text-muted-foreground" />
                              </div>
                            )}
                            <div>
                              <div className="font-medium">{product.name}</div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                <span className="font-mono bg-muted px-1.5 py-0.5 rounded">{product.sku}</span>
                                <span className={product.stock <= 0 ? 'text-red-500 font-medium' : 'text-emerald-600 dark:text-emerald-400'}>
                                  Stock: {product.stock}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-muted-foreground mb-0.5">Cost Price</div>
                            <div className="text-sm font-mono font-medium">৳{product.costPrice || 0}</div>
                          </div>
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
                    <TableHead className="w-[120px]">Qty</TableHead>
                    <TableHead className="w-[140px]">Unit Cost (৳)</TableHead>
                    <TableHead className="w-[120px]">Disc (৳)</TableHead>
                    <TableHead className="w-[120px]">Tax (৳)</TableHead>
                    <TableHead className="w-[120px] text-right">Total (৳)</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {totals.formattedItems.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No items added yet. Search products to add.
                      </TableCell>
                    </TableRow>
                  )}
                  {totals.formattedItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="font-medium text-sm">{item.name}</div>
                        {item.variantName && <div className="text-xs text-muted-foreground">{item.variantName}</div>}
                        <div className="text-[10px] font-mono text-muted-foreground mt-0.5">{item.sku}</div>
                      </TableCell>
                      <TableCell>
                        <Input 
                          type="number" min="1" className="h-8 w-20"
                          value={item.quantity}
                          onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 1)}
                        />
                      </TableCell>
                      <TableCell>
                        <Input 
                          type="number" min="0" step="0.01" className="h-8"
                          value={item.unitCost}
                          onChange={(e) => updateItem(item.id, 'unitCost', parseFloat(e.target.value) || 0)}
                        />
                      </TableCell>
                      <TableCell>
                        <Input 
                          type="number" min="0" step="0.01" className="h-8"
                          value={item.discount}
                          onChange={(e) => updateItem(item.id, 'discount', parseFloat(e.target.value) || 0)}
                        />
                      </TableCell>
                      <TableCell>
                        <Input 
                          type="number" min="0" step="0.01" className="h-8"
                          value={item.tax}
                          onChange={(e) => updateItem(item.id, 'tax', parseFloat(e.target.value) || 0)}
                        />
                      </TableCell>
                      <TableCell className="text-right font-mono font-medium">
                        {item.subtotal.toLocaleString()}
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

        {/* Sidebar Cost Calculations (Right Col) */}
        <div className="space-y-6">
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <h2 className="text-sm font-semibold mb-4 border-b pb-2">Order Summary</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center text-muted-foreground">
                <span>Subtotal</span>
                <span className="font-mono">৳{totals.subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-red-500">
                <span>Discount Total</span>
                <span className="font-mono">-৳{totals.totalDiscount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-muted-foreground">
                <span>Tax Total</span>
                <span className="font-mono">+৳{totals.totalTax.toLocaleString()}</span>
              </div>
              
              <div className="pt-2 mt-2 border-t space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Shipping Cost (+)</Label>
                  <Input 
                    type="number" min="0" step="0.01" className="h-8"
                    value={shippingCost}
                    onChange={(e) => setShippingCost(parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Other Costs (+)</Label>
                  <Input 
                    type="number" min="0" step="0.01" className="h-8"
                    value={otherCost}
                    onChange={(e) => setOtherCost(parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>

              <div className="flex justify-between items-center font-bold text-lg pt-4 mt-2 border-t">
                <span>Grand Total</span>
                <span className="font-mono text-primary">৳{totals.grandTotal.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <h2 className="text-sm font-semibold mb-3">Internal Notes</h2>
            <Textarea 
              value={note} 
              onChange={(e) => setNote(e.target.value)} 
              placeholder="Terms, conditions, or internal references..." 
              className="min-h-[120px]"
            />
          </div>
        </div>
      </div>
    </form>
  );
}
