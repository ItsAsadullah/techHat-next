'use client';

import { useFormContext } from 'react-hook-form';
import { ProductFormValues } from '../schemas/product.schema';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, Tag } from 'lucide-react';
import { useState, useCallback, KeyboardEvent } from 'react';

export function ProductTagsInput() {
  const { watch, setValue } = useFormContext<ProductFormValues>();
  const tags = watch('tags') || [];
  const [inputValue, setInputValue] = useState('');

  const addTag = useCallback((value: string) => {
    const tag = value.trim().toLowerCase().replace(/\s+/g, '-');
    if (tag && !tags.includes(tag)) {
      setValue('tags', [...tags, tag], { shouldDirty: true });
    }
    setInputValue('');
  }, [tags, setValue]);

  const removeTag = useCallback((tag: string) => {
    setValue('tags', tags.filter(t => t !== tag), { shouldDirty: true });
  }, [tags, setValue]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  };

  return (
    <div className="space-y-2">
      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
        <Tag className="h-3 w-3" /> Tags
      </Label>

      {/* Tag chips + input */}
      <div className="flex flex-wrap gap-1.5 p-2 min-h-[40px] border rounded-md bg-background focus-within:ring-1 focus-within:ring-ring">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs font-medium"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="hover:text-red-500 transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => inputValue && addTag(inputValue)}
          placeholder={tags.length === 0 ? 'Add tags (press Enter or comma)' : ''}
          className="flex-1 min-w-[120px] text-xs bg-transparent outline-none placeholder:text-muted-foreground"
        />
      </div>
      <p className="text-xs text-muted-foreground">Press Enter or comma to add. Used for search and recommendations.</p>
    </div>
  );
}
