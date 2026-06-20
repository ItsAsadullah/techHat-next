import { inngest } from './client';
import { analyzeProductAction } from '../actions/ai-assistant-actions';

export const processBulkProductAi = inngest.createFunction(
  { id: 'bulk-product-ai-analysis' },
  { event: 'ai/product.bulk.analyze' },
  async ({ event, step }) => {
    const { products } = event.data;

    // Process in batches or one by one
    const results = await step.run('process-products', async () => {
      const processed = [];
      for (const product of products) {
        // Run AI Analysis for each
        const result = await analyzeProductAction(product);
        processed.push(result);
      }
      return processed;
    });

    return { message: `Processed ${products.length} products`, results };
  }
);
