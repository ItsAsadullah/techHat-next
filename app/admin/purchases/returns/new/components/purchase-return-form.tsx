'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Plus, Trash2, Save } from 'lucide-react';
import { createPurchaseReturn } from '@/lib/actions/purchase-return-actions';

export function PurchaseReturnForm({ 
  suppliers, 
  warehouses, 
  products,
  purchaseOrders
}: { 
  suppliers: any[], 
  warehouses: any[], 
  products: any[],
  purchaseOrders: any[]
}) {
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [supplierId, setSupplierId] = useState('');
  const [purchaseOrderId, setPurchaseOrderId] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [reason, setReason] = useState('');
  
  const [items, setItems] = useState([{ productId: '', variantId: '', returnQty: 1, unitCost: 0 }]);

  const handleAddItem = () => setItems([...items, { productId: '', variantId: '', returnQty: 1, unitCost: 0 }]);
  const handleRemoveItem = (index: number) => setItems(items.filter((_, i) => i !== index));

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...items];
    (newItems[index] as any)[field] = value;
    
    if (field === 'productId') {
      const product = products.find(p => p.id === value);
      if (product) {
        newItems[index].unitCost = product.costPrice || 0;
        if (product.variants?.length > 0) {
          newItems[index].variantId = product.variants[0].id;
          newItems[index].unitCost = product.variants[0].costPrice || product.costPrice || 0;
        } else {
          newItems[index].variantId = '';
        }
      }
    }
    
    if (field === 'variantId') {
      const product = products.find(p => p.id === newItems[index].productId);
      const variant = product?.variants?.find((v: any) => v.id === value);
      if (variant) {
        newItems[index].unitCost = variant.costPrice || 0;
      }
    }
    
    setItems(newItems);
  };

  const onSubmit = async () => {
    if (!supplierId || !purchaseOrderId || !warehouseId) {
      toast.error('Validation Error', { description: 'Please fill in all required reference fields' });
      return;
    }

    const validItems = items.filter(i => i.productId && i.returnQty > 0 && i.unitCost > 0);
    if (validItems.length === 0) {
      toast.error('Validation Error', { description: 'Add at least one valid item with a positive cost' });
      return;
    }

    setLoading(true);
    const res = await createPurchaseReturn({
      supplierId,
      purchaseOrderId,
      warehouseId,
      reason,
      items: validItems
    });
    setLoading(false);

    if (res.success) {
      toast.success('Return Draft Created Successfully');
      router.push(`/admin/purchases/returns/${res.data?.id}`);
    } else {
      toast.error('Error', { description: res.error });
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Return Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Supplier</Label>
              <Select value={supplierId} onValueChange={setSupplierId}>
                <SelectTrigger><SelectValue placeholder="Select Supplier" /></SelectTrigger>
                <SelectContent>
                  {suppliers.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Reference Purchase Order</Label>
              <Select value={purchaseOrderId} onValueChange={setPurchaseOrderId}>
                <SelectTrigger><SelectValue placeholder="Select PO" /></SelectTrigger>
                <SelectContent>
                  {purchaseOrders.map(po => (
                    <SelectItem key={po.id} value={po.id}>{po.poNumber}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Deduct from Warehouse</Label>
              <Select value={warehouseId} onValueChange={setWarehouseId}>
                <SelectTrigger><SelectValue placeholder="Select Warehouse" /></SelectTrigger>
                <SelectContent>
                  {warehouses.map(w => (
                    <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Additional Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Reason for Return</Label>
              <Textarea 
                value={reason} 
                onChange={e => setReason(e.target.value)} 
                placeholder="Damaged goods, wrong items sent..." 
                className="min-h-[140px]"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Returned Items</CardTitle>
          <Button type="button" variant="outline" size="sm" onClick={handleAddItem}>
            <Plus className="h-4 w-4 mr-2" /> Add Item
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {items.map((item, index) => {
            const product = products.find(p => p.id === item.productId);
            
            return (
              <div key={index} className="flex flex-col sm:flex-row gap-4 items-start sm:items-end p-4 border rounded-lg bg-muted/20">
                <div className="flex-[2] space-y-2 w-full">
                  <Label>Product</Label>
                  <Select value={item.productId} onValueChange={(val) => handleItemChange(index, 'productId', val)}>
                    <SelectTrigger><SelectValue placeholder="Select Product" /></SelectTrigger>
                    <SelectContent>
                      {products.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.name} ({p.sku})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {product?.variants?.length > 0 && (
                  <div className="flex-[1.5] space-y-2 w-full">
                    <Label>Variant</Label>
                    <Select value={item.variantId} onValueChange={(val) => handleItemChange(index, 'variantId', val)}>
                      <SelectTrigger><SelectValue placeholder="Select Variant" /></SelectTrigger>
                      <SelectContent>
                        {product.variants.map((v: any) => (
                          <SelectItem key={v.id} value={v.id}>{v.name} ({v.sku})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="flex-1 space-y-2 w-full">
                  <Label>Quantity</Label>
                  <Input 
                    type="number" 
                    min="1" 
                    value={item.returnQty} 
                    onChange={e => handleItemChange(index, 'returnQty', parseInt(e.target.value) || 1)} 
                  />
                </div>

                <div className="flex-1 space-y-2 w-full">
                  <Label>Return Unit Cost (৳)</Label>
                  <Input 
                    type="number" 
                    min="0"
                    step="0.01" 
                    value={item.unitCost} 
                    onChange={e => handleItemChange(index, 'unitCost', parseFloat(e.target.value) || 0)} 
                  />
                </div>

                <Button type="button" variant="destructive" size="icon" onClick={() => handleRemoveItem(index)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={() => router.back()}>Cancel</Button>
        <Button onClick={onSubmit} disabled={loading}>
          <Save className="h-4 w-4 mr-2" />
          Create Return Draft
        </Button>
      </div>
    </div>
  );
}
