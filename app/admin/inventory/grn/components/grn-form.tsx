// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Save, Loader2, ArrowLeft, PackageCheck, Tag } from 'lucide-react';
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
import { createGRN, GRNFormData, submitGRN } from '@/lib/actions/grn-actions';
import { getPurchaseOrderById } from '@/lib/actions/po-actions';

interface GRNFormProps {
  approvedPOs: any[];
  warehouses: any[];
}

export function GRNForm({ approvedPOs, warehouses }: GRNFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [poLoading, setPoLoading] = useState(false);

  const [poId, setPoId] = useState(searchParams.get('poId') || '');
  const [warehouseId, setWarehouseId] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [note, setNote] = useState('');
  const [items, setItems] = useState<any[]>([]);

  // Advanced Tracking Modal State
  const [showSerialsModal, setShowSerialsModal] = useState(false);
  const [activeItemIndex, setActiveItemIndex] = useState<number | null>(null);
  const [tempSerials, setTempSerials] = useState<string[]>([]);

  useEffect(() => {
    if (poId) {
      loadPO(poId);
    }
  }, [poId]);

  const loadPO = async (id: string) => {
    setPoLoading(true);
    const res = await getPurchaseOrderById(id);
    if (res.success) {
      const po = (res as any).data;
      setSupplierId((po || {}).supplierId || '');
      if ((po || {}).warehouseId) setWarehouseId((po || {}).warehouseId || '');
      
      // Calculate Landed Cost Multiplier
      let poTotalBaseValue = 0;
      const poItems = po.items || [];
      for (const pi of poItems) {
        const perUnitDiscount = pi.quantity > 0 ? (pi.discount || 0) / pi.quantity : 0;
        const netUnitCost = pi.unitCost - perUnitDiscount;
        poTotalBaseValue += (pi.quantity * netUnitCost);
      }

      const globalExtraCost = (po.shippingCost || 0) + (po.otherCost || 0) - (po.discount || 0);
      const landedCostMultiplier = poTotalBaseValue > 0 ? (poTotalBaseValue + globalExtraCost) / poTotalBaseValue : 1;

      const newItems = poItems.map((pi: any) => {
        const perUnitDiscount = pi.quantity > 0 ? (pi.discount || 0) / pi.quantity : 0;
        const netUnitCost = pi.unitCost - perUnitDiscount;
        const landedUnitCost = netUnitCost * landedCostMultiplier;

        return {
          poItemId: pi.id,
          productId: pi.productId,
          variantId: pi.variantId,
          name: pi.product.name,
          variantName: pi.variant?.name,
          sku: pi.variant?.sku || pi.product.sku,
          orderedQty: pi.quantity,
          previouslyReceivedQty: pi.receivedQty,
          pendingQty: pi.quantity - pi.receivedQty,
          // editable fields
          receivedQty: pi.quantity - pi.receivedQty > 0 ? pi.quantity - pi.receivedQty : 0,
          rejectedQty: 0,
          acceptedQty: pi.quantity - pi.receivedQty > 0 ? pi.quantity - pi.receivedQty : 0,
          batchNumber: '',
          imei: '',
          serialNumber: '',
          unitCost: pi.unitCost,
          landedCost: landedUnitCost,
          newRetailPrice: pi.variant?.price || pi.product?.price || 0,
          newOfferPrice: pi.variant?.offerPrice || pi.product?.offerPrice || 0,
          newWholesalePrice: pi.product?.wholesalePrice || 0,
          newOnlinePrice: pi.product?.onlinePrice || 0,
          newTaxClass: pi.product?.taxClass || '',
        };
      });
      setItems(newItems);
    } else {
      toast.error('Failed to load Purchase Order details.');
    }
    setPoLoading(false);
  };

  const updateItem = (index: number, field: string, value: any) => {
    setItems(prev => {
      const updated = [...prev];
      updated[index][field] = value;
      if (field === 'receivedQty' || field === 'rejectedQty') {
        updated[index].acceptedQty = Math.max(0, updated[index].receivedQty - updated[index].rejectedQty);
      }
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!poId) return toast.error('Please select a Purchase Order.');
    if (!warehouseId) return toast.error('Please select a destination warehouse.');
    
    const hasItemsToReceive = items.some(i => i.acceptedQty > 0);
    if (!hasItemsToReceive) return toast.error('You must receive at least 1 item.');

    setLoading(true);

    try {
      const payload: GRNFormData = {
        purchaseOrderId: poId,
        supplierId,
        warehouseId,
        note,
        items: items.filter(i => i.receivedQty > 0).map(i => ({
          productId: i.productId,
          variantId: i.variantId,
          receivedQty: i.receivedQty,
          rejectedQty: i.rejectedQty,
          acceptedQty: i.acceptedQty,
          batchNumber: i.batchNumber || undefined,
          imei: i.imei || undefined,
          serialNumber: i.serialNumber || undefined,
          unitCost: i.unitCost,
          newRetailPrice: i.newRetailPrice,
          newOfferPrice: i.newOfferPrice,
          newWholesalePrice: i.newWholesalePrice,
          newOnlinePrice: i.newOnlinePrice,
          newTaxClass: i.newTaxClass,
        }))
      };

      const res = await createGRN(payload);
      if (('data' in res)) {
        const submitRes = await submitGRN((res as any).data.id);
        if (submitRes.success) {
          toast.success('Goods received and inventory updated successfully!');
          router.push('/admin/purchases');
        } else {
          toast.error(submitRes.error || 'GRN created but failed to finalize.');
          router.push('/admin/purchases');
        }
      } else {
        toast.error(('error' in res ? res.error : 'Error') || 'Something went wrong.');
      }
    } catch (error) {
      toast.error('Failed to submit form.');
    } finally {
      setLoading(false);
    }
  };

  const openSerialsModal = (index: number) => {
    setActiveItemIndex(index);
    const item = items[index];
    const needed = item.acceptedQty;
    let currentSerials = item.serials || [];
    
    // Auto-adjust the array size
    if (currentSerials.length > needed) {
      currentSerials = currentSerials.slice(0, needed);
    } else if (currentSerials.length < needed) {
      currentSerials = [...currentSerials, ...Array(needed - currentSerials.length).fill('')];
    }
    
    setTempSerials(currentSerials);
    setShowSerialsModal(true);
  };

  const saveSerials = () => {
    if (activeItemIndex !== null) {
      updateItem(activeItemIndex, 'serials', tempSerials);
    }
    setShowSerialsModal(false);
  };

  const saveSerials = () => {
    if (activeItemIndex !== null) {
      updateItem(activeItemIndex, 'serials', tempSerials);
    }
    setShowSerialsModal(false);
  };

  return (
    <>
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full mx-auto pb-12 px-4 md:px-6">
      {/* Header */}
      <div className="flex items-center justify-between sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b py-2 shadow-sm -mx-4 px-4 md:-mx-6 md:px-6">
        <div className="flex items-center gap-3">
          <Button type="button" variant="ghost" size="icon" onClick={() => router.back()} className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-lg font-bold">Receive Goods</h1>
            <p className="text-[11px] text-muted-foreground hidden sm:block">Receive goods against an approved Purchase Order.</p>
          </div>
        </div>
        <Button type="submit" disabled={loading || poLoading} size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white h-8 text-xs">
          {loading ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <PackageCheck className="mr-2 h-3 w-3" />}
          Receive & Lock Stock
        </Button>
      </div>

      {/* Top Controls: PO, Warehouse, Notes in a compact grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-4 mt-2">
        <div className="space-y-1">
          <Label className="text-xs">Source Purchase Order <span className="text-red-500">*</span></Label>
          <Select value={poId} onValueChange={setPoId} required>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Select PO..." />
            </SelectTrigger>
            <SelectContent>
              {approvedPOs.map(po => (
                <SelectItem key={(po || {}).id} value={(po || {}).id}>{(po || {}).poNumber} ({(po || {}).supplier.name})</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-1">
          <Label className="text-xs">Destination Warehouse <span className="text-red-500">*</span></Label>
          <Select value={warehouseId} onValueChange={setWarehouseId} required>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Select Warehouse..." />
            </SelectTrigger>
            <SelectContent>
              {warehouses.map(w => (
                <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1 md:col-span-1 xl:col-span-2">
          <Label className="text-xs">Receipt Notes</Label>
          <Input 
            value={note} 
            onChange={(e) => setNote(e.target.value)} 
            placeholder="Condition, driver details, references..." 
            className="h-8 text-xs"
          />
        </div>
      </div>

      <div className="rounded-lg border bg-card shadow-sm overflow-hidden flex-1">
            <div className="p-4 border-b bg-muted/20">
              <h3 className="font-semibold flex items-center gap-2">
                <PackageCheck className="h-5 w-5 text-primary" /> Inspect & Receive Items
              </h3>
            </div>
            
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="w-[200px] min-w-[200px] text-xs">Product Details</TableHead>
                    <TableHead className="w-[220px] min-w-[220px] text-xs">Qty (Pending / Recv / Rej)</TableHead>
                    <TableHead className="w-[380px] min-w-[380px] text-xs">Selling Prices Updates</TableHead>
                    <TableHead className="w-[200px] min-w-[200px] text-xs">Advanced Tracking</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {poLoading && (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                  )}
                  {!poLoading && items.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                        Select a Purchase Order to load items.
                      </TableCell>
                    </TableRow>
                  )}
                  {!poLoading && items.map((item, index) => (
                    <TableRow key={item.poItemId} className={item.pendingQty === 0 ? "opacity-50 bg-muted/30" : ""}>
                      <TableCell>
                        <div className="font-medium text-xs truncate max-w-[200px]" title={item.name}>{item.name}</div>
                        {item.variantName && <div className="text-[10px] text-muted-foreground">{item.variantName}</div>}
                        <div className="text-[9px] font-mono text-muted-foreground">{item.sku}</div>
                        {item.landedCost !== undefined && (
                           <div className="text-[10px] font-medium text-indigo-600 bg-indigo-50 inline-block px-1 rounded mt-1">Landed: ৳{item.landedCost.toFixed(2)}</div>
                        )}
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <div className="text-center w-12">
                            <div className="text-xs font-mono font-medium">{item.pendingQty}</div>
                            <div className="text-[9px] text-muted-foreground leading-none">Pend</div>
                          </div>
                          <div className="flex flex-col gap-1 w-16">
                            <Input 
                              type="number" min="0" max={item.pendingQty} className="h-6 text-xs text-center px-1"
                              value={item.receivedQty}
                              onChange={(e) => updateItem(index, 'receivedQty', parseInt(e.target.value) || 0)}
                              disabled={item.pendingQty === 0}
                              title="Receive Qty"
                            />
                            <div className="text-[9px] text-center text-muted-foreground leading-none">Recv</div>
                          </div>
                          <div className="flex flex-col gap-1 w-16">
                            <Input 
                              type="number" min="0" max={item.receivedQty} className="h-6 text-xs text-center px-1 text-red-500"
                              value={item.rejectedQty}
                              onChange={(e) => updateItem(index, 'rejectedQty', parseInt(e.target.value) || 0)}
                              disabled={item.pendingQty === 0}
                              title="Reject Qty"
                            />
                            <div className="text-[9px] text-center text-red-400 leading-none">Rej</div>
                          </div>
                          <div className="text-center w-12 bg-green-50 rounded px-1 py-0.5">
                            <div className="text-xs font-bold text-green-600">{item.acceptedQty}</div>
                            <div className="text-[9px] text-green-600 leading-none">Acc</div>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="grid grid-cols-5 gap-1.5 bg-muted/20 p-1.5 rounded border border-dashed">
                          <div className="flex flex-col gap-0.5">
                            <Label className="text-[9px] text-muted-foreground">Retail ৳</Label>
                            <Input type="number" className="h-6 text-[10px] px-1" value={item.newRetailPrice || ''} onChange={(e) => updateItem(index, 'newRetailPrice', parseFloat(e.target.value) || 0)} disabled={item.pendingQty === 0}/>
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <Label className="text-[9px] text-muted-foreground">Offer ৳</Label>
                            <Input type="number" className="h-6 text-[10px] px-1" value={item.newOfferPrice || ''} onChange={(e) => updateItem(index, 'newOfferPrice', parseFloat(e.target.value) || 0)} disabled={item.pendingQty === 0}/>
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <Label className="text-[9px] text-muted-foreground">W/S ৳</Label>
                            <Input type="number" className="h-6 text-[10px] px-1" value={item.newWholesalePrice || ''} onChange={(e) => updateItem(index, 'newWholesalePrice', parseFloat(e.target.value) || 0)} disabled={item.pendingQty === 0}/>
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <Label className="text-[9px] text-muted-foreground">Online ৳</Label>
                            <Input type="number" className="h-6 text-[10px] px-1" value={item.newOnlinePrice || ''} onChange={(e) => updateItem(index, 'newOnlinePrice', parseFloat(e.target.value) || 0)} disabled={item.pendingQty === 0}/>
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <Label className="text-[9px] text-muted-foreground">Tax Class</Label>
                            <Input type="text" className="h-6 text-[10px] px-1" placeholder="Exempt" value={item.newTaxClass || ''} onChange={(e) => updateItem(index, 'newTaxClass', e.target.value)} disabled={item.pendingQty === 0}/>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-2">
                          {item.product?.trackBatch && (
                            <div className="grid grid-cols-2 gap-1 bg-muted/30 p-2 rounded-md border border-dashed">
                              <Input 
                                type="text" placeholder="Batch No." className="h-7 text-xs font-mono"
                                value={item.batchNumber || ''}
                                onChange={(e) => updateItem(index, 'batchNumber', e.target.value)}
                                disabled={item.pendingQty === 0}
                              />
                              <Input 
                                type="date" className="h-7 text-xs"
                                value={item.expiryDate ? new Date(item.expiryDate).toISOString().split('T')[0] : ''}
                                onChange={(e) => updateItem(index, 'expiryDate', e.target.value ? new Date(e.target.value) : undefined)}
                                disabled={item.pendingQty === 0}
                              />
                            </div>
                          )}
                          
                          {item.product?.trackSerials && (
                            <Button 
                              type="button" 
                              variant={item.serials?.length === item.acceptedQty && item.acceptedQty > 0 ? "default" : "outline"}
                              size="sm" 
                              className={`h-7 text-xs ${item.serials?.length === item.acceptedQty && item.acceptedQty > 0 ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                              disabled={item.acceptedQty === 0}
                              onClick={() => openSerialsModal(index)}
                            >
                              {item.serials?.length === item.acceptedQty && item.acceptedQty > 0 
                                ? `✅ ${item.acceptedQty} Serials Provided` 
                                : `Provide ${item.acceptedQty} Serials`
                              }
                            </Button>
                          )}

                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
    </form>

    {/* Serials Input Modal */}
    {showSerialsModal && activeItemIndex !== null && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="bg-background rounded-xl shadow-lg w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
          <div className="p-4 border-b bg-muted/30">
            <h3 className="font-semibold">Enter Serial Numbers / IMEI</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Provide {items[activeItemIndex].acceptedQty} serial numbers for <strong>{items[activeItemIndex].name}</strong>.
            </p>
          </div>
          
          <div className="p-4 overflow-y-auto space-y-3 flex-1">
            {tempSerials.map((serial, sIdx) => (
              <div key={sIdx} className="flex items-center gap-3">
                <span className="w-6 text-xs text-muted-foreground text-right">{sIdx + 1}.</span>
                <Input 
                  autoFocus={sIdx === 0}
                  placeholder={`Serial/IMEI #${sIdx + 1}`}
                  className="h-9 font-mono uppercase"
                  value={serial}
                  onChange={(e) => {
                    const newS = [...tempSerials];
                    newS[sIdx] = e.target.value;
                    setTempSerials(newS);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const nextInput = document.getElementById(`serial-input-${sIdx + 1}`);
                      if (nextInput) nextInput.focus();
                    }
                  }}
                  id={`serial-input-${sIdx}`}
                />
              </div>
            ))}
          </div>

          <div className="p-4 border-t flex justify-end gap-2 bg-muted/10">
            <Button variant="outline" onClick={() => setShowSerialsModal(false)}>Cancel</Button>
            <Button onClick={saveSerials} disabled={tempSerials.some(s => !s.trim())}>
              Save Serials
            </Button>
          </div>
        </div>
      </div>
    )}

    </>
  );
}
