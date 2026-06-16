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
import { createTransfer } from '@/lib/actions/transfer-actions';

export function TransferForm({ warehouses, products }: { warehouses: any[], products: any[] }) {
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [sourceId, setSourceId] = useState('');
  const [destinationId, setDestinationId] = useState('');
  const [note, setNote] = useState('');
  const [transferCost, setTransferCost] = useState('0');
  
  const [items, setItems] = useState([{ productId: '', variantId: '', quantity: 1 }]);

  const handleAddItem = () => setItems([...items, { productId: '', variantId: '', quantity: 1 }]);
  const handleRemoveItem = (index: number) => setItems(items.filter((_, i) => i !== index));

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...items];
    (newItems[index] as any)[field] = value;
    
    // Auto-select first variant if product changes
    if (field === 'productId') {
      const product = products.find(p => p.id === value);
      if (product?.variants?.length > 0) {
        newItems[index].variantId = product.variants[0].id;
      } else {
        newItems[index].variantId = '';
      }
    }
    setItems(newItems);
  };

  const onSubmit = async () => {
    if (!sourceId || !destinationId) {
      toast.error('Validation Error', { description: 'Please select both source and destination' });
      return;
    }
    if (sourceId === destinationId) {
      toast.error('Validation Error', { description: 'Source and destination cannot be the same' });
      return;
    }

    const validItems = items.filter(i => i.productId && i.quantity > 0);
    if (validItems.length === 0) {
      toast.error('Validation Error', { description: 'Add at least one valid item' });
      return;
    }

    setLoading(true);
    const res = await createTransfer({
      sourceId,
      destinationId,
      unitCost: parseFloat(transferCost),
      note,
      items: validItems
    });
    setLoading(false);

    if (res.success) {
      toast.success('Transfer Draft Created Successfully');
      router.push(`/admin/inventory/transfers/${res.data?.id}`);
    } else {
      toast.error('Error', { description: res.error });
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Routing Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Source Warehouse</Label>
              <Select value={sourceId} onValueChange={setSourceId}>
                <SelectTrigger><SelectValue placeholder="Select Source" /></SelectTrigger>
                <SelectContent>
                  {warehouses.map(w => (
                    <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Destination Warehouse</Label>
              <Select value={destinationId} onValueChange={setDestinationId}>
                <SelectTrigger><SelectValue placeholder="Select Destination" /></SelectTrigger>
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
            <CardTitle>Transfer Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Transfer Cost (Shipping, Handling)</Label>
              <Input type="number" value={transferCost} onChange={e => setTransferCost(e.target.value)} />
            </div>
            
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Reason for transfer..." />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Transfer Items</CardTitle>
          <Button type="button" variant="outline" size="sm" onClick={handleAddItem}>
            <Plus className="h-4 w-4 mr-2" /> Add Item
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {items.map((item, index) => {
            const product = products.find(p => p.id === item.productId);
            
            return (
              <div key={index} className="flex flex-col sm:flex-row gap-4 items-start sm:items-end p-4 border rounded-lg bg-muted/20">
                <div className="flex-1 space-y-2 w-full">
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
                  <div className="flex-1 space-y-2 w-full">
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

                <div className="w-full sm:w-32 space-y-2">
                  <Label>Quantity</Label>
                  <Input 
                    type="number" 
                    min="1" 
                    value={item.quantity} 
                    onChange={e => handleItemChange(index, 'quantity', parseInt(e.target.value) || 1)} 
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
          Create Transfer Draft
        </Button>
      </div>
    </div>
  );
}
