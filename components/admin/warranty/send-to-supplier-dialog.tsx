'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Truck, Package, Calendar, Hash, DollarSign, Building2, Loader2 } from 'lucide-react';
import { sendToSupplier } from '@/lib/actions/warranty-actions';
import { getSupplierOptions } from '@/lib/actions/supplier-actions';

interface SendToSupplierDialogProps {
  claim: any;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function SendToSupplierDialog({ claim, open, onClose, onSuccess }: SendToSupplierDialogProps) {
  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [form, setForm] = useState({
    supplierName: '',
    courierCompany: '',
    trackingNumber: '',
    dispatchDate: new Date().toISOString().slice(0, 10),
    estimatedReturnDate: '',
    outgoingCourierCost: '',
    remarks: '',
  });

  useEffect(() => {
    async function loadSuppliers() {
      const res = await getSupplierOptions();
      if (res.success) {
        setSuppliers(res.data || []);
      }
    }
    loadSuppliers();
  }, []);

  const update = (key: string, value: string) => setForm(f => ({ ...f, [key]: value }));

  const handleSubmit = async () => {
    if (!form.supplierName.trim()) return toast.error('Please select supplier.');
    if (!form.estimatedReturnDate) return toast.error('Please enter expected return date.');

    setLoading(true);
    const res = await sendToSupplier(claim.id, {
      supplierName: form.supplierName,
      courierCompany: form.courierCompany,
      trackingNumber: form.trackingNumber,
      dispatchDate: form.dispatchDate,
      estimatedReturnDate: form.estimatedReturnDate,
      outgoingCourierCost: parseFloat(form.outgoingCourierCost) || 0,
      remarks: form.remarks,
    });
    setLoading(false);

    if (res.success) {
      toast.success('Dispatched to supplier successfully.');
      onSuccess();
      onClose();
    } else {
      toast.error(res.error || 'Failed to dispatch.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-extrabold">
            <Truck className="w-5 h-5 text-orange-500" />
            Send to Supplier
          </DialogTitle>
          <p className="text-xs text-slate-500 font-mono mt-0.5">{claim?.claimNumber}</p>
        </DialogHeader>

        <div className="space-y-3 mt-1">
          <Field icon={<Building2 className="w-4 h-4 text-slate-400" />} label="Supplier Name *">
            <Select value={form.supplierName} onValueChange={(v) => update('supplierName', v)}>
              <SelectTrigger className="h-10 rounded-xl text-sm">
                <SelectValue placeholder="Select supplier..." />
              </SelectTrigger>
              <SelectContent>
                {suppliers.length === 0 ? (
                  <div className="p-2 text-sm text-slate-500 text-center">No active suppliers found</div>
                ) : (
                  suppliers.map(s => (
                    <SelectItem key={s.id} value={s.companyName || s.name}>
                      {s.companyName || s.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </Field>
          <Field icon={<Truck className="w-4 h-4 text-slate-400" />} label="Courier Company">
            <Input placeholder="e.g. Sundarban, Pathao, Redx" value={form.courierCompany} onChange={e => update('courierCompany', e.target.value)} className="rounded-xl h-10 text-sm" />
          </Field>
          <Field icon={<Hash className="w-4 h-4 text-slate-400" />} label="Tracking Number">
            <Input placeholder="Parcel tracking number" value={form.trackingNumber} onChange={e => update('trackingNumber', e.target.value)} className="rounded-xl h-10 text-sm font-mono" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field icon={<Calendar className="w-4 h-4 text-slate-400" />} label="Dispatch Date">
              <Input type="date" value={form.dispatchDate} onChange={e => update('dispatchDate', e.target.value)} className="rounded-xl h-10 text-sm" />
            </Field>
            <Field icon={<Calendar className="w-4 h-4 text-slate-400" />} label="Est. Return Date *">
              <Input type="date" value={form.estimatedReturnDate} onChange={e => update('estimatedReturnDate', e.target.value)} className="rounded-xl h-10 text-sm" />
            </Field>
          </div>
          <Field icon={<DollarSign className="w-4 h-4 text-slate-400" />} label="Courier Cost (৳)">
            <Input type="number" min="0" placeholder="0" value={form.outgoingCourierCost} onChange={e => update('outgoingCourierCost', e.target.value)} className="rounded-xl h-10 text-sm" />
          </Field>
          <Field icon={<Package className="w-4 h-4 text-slate-400" />} label="Remarks">
            <Textarea placeholder="Any notes for supplier..." value={form.remarks} onChange={e => update('remarks', e.target.value)} className="rounded-xl resize-none text-sm min-h-[70px]" />
          </Field>
        </div>

        <div className="flex gap-2 mt-2">
          <Button variant="outline" onClick={onClose} className="flex-1 rounded-xl h-11 font-bold">Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading} className="flex-1 rounded-xl h-11 font-bold bg-orange-500 hover:bg-orange-600 text-white">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Truck className="w-4 h-4 mr-1" /> Send to Supplier</>}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Field({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
        {icon}{label}
      </label>
      {children}
    </div>
  );
}
