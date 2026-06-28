import { serve } from 'inngest/next';
import { inngest } from '@/lib/inngest/client';
import { processBulkProductAi } from '@/lib/inngest/functions';
import { checkLowStock, orderPlacedNotification } from '@/lib/inngest/inventory-jobs';

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    processBulkProductAi,
    checkLowStock,
    orderPlacedNotification
  ],
});
