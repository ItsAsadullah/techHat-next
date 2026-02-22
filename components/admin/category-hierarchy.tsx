'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Check, ChevronDown, ChevronRight, Loader2, Plus, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getCategoryChildren, createCategory } from '@/lib/actions/category-actions';

interface Category {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
}

interface CategoryHierarchyProps {
  initialCategories: Category[];
  onCategorySelect: (categoryId: string) => void;
  selectedCategoryId?: string;
}

export default function CategoryHierarchy({ initialCategories, onCategorySelect, selectedCategoryId }: CategoryHierarchyProps) {
  const [levels, setLevels] = useState<{
    categories: Category[];
    selectedId: string | null;
    isLoading: boolean;
    open: boolean;
    searchTerm: string;
  }[]>([
    { categories: initialCategories, selectedId: selectedCategoryId ?? null, isLoading: false, open: false, searchTerm: '' }
  ]);

  const [isCreating, setIsCreating] = useState(false);
  const searchInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    setLevels([
      { categories: initialCategories, selectedId: selectedCategoryId ?? null, isLoading: false, open: false, searchTerm: '' }
    ]);
  }, [initialCategories, selectedCategoryId]);

  const handleSelect = async (levelIndex: number, categoryId: string) => {
    const newLevels = levels.slice(0, levelIndex + 1).map(l => ({ ...l }));

    newLevels[levelIndex].selectedId = categoryId;
    newLevels[levelIndex].open = false;
    newLevels[levelIndex].searchTerm = '';

    onCategorySelect(categoryId);

    newLevels[levelIndex].isLoading = true;
    setLevels(newLevels);

    try {
      const result = await getCategoryChildren(categoryId);

      const levelsAfterFetch = newLevels.map(l => ({ ...l }));
      levelsAfterFetch[levelIndex].isLoading = false;

      // Always add next level so user can select existing sub-categories
      // or create new ones by typing in the search box
      const childCategories = (result.success && result.categories) ? result.categories : [];
      levelsAfterFetch.push({
        categories: childCategories,
        selectedId: null,
        isLoading: false,
        open: false,
        searchTerm: '',
      });

      setLevels(levelsAfterFetch);
    } catch (error) {
      console.error('Failed to load subcategories', error);
      const levelsError = newLevels.map(l => ({ ...l }));
      levelsError[levelIndex].isLoading = false;
      // Still add empty level so user can create sub-categories
      levelsError.push({
        categories: [],
        selectedId: null,
        isLoading: false,
        open: false,
        searchTerm: '',
      });
      setLevels(levelsError);
    }
  };

  const handleCreate = async (levelIndex: number, name: string) => {
    if (!name.trim()) return;

    setIsCreating(true);
    const parentId = levelIndex === 0 ? null : levels[levelIndex - 1].selectedId;

    try {
      const formData = new FormData();
      formData.append('name', name.trim());
      if (parentId) formData.append('parentId', parentId);

      const result = await createCategory(formData);

      if (result.success && result.data) {
        const createdCategory = result.data as Category;
        const newLevels = levels.slice(0, levelIndex + 1).map(l => ({ ...l }));

        const currentLevel = newLevels[levelIndex];
        currentLevel.categories = [...currentLevel.categories, createdCategory].sort((a, b) =>
          a.name.localeCompare(b.name)
        );
        currentLevel.selectedId = createdCategory.id;
        currentLevel.open = false;
        currentLevel.searchTerm = '';

        onCategorySelect(createdCategory.id);
        setLevels(newLevels);
      } else {
        console.error('Failed to create category');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsCreating(false);
    }
  };

  const getFilteredCategories = (level: typeof levels[0]) => {
    if (!level.searchTerm.trim()) return level.categories;
    const q = level.searchTerm.toLowerCase();
    return level.categories.filter((c) => c.name.toLowerCase().includes(q));
  };

  return (
    <div className="space-y-3">
      {levels.map((level, index) => {
        const filtered = getFilteredCategories(level);
        const hasExactMatch = level.categories.some(
          (c) => c.name.toLowerCase() === level.searchTerm.trim().toLowerCase()
        );

        return (
          <div key={index} className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-300">
            {index > 0 && <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />}

            <div className="flex-1 w-full">
              <Popover
                open={level.open}
                onOpenChange={(open) => {
                  const newLevels = levels.map((l, i) =>
                    i === index ? { ...l, open, searchTerm: open ? l.searchTerm : '' } : l
                  );
                  setLevels(newLevels);
                  if (open) {
                    setTimeout(() => searchInputRefs.current[index]?.focus(), 50);
                  }
                }}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    type="button"
                    aria-expanded={level.open}
                    className="w-full justify-between h-11 bg-gray-50/50 border-gray-200 hover:bg-white hover:text-gray-900 font-normal text-left"
                    disabled={level.isLoading}
                  >
                    <span className={cn('truncate', !level.selectedId && 'text-muted-foreground')}>
                      {level.selectedId
                        ? level.categories.find((c) => c.id === level.selectedId)?.name
                        : index === 0
                        ? 'Select Main Category'
                        : 'Select Sub Category'}
                    </span>
                    {level.isLoading ? (
                      <Loader2 className="ml-2 h-4 w-4 shrink-0 opacity-50 animate-spin" />
                    ) : (
                      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-[var(--radix-popover-trigger-width)] p-0 bg-white border border-gray-200 shadow-lg rounded-lg overflow-hidden"
                  align="start"
                  sideOffset={4}
                >
                  <div className="flex flex-col bg-white">
                    {/* Search Input */}
                    <div className="flex items-center gap-2 border-b px-3 py-2">
                      <Search className="h-4 w-4 shrink-0 text-gray-400" />
                      <input
                        ref={(el) => { searchInputRefs.current[index] = el; }}
                        type="text"
                        placeholder="Search category..."
                        value={level.searchTerm}
                        onChange={(e) => {
                          const newLevels = levels.map((l, i) =>
                            i === index ? { ...l, searchTerm: e.target.value } : l
                          );
                          setLevels(newLevels);
                        }}
                        className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400"
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') {
                            const newLevels = levels.map((l, i) =>
                              i === index ? { ...l, open: false, searchTerm: '' } : l
                            );
                            setLevels(newLevels);
                          }
                        }}
                      />
                      {level.searchTerm && (
                        <button
                          type="button"
                          onClick={() => {
                            const newLevels = levels.map((l, i) =>
                              i === index ? { ...l, searchTerm: '' } : l
                            );
                            setLevels(newLevels);
                          }}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Category List */}
                    <div className="max-h-[250px] overflow-y-auto p-1">
                      {filtered.length > 0 ? (
                        filtered.map((category) => {
                          const isSelected = level.selectedId === category.id;
                          return (
                            <button
                              key={category.id}
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleSelect(index, category.id);
                              }}
                              className={cn(
                                'w-full flex items-center gap-2 rounded-md px-2 py-2 text-sm transition-colors text-left',
                                isSelected
                                  ? 'bg-blue-50 text-blue-700 font-medium'
                                  : 'hover:bg-gray-100 text-gray-700'
                              )}
                            >
                              <Check
                                className={cn(
                                  'h-4 w-4 shrink-0',
                                  isSelected ? 'text-blue-600' : 'invisible'
                                )}
                              />
                              <span className="truncate">{category.name}</span>
                            </button>
                          );
                        })
                      ) : (
                        <div className="py-4 text-center">
                          <p className="text-sm text-gray-500">
                            {level.searchTerm.trim()
                              ? `"${level.searchTerm}" not found`
                              : 'No sub-categories yet. Type to create one.'}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Create new category — show when typing a name that doesn't exist */}
                    {level.searchTerm.trim() && !hasExactMatch && (
                      <div className="border-t p-2">
                        <button
                          type="button"
                          onClick={() => handleCreate(index, level.searchTerm)}
                          disabled={isCreating}
                          className="w-full flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-green-700 hover:bg-green-50 transition-colors disabled:opacity-50"
                        >
                          <Plus className="h-4 w-4" />
                          {isCreating ? 'Creating...' : `Create "${level.searchTerm}"`}
                        </button>
                      </div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        );
      })}
    </div>
  );
}
