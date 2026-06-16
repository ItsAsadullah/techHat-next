'use client';

import { useFormContext } from 'react-hook-form';
import { ProductFormValues } from '../schemas/product.schema';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import RichTextEditor from '@/components/ui/rich-text-editor';
import { Video } from 'lucide-react';

export function ProductDescriptionSection() {
  const { register, watch, setValue } = useFormContext<ProductFormValues>();
  const description = watch('description');

  return (
    <div className="space-y-5">

      {/* Short Description — Marketing copy / SEO summary */}
      <div className="space-y-1.5">
        <Label htmlFor="shortDesc" className="text-sm font-medium">
          Short Description
          <span className="ml-1.5 text-[10px] text-muted-foreground font-normal">(used in product cards & SEO)</span>
        </Label>
        <Textarea
          id="shortDesc"
          placeholder="Brief summary for product listings, search results, and social sharing..."
          className="resize-none h-[70px] text-sm"
          {...register('shortDesc')}
        />
      </div>

      {/* Full Description — Rich text marketing body */}
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">
          Full Description
          <span className="ml-1.5 text-[10px] text-muted-foreground font-normal">(marketing copy, product page body)</span>
        </Label>
        <div className="min-h-[180px] max-h-[350px]">
          <RichTextEditor
            value={description || ''}
            onChange={(content) => setValue('description', content)}
          />
        </div>
      </div>

      {/* Video URL — belongs with content, not sidebar */}
      <div className="space-y-1.5 border-t pt-4">
        <Label htmlFor="videoUrl" className="text-sm font-medium flex items-center gap-1.5">
          <Video className="h-3.5 w-3.5 text-muted-foreground" />
          Product Video URL
        </Label>
        <Input
          id="videoUrl"
          placeholder="https://youtube.com/watch?v=..."
          className="h-9 text-sm"
          {...register('videoUrl')}
        />
        <p className="text-[11px] text-muted-foreground">
          YouTube, Vimeo, or any embed-compatible URL
        </p>
      </div>

    </div>
  );
}
