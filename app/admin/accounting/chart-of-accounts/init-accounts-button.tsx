'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { initializeSystemAccounts } from '@/lib/actions/accounting-setup-actions';
import { toast } from 'sonner';

export default function InitAccountsButton() {
  const [loading, setLoading] = useState(false);

  async function handleInit() {
    setLoading(true);
    try {
      const res = await initializeSystemAccounts();
      if (res.success) {
        toast.success(res.message);
      } else {
        toast.error(res.error || 'Failed to initialize accounts');
      }
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button onClick={handleInit} disabled={loading}>
      {loading ? 'Initializing...' : 'Initialize System Accounts'}
    </Button>
  );
}
