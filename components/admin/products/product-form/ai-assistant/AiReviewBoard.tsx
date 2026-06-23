'use client';

import { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { RefreshCcw, Check, AlertTriangle, ArrowRight } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';

interface AiReviewBoardProps {
  data: any;
  onClose: () => void;
  onRegenerate: () => void;
}

export function AiReviewBoard({ data, onClose, onRegenerate }: AiReviewBoardProps) {
  const { setValue, getValues } = useFormContext();
  const [selectedFields, setSelectedFields] = useState<Record<string, boolean>>({
    productName: true,
    shortDesc: true,
    longDesc: true,
    seo: true,
    specs: true,
    tags: true,
    faqs: true,
    imageAlts: true,
    advancedSeo: true,
    enrichmentData: true,
  });

  const toggleField = (field: string) => {
    setSelectedFields(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleAccept = () => {
    try {
      if (selectedFields.productName && data.seo?.productName) {
        setValue('name', data.seo.productName, { shouldDirty: true });
      }
      if (selectedFields.shortDesc && data.description?.short) {
        setValue('shortDesc', data.description.short, { shouldDirty: true });
      }
      if (selectedFields.longDesc && data.description?.long) {
        setValue('description', data.description.long, { shouldDirty: true });
      }
      if (selectedFields.seo && data.seo) {
        setValue('seoTitle', data.seo.title, { shouldDirty: true });
        setValue('metaDescription', data.seo.description, { shouldDirty: true });
        setValue('slug', data.seo.slug, { shouldDirty: true });
      }
      if (selectedFields.tags) {
        const allTags = [...(data.tags || []), ...(data.seo?.keywords || [])];
        const uniqueTags = Array.from(new Set(allTags));
        if (uniqueTags.length > 0) {
          setValue('tags', uniqueTags, { shouldDirty: true });
        }
      }
      if (selectedFields.specs && data.specifications) {
        const existingSpecs = getValues('productSpecs') || [];
        const newSpecs = data.specifications.map((s: any) => ({ key: s.key, value: s.value }));
        setValue('productSpecs', [...existingSpecs, ...newSpecs], { shouldDirty: true });
      }
      if (selectedFields.faqs && data.faqs) {
        const existingFaqs = (getValues('faqs') || []).filter((f: any) => f.question?.trim() || f.answer?.trim());
        const newFaqs = data.faqs.map((f: any) => ({ question: f.question, answer: f.answer }));
        setValue('faqs', [...existingFaqs, ...newFaqs], { shouldDirty: true });
      }

      if (selectedFields.advancedSeo && (data.schemaOrg || data.openGraph || data.twitterCard || data.merchantFeed)) {
        setValue('advancedSeo', {
          schemaOrg: data.schemaOrg,
          openGraph: data.openGraph,
          twitterCard: data.twitterCard,
          merchantFeed: data.merchantFeed
        }, { shouldDirty: true });
      }

      if (selectedFields.enrichmentData && (data.categoryStructure || data.relatedEntities || data.relatedProducts)) {
        setValue('enrichmentData', {
          categoryStructure: data.categoryStructure,
          relatedEntities: data.relatedEntities,
          relatedProducts: data.relatedProducts
        }, { shouldDirty: true });
      }
      
      if (selectedFields.imageAlts && data.imageAlts && data.imageAlts.length > 0) {
        const currentImages = getValues('images') || [];
        let imagesUpdated = false;
        const newImages = currentImages.map((img: any) => {
          // Robust match just in case AI modifies the URL slightly
          const aiAlt = data.imageAlts.find((a: any) => img.url && a.url && (img.url.includes(a.url) || a.url.includes(img.url)));
          if (aiAlt) {
            imagesUpdated = true;
            return { ...img, alt: aiAlt.altText };
          }
          return img;
        });
        if (imagesUpdated) setValue('images', newImages, { shouldDirty: true });

        const currentVariants = getValues('variants') || [];
        let variantsUpdated = false;
        const newVariants = currentVariants.map((v: any) => {
          if (v.image) {
            const aiAlt = data.imageAlts.find((a: any) => v.image && a.url && (v.image.includes(a.url) || a.url.includes(v.image)));
            if (aiAlt) {
              variantsUpdated = true;
              return { ...v, imageAlt: aiAlt.altText };
            }
          }
          return v;
        });
        if (variantsUpdated) setValue('variants', newVariants, { shouldDirty: true });
      }

      toast.success('AI content applied to form');
      onClose();
    } catch (error) {
      toast.error('Failed to apply content');
    }
  };

  return (
    <div className="flex flex-col h-full space-y-4 pb-12">
      <div className="flex items-center justify-between border-b pb-3">
        <h3 className="font-semibold text-lg flex items-center gap-2">
          Review Generated Content
        </h3>
        <Button variant="ghost" size="sm" onClick={onRegenerate} className="text-muted-foreground">
          <RefreshCcw className="h-4 w-4 mr-2" />
          Regenerate
        </Button>
      </div>

      <ScrollArea className="flex-1 -mx-4 px-4">
        <div className="space-y-6">
          
          {/* SEO & Meta */}
          {data.seo && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Checkbox 
                  id="chk-seo" 
                  checked={selectedFields.seo} 
                  onCheckedChange={() => toggleField('seo')} 
                />
                <label htmlFor="chk-seo" className="font-medium">SEO & Optimized Name</label>
              </div>
              <div className="pl-7 space-y-2 text-sm border-l-2 border-muted ml-2 pb-2">
                {data.seo.productName && (
                  <div>
                    <span className="text-xs text-muted-foreground uppercase">Optimized Name</span>
                    <p className="font-medium text-indigo-600 dark:text-indigo-400">{data.seo.productName}</p>
                  </div>
                )}
                <div>
                  <span className="text-xs text-muted-foreground uppercase">SEO Title</span>
                  <p className="font-medium">{data.seo.title}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground uppercase">Description</span>
                  <p className="text-muted-foreground">{data.seo.description}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground uppercase">URL Slug</span>
                  <p className="text-muted-foreground font-mono">{data.seo.slug}</p>
                </div>
              </div>
            </div>
          )}

          {/* Short Description */}
          {data.description?.short && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Checkbox 
                  id="chk-short" 
                  checked={selectedFields.shortDesc} 
                  onCheckedChange={() => toggleField('shortDesc')} 
                />
                <label htmlFor="chk-short" className="font-medium">Short Description</label>
                <Badge variant={data.description.confidence > 0.8 ? 'default' : 'secondary'} className="ml-auto">
                  {(data.description.confidence * 100).toFixed(0)}% Match
                </Badge>
              </div>
              <div className="pl-7 text-sm text-muted-foreground border-l-2 border-muted ml-2 pb-2">
                {data.description.short}
              </div>
            </div>
          )}

          {/* Long Description */}
          {data.description?.long && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Checkbox 
                  id="chk-long" 
                  checked={selectedFields.longDesc} 
                  onCheckedChange={() => toggleField('longDesc')} 
                />
                <label htmlFor="chk-long" className="font-medium">Full Description (HTML)</label>
              </div>
              <div className="pl-7 text-sm text-muted-foreground border-l-2 border-muted ml-2 pb-2 max-h-60 overflow-y-auto">
                <div className="prose prose-sm dark:prose-invert" dangerouslySetInnerHTML={{ __html: data.description.long }} />
              </div>
            </div>
          )}

          {/* Specifications */}
          {data.specifications && data.specifications.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Checkbox 
                  id="chk-specs" 
                  checked={selectedFields.specs} 
                  onCheckedChange={() => toggleField('specs')} 
                />
                <label htmlFor="chk-specs" className="font-medium">Specifications ({data.specifications.length})</label>
              </div>
              <div className="pl-7 space-y-2 border-l-2 border-muted ml-2 pb-2">
                {data.specifications.map((spec: any, i: number) => (
                  <div key={i} className="flex justify-between items-center text-sm bg-muted/30 p-2 rounded">
                    <span className="font-medium">{spec.key}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">{spec.value}</span>
                      {spec.conflictDetected && (
                        <AlertTriangle className="h-4 w-4 text-amber-500" aria-label="Conflict detected in sources" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {(data.tags || data.seo?.keywords) && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Checkbox 
                  id="chk-tags" 
                  checked={selectedFields.tags} 
                  onCheckedChange={() => toggleField('tags')} 
                />
                <label htmlFor="chk-tags" className="font-medium">Tags & Keywords</label>
              </div>
              <div className="pl-7 flex flex-wrap gap-1.5 border-l-2 border-muted ml-2 pb-2">
                {Array.from(new Set([...(data.tags || []), ...(data.seo?.keywords || [])])).map((tag: any, i: number) => (
                  <Badge key={i} variant="outline" className="bg-background">{tag}</Badge>
                ))}
              </div>
            </div>
          )}

          {/* FAQs */}
          {data.faqs && data.faqs.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Checkbox 
                  id="chk-faqs" 
                  checked={selectedFields.faqs} 
                  onCheckedChange={() => toggleField('faqs')} 
                />
                <label htmlFor="chk-faqs" className="font-medium">FAQs ({data.faqs.length})</label>
              </div>
              <div className="pl-7 space-y-2 border-l-2 border-muted ml-2 pb-2">
                {data.faqs.map((faq: any, i: number) => (
                  <div key={i} className="text-sm bg-muted/30 p-2 rounded">
                    <p className="font-medium text-xs mb-1">Q: {faq.question}</p>
                    <p className="text-muted-foreground text-xs">A: {faq.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Image Alts */}
          {data.imageAlts && data.imageAlts.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Checkbox 
                  id="chk-image-alts" 
                  checked={selectedFields.imageAlts} 
                  onCheckedChange={() => toggleField('imageAlts')} 
                />
                <label htmlFor="chk-image-alts" className="font-medium">Image Alt Texts ({data.imageAlts.length})</label>
              </div>
              <div className="pl-7 space-y-2 border-l-2 border-muted ml-2 pb-2">
                {data.imageAlts.map((alt: any, i: number) => (
                  <div key={i} className="text-sm bg-muted/30 p-2 rounded flex gap-3 items-center">
                    {alt.url ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={alt.url} alt="thumbnail" className="w-8 h-8 rounded object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-8 h-8 rounded bg-muted flex-shrink-0" />
                    )}
                    <p className="text-muted-foreground text-xs flex-1">{alt.altText}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Enrichment Data */}
          {(data.categoryStructure || data.relatedEntities) && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Checkbox 
                  id="chk-enrichment" 
                  checked={selectedFields.enrichmentData} 
                  onCheckedChange={() => toggleField('enrichmentData')} 
                />
                <label htmlFor="chk-enrichment" className="font-medium">Enrichment Data (Categories & Entities)</label>
              </div>
              <div className="pl-7 space-y-2 text-sm border-l-2 border-muted ml-2 pb-2">
                {data.categoryStructure && (
                  <div>
                    <span className="text-xs text-muted-foreground uppercase">Suggested Category</span>
                    <p className="font-medium">{data.categoryStructure.main} {data.categoryStructure.sub ? `> ${data.categoryStructure.sub}` : ''}</p>
                  </div>
                )}
                {data.relatedEntities && (
                  <div>
                    <span className="text-xs text-muted-foreground uppercase">Related Entities</span>
                    <p className="text-muted-foreground">{JSON.stringify(data.relatedEntities)}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Advanced SEO Data */}
          {(data.schemaOrg || data.openGraph) && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Checkbox 
                  id="chk-advanced-seo" 
                  checked={selectedFields.advancedSeo} 
                  onCheckedChange={() => toggleField('advancedSeo')} 
                />
                <label htmlFor="chk-advanced-seo" className="font-medium">Advanced SEO (Schema, OG, Twitter)</label>
              </div>
              <div className="pl-7 space-y-2 text-sm border-l-2 border-muted ml-2 pb-2">
                <p className="text-xs text-muted-foreground">AI has generated rich snippets, Schema.org payload, OpenGraph tags, and Merchant feed data.</p>
                {data.schemaOrg && <Badge variant="outline" className="bg-emerald-50 text-emerald-700">Schema.org Ready</Badge>}
                {data.openGraph && <Badge variant="outline" className="bg-blue-50 text-blue-700 ml-2">OpenGraph Ready</Badge>}
                {data.twitterCard && <Badge variant="outline" className="bg-sky-50 text-sky-700 ml-2">Twitter Card Ready</Badge>}
              </div>
            </div>
          )}

        </div>
      </ScrollArea>

      <div className="pt-4 border-t mt-auto flex gap-3 bg-background sticky bottom-0">
        <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
        <Button className="flex-1 gap-2 bg-indigo-600 hover:bg-indigo-700 text-white" onClick={handleAccept}>
          Accept Selected <Check className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
