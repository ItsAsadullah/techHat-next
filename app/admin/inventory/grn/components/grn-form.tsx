// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Save, Loader2, ArrowLeft, PackageCheck } from 'lucide-react';
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
import { createGRN, GRNFormData } from '@/lib/actions/grn-actions';
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
      
      const newItems = ((po || {}).items || []).map((pi: any) => ({
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
        unitCost: pi.unitCost
      }));
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
          unitCost: i.unitCost
        }))
      };

      const res = await createGRN(payload);
      if (('data' in res)) {
        toast.success('Goods Receive Note drafted!');
        router.push(`/admin/inventory/grn/${(res as any).data.id}`);
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
            <h1 className="text-xl font-bold">New Goods Receive Note</h1>
            <p className="text-xs text-muted-foreground">Draft a new receipt against an approved Purchase Order.</p>
          </div>
        </div>
        <Button type="submit" disabled={loading || poLoading}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Draft GRN
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-4">
        {/* Main Section */}
        <div className="md:col-span-3 space-y-6">
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Source Purchase Order <span className="text-red-500">*</span></Label>
              <Select value={poId} onValueChange={setPoId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select Approved PO..." />
                </SelectTrigger>
                <SelectContent>
                  {approvedPOs.map(po => (
                    <SelectItem key={(po || {}).id} value={(po || {}).id}>{(po || {}).poNumber} ({(po || {}).supplier.name})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Destination Warehouse <span className="text-red-500">*</span></Label>
              <Select value={warehouseId} onValueChange={setWarehouseId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select destination..." />
                </SelectTrigger>
                <SelectContent>
                  {warehouses.map(w => (
                    <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
            <div className="p-4 border-b bg-muted/20">
              <h3 className="font-semibold flex items-center gap-2">
                <PackageCheck className="h-5 w-5 text-primary" /> Inspect & Receive Items
              </h3>
            </div>
            
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/10">
                  <TableRow>
                    <TableHead className="w-[250px]">Product</TableHead>
                    <TableHead className="text-center">Pending</TableHead>
                    <TableHead className="w-[100px] text-center">Receive</TableHead>
                    <TableHead className="w-[100px] text-center">Reject</TableHead>
                    <TableHead className="text-center bg-green-500/10 text-green-700">Accept</TableHead>
                    <TableHead className="w-[150px]">Serial / IMEI</TableHead>
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
                    <TableRow key={item.poItemId} className={item.pendingQty === 0 ? "opacity-50" : ""}>
                      <TableCell>
                        <div className="font-medium text-sm">{item.name}</div>
                        {item.variantName && <div className="text-xs text-muted-foreground">{item.variantName}</div>}
                        <div className="text-[10px] font-mono text-muted-foreground">{item.sku}</div>
                      </TableCell>
                      <TableCell className="text-center font-mono font-medium">
                        {item.pendingQty}
                        <div className="text-[10px] text-muted-foreground mt-0.5">{item.previouslyReceivedQty} / {item.orderedQty} rec.</div>
                      </TableCell>
                      <TableCell>
                        <Input 
                          type="number" min="0" max={item.pendingQty} className="h-8 text-center"
                          value={item.receivedQty}
                          onChange={(e) => updateItem(index, 'receivedQty', parseInt(e.target.value) || 0)}
                          disabled={item.pendingQty === 0}
                        />
                      </TableCell>
                      <TableCell>
                        <Input 
                          type="number" min="0" max={item.receivedQty} className="h-8 text-center text-red-500"
                          value={item.rejectedQty}
                          onChange={(e) => updateItem(index, 'rejectedQty', parseInt(e.target.value) || 0)}
                          disabled={item.pendingQty === 0}
                        />
                      </TableCell>
                      <TableCell className="text-center font-bold text-green-600 bg-green-500/5">
                        {item.acceptedQty}
                      </TableCell>
                      <TableCell>
                        <Input 
                          type="text" placeholder="Serial/IMEI" className="h-8 text-xs font-mono"
                          value={item.serialNumber}
                          onChange={(e) => updateItem(index, 'serialNumber', e.target.value)}
                          disabled={item.pendingQty === 0}
                        />
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
            <h2 className="text-sm font-semibold mb-3">Receipt Notes</h2>
            <Textarea 
              value={note} 
              onChange={(e) => setNote(e.target.value)} 
              placeholder="Delivery condition, driver details, reference codes..." 
              className="min-h-[120px] text-sm"
            />
          </div>
        </div>
      </div>
    </form>
  );
}
