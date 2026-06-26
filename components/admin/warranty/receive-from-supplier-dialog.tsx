'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PackageCheck, Calendar, Truck, DollarSign, Loader2, CheckCircle2, XCircle, RotateCcw } from 'lucide-react';
import { receiveFromSupplier } from '@/lib/actions/warranty-actions';

interface ReceiveFromSupplierDialogProps {
  claim: any;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CONDITIONS = [
  { id: 'Repaired',  label: 'Repaired',  desc: 'Fixed and returned',    icon: CheckCircle2, color: 'text-emerald-600' },
  { id: 'Replaced',  label: 'Replaced',  desc: 'New unit provided',      icon: RotateCcw,    color: 'text-blue-600'    },
  { id: 'Rejected',  label: 'Rejected',  desc: 'Warranty rejected',      icon: XCircle,      color: 'text-red-600'     },
];

export function ReceiveFromSupplierDialog({ claim, open, onClose, onSuccess }: ReceiveFromSupplierDialogProps) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    returnedDate: new Date().toISOString().slice(0, 10),
    returnCourier: '',
    incomingCourierCost: '',
    condition: '' as 'Repaired' | 'Replaced' | 'Rejected' | '',
    remarks: '',
  });

  const update = (key: string, value: string) => setForm(f => ({ ...f, [key]: value }));

  const handleSubmit = async () => {
    if (!form.condition) return toast.error('Please select the return condition.');
    if (!form.returnCourier.trim()) return toast.error('Please enter the return courier.');

    setLoading(true);
    const res = await receiveFromSupplier(claim.id, {
      returnedDate: form.returnedDate,
      returnCourier: form.returnCourier,
      incomingCourierCost: parseFloat(form.incomingCourierCost) || 0,
      condition: form.condition as 'Repaired' | 'Replaced' | 'Rejected',
      remarks: form.remarks,
    });
    setLoading(false);

    if (res.success) {
      toast.success('Product received from supplier.');
      onSuccess();
      onClose();
    } else {
      toast.error(res.error || 'Failed to receive product.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-extrabold">
            <PackageCheck className="w-5 h-5 text-blue-500" />
            Receive from Supplier
          </DialogTitle>
          <p className="text-xs text-slate-500 font-mono mt-0.5">{claim?.claimNumber}</p>
        </DialogHeader>

        <div className="space-y-3 mt-1">
          {/* Condition picker */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Return Condition *</label>
            <div className="grid grid-cols-3 gap-2">
              {CONDITIONS.map(c => {
                const Icon = c.icon;
                const isSelected = form.condition === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => update('condition', c.id)}
                    className={`p-3 rounded-xl border-2 text-center flex flex-col items-center gap-1.5 transition-all ${
                      isSelected ? 'border-current bg-slate-50 shadow-sm ' + c.color : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isSelected ? c.color : 'text-slate-400'}`} />
                    <span className={`text-xs font-bold leading-none ${isSelected ? c.color : 'text-slate-700'}`}>{c.label}</span>
                    <span className="text-[9px] text-slate-400 leading-tight">{c.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5"><Calendar className="w-4 h-4" />Return Date</label>
              <Input type="date" value={form.returnedDate} onChange={e => update('returnedDate', e.target.value)} className="rounded-xl h-10 text-sm" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5"><Truck className="w-4 h-4" />Return Courier *</label>
              <Input placeholder="Courier name" value={form.returnCourier} onChange={e => update('returnCourier', e.target.value)} className="rounded-xl h-10 text-sm" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5"><DollarSign className="w-4 h-4 text-slate-400" />Incoming Courier Cost (৳)</label>
            <Input type="number" min="0" placeholder="0" value={form.incomingCourierCost} onChange={e => update('incomingCourierCost', e.target.value)} className="rounded-xl h-10 text-sm" />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Remarks</label>
            <Textarea placeholder="Any notes about the returned product..." value={form.remarks} onChange={e => update('remarks', e.target.value)} className="rounded-xl resize-none text-sm min-h-[70px]" />
          </div>
        </div>

        <div className="flex gap-2 mt-2">
          <Button variant="outline" onClick={onClose} className="flex-1 rounded-xl h-11 font-bold">Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading} className="flex-1 rounded-xl h-11 font-bold bg-blue-600 hover:bg-blue-700 text-white">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><PackageCheck className="w-4 h-4 mr-1" /> Mark Received</>}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
