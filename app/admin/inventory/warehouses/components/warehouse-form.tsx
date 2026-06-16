'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Loader2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createWarehouse, updateWarehouse, WarehouseFormData } from '@/lib/actions/warehouse-actions';

interface WarehouseFormProps {
  initialData?: any;
  isEditMode?: boolean;
}

export function WarehouseForm({ initialData, isEditMode }: WarehouseFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState<WarehouseFormData>({
    name: initialData?.name || '',
    code: initialData?.code || '',
    type: initialData?.type || 'MAIN',
    address: initialData?.address || '',
    isActive: initialData?.isActive ?? true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.code) {
      return toast.error('Name and Code are required');
    }

    setLoading(true);

    try {
      let res;
      if (isEditMode && initialData?.id) {
        res = await updateWarehouse(initialData.id, formData);
      } else {
        res = await createWarehouse(formData);
      }

      if (res.success) {
        toast.success(isEditMode ? 'Warehouse updated!' : 'Warehouse created!');
        router.push('/admin/inventory/warehouses');
      } else {
        toast.error(res.error || 'Something went wrong.');
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to save warehouse.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 max-w-3xl pb-10">
      <div className="flex items-center justify-between bg-background p-4 rounded-xl border shadow-sm sticky top-[138px] z-30">
        <div className="flex items-center gap-3">
          <Button type="button" variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">{isEditMode ? 'Edit Warehouse' : 'New Warehouse'}</h1>
            <p className="text-xs text-muted-foreground">Fill in the details for this storage facility.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button type="submit" disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {isEditMode ? 'Save Changes' : 'Create Warehouse'}
          </Button>
        </div>
      </div>

      <div className="bg-card border rounded-xl shadow-sm p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="name">Warehouse Name <span className="text-red-500">*</span></Label>
            <Input 
              id="name" 
              placeholder="e.g. Main HQ, Uttara Store" 
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="code">Warehouse Code <span className="text-red-500">*</span></Label>
            <Input 
              id="code" 
              placeholder="e.g. WH-MAIN, WH-UTT" 
              value={formData.code}
              onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Type</Label>
            <Select 
              value={formData.type} 
              onValueChange={(v: any) => setFormData({ ...formData, type: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MAIN">Main Warehouse</SelectItem>
                <SelectItem value="STORE">Retail Store</SelectItem>
                <SelectItem value="TRANSIT">Transit Hub</SelectItem>
                <SelectItem value="DAMAGE">Damage/Return Center</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 pt-8 flex items-center justify-between border rounded-md px-4">
            <div>
              <Label className="text-base">Active Status</Label>
              <p className="text-xs text-muted-foreground">Is this facility currently operational?</p>
            </div>
            <Switch 
              checked={formData.isActive}
              onCheckedChange={checked => setFormData({ ...formData, isActive: checked })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Address & Details</Label>
          <Textarea 
            id="address" 
            placeholder="Full physical address, contact numbers, working hours, etc." 
            className="min-h-[120px]"
            value={formData.address}
            onChange={e => setFormData({ ...formData, address: e.target.value })}
          />
        </div>
      </div>
    </form>
  );
}
