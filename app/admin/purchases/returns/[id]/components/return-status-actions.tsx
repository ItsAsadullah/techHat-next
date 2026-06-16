'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { updatePurchaseReturnStatus } from '@/lib/actions/purchase-return-actions';
import { Check, XCircle, PackageMinus, Lock } from 'lucide-react';
import { toast } from 'sonner';

export function ReturnStatusActions({ pr }: { pr: any }) {
  const [loading, setLoading] = useState(false);
  

  const handleUpdate = async (status: 'APPROVED' | 'RETURNED' | 'CLOSED' | 'CANCELLED') => {
    setLoading(true);
    const res = await updatePurchaseReturnStatus(pr.id, status);
    setLoading(false);

    if (res.success) {
      toast.success('Return updated successfully');
    } else {
      toast.error('Failed to update return', { description: res.error });
    }
  };

  if (pr.status === 'CLOSED' || pr.status === 'CANCELLED') {
    return null; // Terminal states
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {pr.status === 'DRAFT' && (
        <Button onClick={() => handleUpdate('APPROVED')} disabled={loading}>
          <Check className="mr-2 h-4 w-4" />
          Approve Return
        </Button>
      )}

      {pr.status === 'APPROVED' && (
        <Button onClick={() => handleUpdate('RETURNED')} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700">
          <PackageMinus className="mr-2 h-4 w-4" />
          Mark as Returned (Deduct Stock)
        </Button>
      )}

      {pr.status === 'RETURNED' && (
        <Button onClick={() => handleUpdate('CLOSED')} disabled={loading}>
          <Lock className="mr-2 h-4 w-4" />
          Close Return
        </Button>
      )}

      {pr.status !== 'RETURNED' && (
        <Button onClick={() => handleUpdate('CLOSED')} disabled={loading} variant="destructive">
          <XCircle className="mr-2 h-4 w-4" />
          Cancel
        </Button>
      )}
    </div>
  );
}
