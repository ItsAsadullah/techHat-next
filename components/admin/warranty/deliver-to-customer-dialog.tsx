'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { User, Phone, Calendar, CheckCircle2, Loader2 } from 'lucide-react';
import { deliverToCustomer } from '@/lib/actions/warranty-actions';

interface DeliverToCustomerDialogProps {
  claim: any;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function DeliverToCustomerDialog({ claim, open, onClose, onSuccess }: DeliverToCustomerDialogProps) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    receiverName: claim?.order?.customerName || '',
    receiverPhone: claim?.order?.customerPhone || '',
    deliveryDate: new Date().toISOString().slice(0, 10),
    remarks: '',
  });

  const update = (key: string, value: string) => setForm(f => ({ ...f, [key]: value }));

  const handleSubmit = async () => {
    if (!form.receiverName.trim()) return toast.error('Please enter receiver name.');
    if (!form.receiverPhone.trim()) return toast.error('Please enter receiver phone.');

    setLoading(true);
    const res = await deliverToCustomer(claim.id, {
      receiverName: form.receiverName,
      receiverPhone: form.receiverPhone,
      deliveryDate: form.deliveryDate,
      remarks: form.remarks,
    });
    setLoading(false);

    if (res.success) {
      toast.success('Product delivered. Claim closed successfully!');
      onSuccess();
      onClose();
    } else {
      toast.error(res.error || 'Failed to complete delivery.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-extrabold">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            Deliver to Customer
          </DialogTitle>
          <p className="text-xs text-slate-500 font-mono mt-0.5">{claim?.claimNumber}</p>
        </DialogHeader>

        {/* Customer info banner */}
        <div className="bg-slate-50 rounded-xl p-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-sm shrink-0">
            {(claim?.order?.customerName || 'C').charAt(0)}
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900">{claim?.order?.customerName}</p>
            <p className="text-xs text-slate-500 font-mono">{claim?.order?.customerPhone}</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5"><User className="w-4 h-4" />Receiver Name *</label>
              <Input value={form.receiverName} onChange={e => update('receiverName', e.target.value)} className="rounded-xl h-10 text-sm" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5"><Phone className="w-4 h-4" />Phone *</label>
              <Input value={form.receiverPhone} onChange={e => update('receiverPhone', e.target.value)} className="rounded-xl h-10 text-sm font-mono" />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5"><Calendar className="w-4 h-4" />Delivery Date</label>
            <Input type="date" value={form.deliveryDate} onChange={e => update('deliveryDate', e.target.value)} className="rounded-xl h-10 text-sm" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Remarks</label>
            <Textarea placeholder="Any delivery notes..." value={form.remarks} onChange={e => update('remarks', e.target.value)} className="rounded-xl resize-none text-sm min-h-[60px]" />
          </div>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
          <p className="text-[11px] font-bold text-emerald-800">⚡ This will close the warranty claim permanently.</p>
          <p className="text-[11px] text-emerald-600 mt-0.5">Stock will be removed from Warranty Store. Sales ledger unchanged.</p>
        </div>

        <div className="flex gap-2 mt-1">
          <Button variant="outline" onClick={onClose} className="flex-1 rounded-xl h-11 font-bold">Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading} className="flex-1 rounded-xl h-11 font-bold bg-emerald-600 hover:bg-emerald-700 text-white">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle2 className="w-4 h-4 mr-1" /> Confirm Delivery</>}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
