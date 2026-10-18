import { generateObject } from 'ai';
import { z } from 'zod';
import { PRODUCT_GENERATION_SYSTEM_PROMPT, DATA_EXTRACTION_PROMPT, SEO_CONTENT_PROMPT, ENRICHMENT_PROMPT } from './prompts';
import { getAiModel, getModelInfo, getFallbackModels } from './provider';

export const aiProductSchema = z.object({
  description: z.object({
    long: z.string().describe('Long, professional description in HTML format'),
    short: z.string().describe('Short 50-150 word summary description'),
    confidence: z.number().describe('Confidence score between 0 and 1'),
    sources: z.array(z.string()).describe('URLs or sources used to generate this description'),
  }),
  specifications: z.array(
    z.object({
      key: z.string().describe('Specification name e.g., RAM, Voltage, Power, Display, Connectivity'),
      value: z.string().describe('Concrete, non-empty value e.g., 65W, 19V 3.42A, 16GB. MUST NOT BE NULL OR EMPTY.'),
      conflictDetected: z.boolean().describe('True if conflicting data detected'),
      sources: z.array(z.string()).nullable().describe('Sources or null'),
    })
  ).describe('Technical specifications. Every row MUST have a valid non-empty value. Do not output rows with null or empty values.'),
  attributes: z.array(
    z.object({
      name: z.string().describe('Attribute name, e.g. Color, Material, Interface'),
      value: z.string().describe('Concrete, non-empty attribute value. MUST NOT BE NULL OR EMPTY.'),
    })
  ).describe('Product attributes. Every item MUST have a non-empty value.'),
  variants: z.array(
    z.object({
      name: z.string(),
      attributes: z.array(z.object({
        name: z.string().describe('The name of the attribute, e.g. Color, Storage'),
        value: z.string().nullable().describe('The value of the attribute, e.g. Black, 128GB')
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

const step1Schema = z.object({
  brand: z.string().nullable().describe('Leave null if not found'),
  model: z.string().nullable().describe('Leave null if not found'),
  series: z.string().nullable().describe('Leave null if not found'),
  sku: z.string().nullable().describe('Leave null if not found'),
  gtin: z.string().nullable().describe('Leave null if not found'),
  mpn: z.string().nullable().describe('Leave null if not found'),
  productType: z.string().nullable().describe('Leave null if not found'),
  specifications: aiProductSchema.shape.specifications,
  variants: aiProductSchema.shape.variants,
});

const step2Schema = z.object({
  seo: aiProductSchema.shape.seo,
  description: aiProductSchema.shape.description,
  faqs: aiProductSchema.shape.faqs,
  highlights: aiProductSchema.shape.highlights,
  tags: aiProductSchema.shape.tags,
});

const step3Schema = z.object({
  categoryStructure: z.object({
    main: z.string().describe("Main category"),
    sub: z.string().describe("Sub category or empty string"),
    child: z.string().describe("Child category or empty string")
  }).nullable(),
  attributes: aiProductSchema.shape.attributes,
  relatedEntities: z.object({
    brand: z.string().nullable(),
    series: z.string().nullable(),
    technology: z.array(z.string()).nullable(),
    useCases: z.array(z.string()).nullable()
  }).nullable(),
  relatedProducts: z.object({
    relatedProducts: z.array(z.string()),
    crossSellProducts: z.array(z.string()),
    upSellProducts: z.array(z.string())
  }).nullable(),
  imageAlts: aiProductSchema.shape.imageAlts,
  schemaOrg: z.object({
    name: z.string(),
    brand: z.string().nullable(),
    description: z.string(),
    sku: z.string().nullable(),
    gtin: z.string().nullable(),
    category: z.string().nullable(),
    image: z.string().nullable(),
    offers: z.object({
      price: z.number().nullable(),
      priceCurrency: z.string().nullable(),
      availability: z.string().nullable()
    }).nullable()
  }).nullable(),
  openGraph: z.object({
    title: z.string(),
    description: z.string(),
    imageAlt: z.string().nullable()
  }).nullable(),
  twitterCard: z.object({
    title: z.string(),
    description: z.string()
  }).nullable(),
  merchantFeed: z.object({
    title: z.string(),
    description: z.string(),
    brand: z.string().nullable(),
    condition: z.string().nullable(),
    productType: z.string().nullable(),
    googleProductCategory: z.string().nullable()
  }).nullable(),
});

export async function generateProductData(
  scrapedContext: string,
  imageAnalysisContext: string,
  imageUrls: string[] = [],
  modelId: string = 'groq-gpt-oss-120b',
  analysisType: '1-step' | '3-step' = '1-step'
) {
  const runWithModel = async (targetModelId: string, mode: '1-step' | '3-step') => {
    const aiModel = await getAiModel(targetModelId);

    if (mode === '1-step') {
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
    } else {
      // 3-Step Deep Analysis
      
      // Step 1: Extraction
      const step1 = await generateObject({
        model: aiModel,
        system: DATA_EXTRACTION_PROMPT,
        prompt: `
          Input Context (Scraped Data):
          ${scrapedContext}
          
          Images Content / Analysis:
          ${imageAnalysisContext}
        `,
        schema: step1Schema,
      });

      // Step 2: SEO Content
      const step2 = await generateObject({
        model: aiModel,
        system: SEO_CONTENT_PROMPT,
        prompt: `
          Extracted Product Data:
          ${JSON.stringify(step1.object, null, 2)}
        `,
        schema: step2Schema,
      });

      // Step 3: Enrichment
      const step3 = await generateObject({
        model: aiModel,
        system: ENRICHMENT_PROMPT,
        prompt: `
          Extracted Data:
          ${JSON.stringify(step1.object, null, 2)}
          
          SEO Content:
          ${JSON.stringify(step2.object, null, 2)}
          
          For your reference, here are the exact URLs of the images that were analyzed. You must use these EXACT URLs in the imageAlts output:
          ${imageUrls.map((url, i) => `Image ${i + 1}: ${url}`).join('\n')}
        `,
        schema: step3Schema,
      });

      // Merge and return
      return {
        ...step1.object,
        ...step2.object,
        ...step3.object,
      };
    }
  };

  // 1. Primary Attempt
  try {
    const data = await runWithModel(modelId, analysisType);
    const info = await getModelInfo(modelId);
    return {
      ...data,
      _meta: {
        modelUsed: info.name,
        fallbackUsed: false,
      }
    };
  } catch (primaryError: any) {
    console.warn(`Primary AI model [${modelId}] failed (${primaryError.message}). Evaluating recovery...`);

    // If 3-step failed on primary, try 1-step on primary first
    if (analysisType === '3-step') {
      try {
        console.log(`Retrying primary model [${modelId}] with 1-step mode...`);
        const data = await runWithModel(modelId, '1-step');
        const info = await getModelInfo(modelId);
        return {
          ...data,
          _meta: {
            modelUsed: `${info.name} (1-Step Recovery)`,
            fallbackUsed: false,
          }
        };
      } catch (err: any) {
        console.warn(`Primary model 1-step recovery also failed:`, err.message);
      }
    }

    // 2. Automated Multi-Model Failover
    console.log(`Engaging automated AI failover pool...`);
    const fallbackCandidates = await getFallbackModels(modelId);

    let lastError = primaryError;
    for (const candidate of fallbackCandidates) {
      try {
        console.log(`Attempting fallback model: [${candidate.displayName}] (${candidate.modelName})...`);
        const data = await runWithModel(candidate.id, '1-step');
        console.log(`Fallback model [${candidate.displayName}] succeeded!`);
        return {
          ...data,
          _meta: {
            modelUsed: candidate.displayName,
            fallbackUsed: true,
            fallbackReason: primaryError.message,
          }
        };
      } catch (candidateErr: any) {
        console.warn(`Fallback candidate [${candidate.displayName}] failed:`, candidateErr.message);
        lastError = candidateErr;
      }
    }

    throw new Error(`All available AI models failed. Primary model error: ${primaryError.message}. Last fallback error: ${lastError.message}`);
  }
}
