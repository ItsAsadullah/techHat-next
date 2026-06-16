'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Loader2, ArrowLeft, Building2, MapPin, Receipt, Phone } from 'lucide-react';
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
import { createSupplier, updateSupplier, SupplierFormData } from '@/lib/actions/supplier-actions';

interface SupplierFormProps {
  initialData?: any;
  isEditMode?: boolean;
}

export function SupplierForm({ initialData, isEditMode }: SupplierFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Use simple controlled state for the form payload
  const [formData, setFormData] = useState<SupplierFormData>({
    supplierCode: initialData?.supplierCode || '',
    name: initialData?.name || '',
    companyName: initialData?.companyName || '',
    contactPerson: initialData?.contactPerson || '',
    phone: initialData?.phone || '',
    mobileNumber: initialData?.mobileNumber || '',
    whatsapp: initialData?.whatsapp || '',
    email: initialData?.email || '',
    address: initialData?.address || '',
    district: initialData?.district || '',
    country: initialData?.country || 'Bangladesh',
    tradeLicenseNo: initialData?.tradeLicenseNo || '',
    binNumber: initialData?.binNumber || '',
    tinNumber: initialData?.tinNumber || '',
    openingBalance: initialData?.openingBalance || 0,
    status: initialData?.status || 'ACTIVE',
    notes: initialData?.notes || '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'openingBalance' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = { ...formData };
      
      let res;
      if (isEditMode && initialData?.id) {
        res = await updateSupplier(initialData.id, payload);
      } else {
        res = await createSupplier(payload);
      }

      if (res.success) {
        toast.success(isEditMode ? 'Supplier updated successfully!' : 'Supplier created successfully!');
        router.push('/admin/suppliers');
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
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 max-w-[1200px] mx-auto pb-24">
      {/* Header */}
      <div className="flex items-center justify-between sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b py-3 -mx-6 px-6 shadow-sm">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">{isEditMode ? 'Edit Supplier' : 'New Supplier'}</h1>
            <p className="text-xs text-muted-foreground">
              {isEditMode ? 'Update supplier information and settings.' : 'Add a new vendor to your ERP.'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
            Discard
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {isEditMode ? 'Save Changes' : 'Create Supplier'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        {/* Main Details (Left Col) */}
        <div className="md:col-span-2 space-y-6">
          {/* Identity */}
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Primary Details</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Supplier Name (Display Name) <span className="text-red-500">*</span></Label>
                <Input required id="name" name="name" value={formData.name} onChange={handleChange} placeholder="e.g. Global Tech Supplies" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="supplierCode">Supplier Code</Label>
                <Input id="supplierCode" name="supplierCode" value={formData.supplierCode} onChange={handleChange} placeholder="Leave empty to auto-generate" disabled={isEditMode} />
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="companyName">Legal Company Name</Label>
                <Input id="companyName" name="companyName" value={formData.companyName} onChange={handleChange} placeholder="Global Tech Supplies Ltd." />
              </div>
            </div>
          </div>

          {/* Contact Details */}
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Phone className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Contact Information</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contactPerson">Contact Person</Label>
                <Input id="contactPerson" name="contactPerson" value={formData.contactPerson} onChange={handleChange} placeholder="John Doe" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} placeholder="john@example.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone <span className="text-red-500">*</span></Label>
                <Input required id="phone" name="phone" value={formData.phone} onChange={handleChange} placeholder="+8801700000000" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="whatsapp">WhatsApp Number</Label>
                <Input id="whatsapp" name="whatsapp" value={formData.whatsapp} onChange={handleChange} placeholder="+8801700000000" />
              </div>
            </div>
          </div>

          {/* Address Details */}
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Address Details</h2>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address">Street Address</Label>
                <Textarea id="address" name="address" value={formData.address} onChange={handleChange} placeholder="123 Corporate Avenue" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="district">District / City</Label>
                  <Input id="district" name="district" value={formData.district} onChange={handleChange} placeholder="Dhaka" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input id="country" name="country" value={formData.country} onChange={handleChange} placeholder="Bangladesh" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar (Right Col) */}
        <div className="space-y-6">
          {/* Status */}
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <h2 className="text-sm font-semibold mb-3">Status</h2>
            <Select value={formData.status} onValueChange={(v) => handleSelectChange('status', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Ledger / Finance */}
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Receipt className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold">Finance & Legal</h2>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="openingBalance">Opening Balance (৳)</Label>
                <Input 
                  id="openingBalance" 
                  name="openingBalance" 
                  type="number" 
                  min="0"
                  step="0.01"
                  value={formData.openingBalance} 
                  onChange={handleChange} 
                  disabled={isEditMode && initialData?.openingBalance > 0} 
                  className="font-mono"
                />
                <p className="text-[10px] text-muted-foreground leading-tight">
                  Set this only when creating the supplier to establish initial payable balance.
                </p>
              </div>
              <div className="space-y-2 border-t pt-4">
                <Label htmlFor="tradeLicenseNo" className="text-xs">Trade License</Label>
                <Input id="tradeLicenseNo" name="tradeLicenseNo" value={formData.tradeLicenseNo} onChange={handleChange} className="h-8 text-xs" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="binNumber" className="text-xs">BIN Number</Label>
                <Input id="binNumber" name="binNumber" value={formData.binNumber} onChange={handleChange} className="h-8 text-xs" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tinNumber" className="text-xs">TIN Number</Label>
                <Input id="tinNumber" name="tinNumber" value={formData.tinNumber} onChange={handleChange} className="h-8 text-xs" />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <h2 className="text-sm font-semibold mb-3">Internal Notes</h2>
            <Textarea 
              id="notes" 
              name="notes" 
              value={formData.notes} 
              onChange={handleChange} 
              placeholder="Private notes about this supplier..." 
              className="min-h-[120px]"
            />
          </div>
        </div>
      </div>
    </form>
  );
}
