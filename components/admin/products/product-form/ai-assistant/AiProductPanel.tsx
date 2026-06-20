'use client';

import { useState, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sparkles, Loader2, Link as LinkIcon, Plus, Trash2 } from 'lucide-react';
import { analyzeProductAction } from '@/lib/actions/ai-assistant-actions';
import { getAvailableAiModels } from '@/lib/actions/setting-actions';
import { toast } from 'sonner';
import { AiReviewBoard } from './AiReviewBoard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function AiProductPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [officialUrl, setOfficialUrl] = useState('');
  const [competitorUrls, setCompetitorUrls] = useState<string[]>(['']);
  const [aiResult, setAiResult] = useState<any>(null);
  const [modelId, setModelId] = useState('google:gemini-flash-latest');
  const [availableModels, setAvailableModels] = useState<{value: string, label: string}[]>([]);

  const { getValues } = useFormContext();

  useEffect(() => {
    async function fetchModels() {
      const models = await getAvailableAiModels();
      setAvailableModels(models);
      if (models.length > 0) {
        setModelId(models[0].value);
      }
    }
    fetchModels();
  }, []);

  const handleAnalyze = async () => {
    const productName = getValues('name');
    if (!productName) {
      toast.error('Please enter a product name first.');
      return;
    }

    setLoading(true);
    setAiResult(null);

    // Filter empty URLs
    const validCompetitors = competitorUrls.filter(u => u.trim() !== '');

    // Collect all unique image URLs from gallery and variants
    const currentImages = getValues('images') || [];
    const currentVariants = getValues('variants') || [];
    const allImageUrls = new Set<string>();
    
    currentImages.forEach((img: any) => {
      if (img.url) allImageUrls.add(img.url);
    });
    currentVariants.forEach((v: any) => {
      if (v.image) allImageUrls.add(v.image);
    });

    const res = await analyzeProductAction({
      productName,
      officialUrl: officialUrl.trim() || undefined,
      competitorUrls: validCompetitors,
      imageUrls: Array.from(allImageUrls), 
      modelId,
    });

    if (res.success) {
      toast.success('AI Analysis Complete');
      setAiResult(res.data);
    } else {
      toast.error(res.error || 'Analysis failed');
    }

    setLoading(false);
  };

  const addCompetitor = () => {
    if (competitorUrls.length >= 3) {
      toast.error('Maximum 3 competitor URLs allowed');
      return;
    }
    setCompetitorUrls([...competitorUrls, '']);
  };

  const updateCompetitor = (index: number, val: string) => {
    const newUrls = [...competitorUrls];
    newUrls[index] = val;
    setCompetitorUrls(newUrls);
  };

  const removeCompetitor = (index: number) => {
    const newUrls = [...competitorUrls];
    newUrls.splice(index, 1);
    setCompetitorUrls(newUrls);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="secondary" size="sm" className="h-8 gap-1.5 bg-indigo-500/10 text-indigo-600 hover:bg-indigo-500/20 dark:bg-indigo-500/20 dark:text-indigo-400">
          <Sparkles className="h-3.5 w-3.5" />
          AI Assistant
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px] sm:max-w-none overflow-y-auto z-[100]">
        <SheetHeader className="mb-6">
          <SheetTitle className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
            <Sparkles className="h-5 w-5" />
            AI Product Intelligence
          </SheetTitle>
        </SheetHeader>

        {!aiResult ? (
          <div className="space-y-6">
            <div className="space-y-1.5 text-sm">
              <p className="text-muted-foreground">
                Our AI will scrape the provided URLs, analyze existing uploaded images, and automatically generate your product description, specifications, SEO, and variants.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>AI Model</Label>
                <Select value={modelId} onValueChange={setModelId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select AI Model" />
                  </SelectTrigger>
                  <SelectContent className="z-[105]">
                    {availableModels.length > 0 ? (
                      availableModels.map((m) => (
                        <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                      ))
                    ) : (
                      <SelectItem value="google:gemini-flash-latest">Gemini Flash Latest</SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground">Make sure the respective API key is configured in Admin Settings.</p>
              </div>

              <div className="space-y-2 pt-2">
                <Label>Official Manufacturer URL (Optional)</Label>
                <div className="relative">
                  <LinkIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="https://samsung.com/..." 
                    className="pl-9"
                    value={officialUrl}
                    onChange={(e) => setOfficialUrl(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <Label>Competitor URLs</Label>
                  <Button variant="ghost" size="sm" onClick={addCompetitor} className="h-7 px-2 text-xs">
                    <Plus className="h-3.5 w-3.5 mr-1" /> Add
                  </Button>
                </div>
                {competitorUrls.map((url, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <LinkIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input 
                        placeholder={`Competitor URL ${i + 1}`} 
                        className="pl-9"
                        value={url}
                        onChange={(e) => updateCompetitor(i, e.target.value)}
                      />
                    </div>
                    {competitorUrls.length > 1 && (
                      <Button variant="ghost" size="icon" onClick={() => removeCompetitor(i)} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-6 border-t">
              <Button onClick={handleAnalyze} disabled={loading} className="w-full gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {loading ? 'Analyzing Product Data...' : 'Analyze Product'}
              </Button>
              {loading && (
                <p className="text-xs text-center text-muted-foreground mt-3 animate-pulse">
                  Fetching sources and generating content. This may take 15-30 seconds...
                </p>
              )}
            </div>
          </div>
        ) : (
          <AiReviewBoard 
            data={aiResult} 
            onClose={() => setIsOpen(false)} 
            onRegenerate={() => setAiResult(null)} 
          />
        )}
      </SheetContent>
    </Sheet>
  );
}
