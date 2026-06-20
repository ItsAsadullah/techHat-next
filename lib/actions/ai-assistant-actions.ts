'use server';

import { prisma } from '@/lib/prisma';
import { gatherProductContext } from '../ai/scraper-service';
import { analyzeProductImages } from '../ai/vision-service';
import { generateProductData } from '../ai/intelligence-engine';
import { revalidatePath } from 'next/cache';

export async function analyzeProductAction(formData: {
  productName: string;
  officialUrl?: string;
  competitorUrls?: string[];
  imageUrls?: string[];
  modelId?: string;
}) {
  try {
    // 1. Gather Context (Scraping)
    const scrapedContext = await gatherProductContext(
      formData.productName,
      formData.officialUrl,
      formData.competitorUrls || []
    );

    // 2. Vision Analysis
    const visionContext = await analyzeProductImages(formData.imageUrls || [], formData.modelId);

    // 3. Generate AI Data
    const aiData = await generateProductData(scrapedContext, visionContext, formData.imageUrls || [], formData.modelId);

    // 4. Save Draft to Database
    const draft = await prisma.aiGenerationDraft.create({
      data: {
        productName: formData.productName,
        sourceUrls: [formData.officialUrl, ...(formData.competitorUrls || [])].filter(Boolean) as string[],
        imageUrls: formData.imageUrls || [],
        description: aiData.description as any,
        shortDesc: aiData.description.short as any,
        specifications: aiData.specifications as any,
        attributes: aiData.attributes as any,
        variants: aiData.variants as any,
        tags: aiData.tags as any,
        seoData: aiData.seo as any,
        faqs: aiData.faqs as any,
        highlights: aiData.highlights as any,
        status: 'PENDING',
      },
    });

    revalidatePath('/admin/products/new');
    return { success: true, draftId: draft.id, data: aiData };
  } catch (error: any) {
    console.error('Analyze Product Error:', error);
    return { success: false, error: error.message || 'Failed to analyze product' };
  }
}

export async function logAiLearningAction(logData: {
  field: string;
  suggestedValue: string;
  acceptedValue: string;
  action: 'ACCEPTED_AS_IS' | 'EDITED' | 'REJECTED';
}) {
  try {
    await prisma.aiLearningLog.create({
      data: logData,
    });
    return { success: true };
  } catch (error) {
    console.error('Failed to log AI learning:', error);
    return { success: false };
  }
}
