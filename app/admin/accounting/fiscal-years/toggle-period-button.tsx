'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { togglePeriodStatus } from '@/lib/actions/fiscal-year-actions';
import { toast } from 'sonner';

export default function TogglePeriodButton({ periodId, isClosed }: { periodId: string; isClosed: boolean }) {
  const [loading, setLoading] = useState(false);

  async function handleToggle() {
    setLoading(true);
    try {
      const res = await togglePeriodStatus(periodId, !isClosed);
      if (res.success) {
        toast.success(`Period ${!isClosed ? 'closed' : 'opened'} successfully`);
      } else {
        toast.error(res.error || 'Failed to toggle period');
      }
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button 
      variant={isClosed ? 'outline' : 'secondary'} 
      size="sm" 
      onClick={handleToggle} 
      disabled={loading}
    >
      {loading ? '...' : isClosed ? 'Reopen Period' : 'Close Period'}
    </Button>
  );
}
