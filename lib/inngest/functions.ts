import { inngest } from './client';
import { analyzeProductAction } from '../actions/ai-assistant-actions';

// Inngest v4: createFunction takes (options, trigger, handler)
export const processBulkProductAi = inngest.createFunction(
  { id: 'bulk-product-ai-analysis', name: 'Bulk Product AI Analysis', triggers: [{ event: 'ai/product.bulk.analyze' }] },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async ({ event, step }: { event: any; step: any }) => {
    const products: unknown[] = event?.data?.products ?? [];

    // Process one by one using step.run for retryability
    const results = await step.run('process-products', async () => {
      const processed = [];
      for (const product of products) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = await analyzeProductAction(product as any);
        processed.push(result);
      }
      return processed;
    });

    return { message: `Processed ${products.length} products`, results };
  }
);
