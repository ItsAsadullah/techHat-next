import { generateObject } from 'ai';
import { z } from 'zod';
import { PRODUCT_GENERATION_SYSTEM_PROMPT } from './prompts';
import { getAiModel } from './provider';

export const aiProductSchema = z.object({
  description: z.object({
    long: z.string().describe('Long, professional description in HTML format'),
    short: z.string().describe('Short 50-150 word summary description'),
    confidence: z.number().describe('Confidence score between 0 and 1'),
    sources: z.array(z.string()).describe('URLs or sources used to generate this description'),
  }),
  specifications: z.array(
    z.object({
      key: z.string().describe('e.g., RAM, Processor, Display'),
      value: z.string().describe('e.g., 8GB, Snapdragon 8 Gen 2, 6.8" AMOLED'),
      conflictDetected: z.boolean().describe('True if different sources gave different values'),
      sources: z.array(z.string()),
    })
  ),
  attributes: z.array(
    z.object({
      name: z.string(),
      value: z.string(),
    })
  ),
  variants: z.array(
    z.object({
      name: z.string(),
      attributes: z.array(z.object({
        name: z.string().describe('The name of the attribute, e.g. Color, Storage'),
        value: z.string().describe('The value of the attribute, e.g. Black, 128GB')
      })).describe('Array of variant attributes'),
    })
  ),
  tags: z.array(z.string()),
  seo: z.object({
    productName: z.string().describe('Highly SEO optimized, full length product name'),
    title: z.string().describe('SEO Title for meta tag'),
    description: z.string().describe('Meta description'),
    keywords: z.array(z.string()).describe('At least 10-15 keywords and tags'),
    slug: z.string().describe('URL friendly slug'),
  }),
  faqs: z.array(
    z.object({
      question: z.string(),
      answer: z.string(),
    })
  ),
  highlights: z.array(z.string()).describe('Top 5 selling points or features'),
  imageAlts: z.array(
    z.object({
      url: z.string().describe('The original image URL if provided'),
      altText: z.string().describe('Highly descriptive SEO alt text for the image'),
    })
  ).describe('Alt texts for any images analyzed or inferred'),
});

export type AiProductGenerationResult = z.infer<typeof aiProductSchema>;

export async function generateProductData(
  scrapedContext: string,
  imageAnalysisContext: string,
  imageUrls: string[] = [],
  modelId: string = 'google:gemini-flash-latest'
) {
  try {
    const aiModel = await getAiModel(modelId);

    const { object } = await generateObject({
      model: aiModel,
      system: PRODUCT_GENERATION_SYSTEM_PROMPT,
      prompt: `
        Input Context (Scraped Data):
        ${scrapedContext}
        
        Images Content / Analysis:
        ${imageAnalysisContext}

        For your reference, here are the exact URLs of the images that were analyzed. You must use these EXACT URLs in the imageAlts output:
        ${imageUrls.map((url, i) => `Image ${i + 1}: ${url}`).join('\n')}
      `,
      schema: aiProductSchema,
    });

    return object;
  } catch (error: any) {
    console.error('Error generating product data:', error);
    throw new Error(`Failed to generate AI product data: ${error.message || 'Unknown error'}`);
  }
}
