'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { updateTransferStatus } from '@/lib/actions/transfer-actions';
import { Check, Truck, XCircle, PackageCheck } from 'lucide-react';
import { toast } from 'sonner';

export function TransferStatusActions({ transfer }: { transfer: any }) {
  const [loading, setLoading] = useState(false);
  

  const handleUpdate = async (status: 'APPROVED' | 'IN_TRANSIT' | 'RECEIVED' | 'CANCELLED') => {
    setLoading(true);
    const res = await updateTransferStatus(transfer.id, status);
    setLoading(false);

    if (res.success) {
      toast.success('Transfer updated successfully');
    } else {
      toast.error('Failed to update transfer', { description: res.error });
    }
  };

  if (transfer.status === 'RECEIVED' || transfer.status === 'CANCELLED') {
    return null; // Terminal states
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {transfer.status === 'DRAFT' && (
        <Button onClick={() => handleUpdate('APPROVED')} disabled={loading}>
          <Check className="mr-2 h-4 w-4" />
          Approve Transfer
        </Button>
      )}

      {transfer.status === 'APPROVED' && (
        <Button onClick={() => handleUpdate('IN_TRANSIT')} disabled={loading}>
          <Truck className="mr-2 h-4 w-4" />
          Mark In-Transit
        </Button>
      )}

      {transfer.status === 'IN_TRANSIT' && (
        <Button onClick={() => handleUpdate('RECEIVED')} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700">
          <PackageCheck className="mr-2 h-4 w-4" />
          Receive Items
        </Button>
      )}

      <Button onClick={() => handleUpdate('CANCELLED')} disabled={loading} variant="destructive">
        <XCircle className="mr-2 h-4 w-4" />
        Cancel Transfer
      </Button>
    </div>
  );
}
