'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function InventoryError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Inventory module error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center space-y-4">
      <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-2">
        <AlertTriangle className="w-8 h-8" />
      </div>
      <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Inventory Module Error</h2>
      <p className="text-sm text-gray-500 max-w-md">
        We encountered an issue loading this inventory page. It might be a temporary connection issue.
      </p>
      
      <Button onClick={() => reset()} className="flex items-center gap-2 mt-4">
        <RefreshCw className="w-4 h-4" />
        Try again
      </Button>
    </div>
  );
}
