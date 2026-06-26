'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { XOctagon, Loader2, AlertTriangle } from 'lucide-react';
import { cancelWarrantyClaim } from '@/lib/actions/warranty-actions';

interface CancelClaimDialogProps {
  claim: any;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CancelClaimDialog({ claim, open, onClose, onSuccess }: CancelClaimDialogProps) {
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState('');

  const handleSubmit = async () => {
    if (!reason.trim()) return toast.error('Please enter a cancellation reason.');
    setLoading(true);
    const res = await cancelWarrantyClaim(claim.id, reason);
    setLoading(false);
    if (res.success) {
      toast.success('Warranty claim cancelled.');
      onSuccess();
      onClose();
    } else {
      toast.error(res.error || 'Failed to cancel claim.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-extrabold text-red-700">
            <XOctagon className="w-5 h-5" />
            Cancel Claim
          </DialogTitle>
        </DialogHeader>
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <p className="text-[11px] text-red-700 font-semibold">
            This will cancel <span className="font-mono font-black">{claim?.claimNumber}</span> and move the product back to Main Warehouse.
          </p>
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Cancellation Reason *</label>
          <Textarea
            placeholder="Enter reason for cancellation..."
            value={reason}
            onChange={e => setReason(e.target.value)}
            className="rounded-xl resize-none text-sm min-h-[80px]"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1 rounded-xl h-11 font-bold">Keep Claim</Button>
          <Button onClick={handleSubmit} disabled={loading} className="flex-1 rounded-xl h-11 font-bold bg-red-600 hover:bg-red-700 text-white">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Cancel Claim'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
