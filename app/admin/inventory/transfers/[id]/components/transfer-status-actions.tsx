'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { updateTransferStatus } from '@/lib/actions/transfer-actions';
import { Check, Truck, XCircle, PackageCheck, Loader2, Printer } from 'lucide-react';
import { toast } from 'sonner';
import { useConfirm } from '@/components/providers/confirm-provider';

const descriptions = {
  APPROVED: 'Approve this transfer? These quantities will be reserved and unavailable for other transfers or sales.',
  IN_TRANSIT: 'Confirm the goods have left the source warehouse? Source stock will decrease and the goods will be tracked in transit.',
  RECEIVED: 'Confirm every listed item and quantity has arrived and been checked? Destination stock will increase. For a shortage or damage, leave this transfer in transit until the discrepancy is resolved.',
  CANCELLED: 'Cancel this transfer? Any reserved stock will be released. No goods will be moved.',
};
export function TransferStatusActions({ transfer }: { transfer: { id: string; status: string } }) {
  const [loading, setLoading] = useState(false);
  const confirm = useConfirm();
  const router = useRouter();
  async function update(status: keyof typeof descriptions) {
    if (loading || !(await confirm(descriptions[status]))) return;
    setLoading(true);
    try {
      const result = await updateTransferStatus(transfer.id, status);
      if (!result.success) throw new Error(result.error);
      toast.success('Transfer updated successfully');
      router.refresh();
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Unable to update transfer.'); }
    finally { setLoading(false); }
  }
  return <div className="flex flex-wrap items-center gap-2 print:hidden">
    <Button variant="outline" onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" />Print</Button>
    {transfer.status === 'DRAFT' && <Button onClick={() => update('APPROVED')} disabled={loading}>{loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}Approve & reserve</Button>}
    {transfer.status === 'APPROVED' && <Button onClick={() => update('IN_TRANSIT')} disabled={loading}>{loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Truck className="mr-2 h-4 w-4" />}Dispatch goods</Button>}
    {transfer.status === 'IN_TRANSIT' && <Button onClick={() => update('RECEIVED')} disabled={loading}>{loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PackageCheck className="mr-2 h-4 w-4" />}Confirm full receipt</Button>}
    {['DRAFT', 'APPROVED'].includes(transfer.status) && <Button onClick={() => update('CANCELLED')} disabled={loading} variant="outline" className="text-destructive"><XCircle className="mr-2 h-4 w-4" />Cancel transfer</Button>}
  </div>;
}
