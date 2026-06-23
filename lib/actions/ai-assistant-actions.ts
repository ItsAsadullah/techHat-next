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
  analysisType?: '1-step' | '3-step';
  categoryId?: string;
}) {
  try {
    // 1. Gather Context (Scraping)
    const scrapedContext = await gatherProductContext(
      formData.productName,
      formData.officialUrl,
      formData.competitorUrls || []
    );

    // 1.5 Fetch Category Hint
    let categoryHint = '';
    if (formData.categoryId) {
      const cat = await prisma.category.findUnique({
        where: { id: formData.categoryId },
        include: { parent: { include: { parent: true } } }
      });
      if (cat) {
        const parts = [cat.name];
        if (cat.parent) {
          parts.unshift(cat.parent.name);
          if (cat.parent.parent) {
            parts.unshift(cat.parent.parent.name);
          }
        }
        categoryHint = `\n[CRITICAL HINT] The user has explicitly classified this product in the following category: ${parts.join(' > ')}. Your generated content MUST align with this category. Do not hallucinate it as a different type of product.`;
      }
    }

    // 2. Vision Analysis
    const visionContext = await analyzeProductImages(formData.imageUrls || [], formData.modelId);

    // 3. Generate AI Data
    const aiData = await generateProductData(
      scrapedContext + categoryHint, 
      visionContext, 
      formData.imageUrls || [], 
      formData.modelId,
      formData.analysisType || '3-step'
    );

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
