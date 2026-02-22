'use client';

import * as React from 'react';
import { Check, ChevronDown, ChevronRight, Plus, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { createCategory } from '@/lib/actions/category-actions';

interface Category {
  id: string;
  name: string;
  parentId: string | null;
}

interface CategoryComboboxProps {
  categories: Category[];
  value?: string;
  onValueChange: (value: string) => void;
  onCategoriesUpdate?: (categories: Category[]) => void;
}

export function CategoryCombobox({
  categories: initialCategories,
  value,
  onValueChange,
  onCategoriesUpdate,
}: CategoryComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [categories, setCategories] = React.useState<Category[]>(initialCategories);
  const [isCreating, setIsCreating] = React.useState(false);

  // Sub-category chain: array of selected category IDs forming the hierarchy
  const [categoryChain, setCategoryChain] = React.useState<string[]>([]);
  const [addingSubAt, setAddingSubAt] = React.useState<number | null>(null); // index in chain where we're adding sub
  const [newSubName, setNewSubName] = React.useState('');

  const inputRef = React.useRef<HTMLInputElement>(null);

  // Sync categories from parent
  React.useEffect(() => {
    setCategories(initialCategories);
  }, [initialCategories]);

  // Build the chain when value changes externally
  React.useEffect(() => {
    if (value) {
      const chain: string[] = [];
      let current = categories.find((c) => c.id === value);
      while (current) {
        chain.unshift(current.id);
        current = current.parentId ? categories.find((c) => c.id === current!.parentId) : undefined;
      }
      if (chain.length > 0) {
        setCategoryChain(chain);
      }
    } else {
      setCategoryChain([]);
    }
  }, [value, categories]);

  // Build hierarchical label
  const buildCategoryLabel = (categoryId: string): string => {
    const cat = categories.find((c) => c.id === categoryId);
    if (!cat) return '';
    const parts: string[] = [cat.name];
    let current = cat;
    while (current.parentId) {
      const parent = categories.find((c) => c.id === current.parentId);
      if (!parent) break;
      parts.unshift(parent.name);
      current = parent;
    }
    return parts.join(' › ');
  };

  // Filter: show all categories matching query (search across full label)
  const filteredCategories = React.useMemo(() => {
    if (!searchQuery.trim()) return categories;
    const q = searchQuery.toLowerCase();
    return categories.filter((cat) => {
      const label = buildCategoryLabel(cat.id).toLowerCase();
      return label.includes(q) || cat.name.toLowerCase().includes(q);
    });
  }, [categories, searchQuery]);

  // Check if search query exactly matches any existing category name
  const exactMatch = React.useMemo(() => {
    if (!searchQuery.trim()) return true;
    return categories.some((c) => c.name.toLowerCase() === searchQuery.trim().toLowerCase());
  }, [categories, searchQuery]);

  // Handle creating new category
  const handleCreateCategory = async (name: string, parentId: string | null = null) => {
    if (!name.trim() || isCreating) return;
    setIsCreating(true);
    try {
      const formData = new FormData();
      formData.append('name', name.trim());
      if (parentId) formData.append('parentId', parentId);

      const result = await createCategory(formData);

      if (result.success && result.data) {
        const newCat = result.data as Category;
        const updated = [...categories, newCat];
        setCategories(updated);
        onCategoriesUpdate?.(updated);
        onValueChange(newCat.id);
        setSearchQuery('');
        setNewSubName('');
        setAddingSubAt(null);
        setOpen(false);
      }
    } catch (error) {
      console.error('Failed to create category:', error);
    } finally {
      setIsCreating(false);
    }
  };

  // Select a category
  const handleSelect = (catId: string) => {
    onValueChange(catId);
    setSearchQuery('');
    setOpen(false);
  };

  // Add sub-category inline
  const handleAddSub = async () => {
    if (!newSubName.trim() || isCreating) return;
    const parentId = addingSubAt !== null && categoryChain[addingSubAt]
      ? categoryChain[addingSubAt]
      : value || null;
    await handleCreateCategory(newSubName, parentId);
  };

  // Get display text for the trigger button
  const displayText = value ? buildCategoryLabel(value) : '';

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={(o) => { setOpen(o); if (o) { setSearchQuery(''); setTimeout(() => inputRef.current?.focus(), 50); } }}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            type="button"
            aria-expanded={open}
            className="w-full justify-between h-11 bg-gray-50/50 border-gray-200 font-normal text-left"
          >
            <span className={cn('truncate', !value && 'text-muted-foreground')}>
              {displayText || 'Select Category'}
            </span>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 bg-white border border-gray-200 shadow-lg rounded-lg overflow-hidden" align="start" sideOffset={4}>
          <div className="flex flex-col bg-white">
            {/* Search Input */}
            <div className="flex items-center gap-2 border-b px-3 py-2">
              <Search className="h-4 w-4 shrink-0 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400"
                onKeyDown={(e) => {
                  if (e.key === 'Escape') { setOpen(false); }
                }}
              />
              {searchQuery && (
                <button type="button" onClick={() => setSearchQuery('')} className="text-gray-400 hover:text-gray-600">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Category List */}
            <div className="max-h-[250px] overflow-y-auto p-1">
              {filteredCategories.length > 0 ? (
                filteredCategories.map((cat) => {
                  const label = buildCategoryLabel(cat.id);
                  const isSelected = value === cat.id;
                  // Calculate depth for indentation
                  const depth = label.split(' › ').length - 1;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleSelect(cat.id);
                      }}
                      className={cn(
                        'w-full flex items-center gap-2 rounded-md px-2 py-2 text-sm transition-colors text-left',
                        isSelected
                          ? 'bg-blue-50 text-blue-700 font-medium'
                          : 'hover:bg-gray-100 text-gray-700'
                      )}
                      style={{ paddingLeft: `${8 + depth * 16}px` }}
                    >
                      {depth > 0 && (
                        <ChevronRight className="h-3 w-3 text-gray-400 shrink-0" />
                      )}
                      <Check
                        className={cn(
                          'h-4 w-4 shrink-0',
                          isSelected ? 'text-blue-600' : 'invisible'
                        )}
                      />
                      <span className="truncate">{cat.name}</span>
                      {depth > 0 && (
                        <span className="ml-auto text-[10px] text-gray-400 truncate max-w-[120px]">
                          {label.split(' › ').slice(0, -1).join(' › ')}
                        </span>
                      )}
                    </button>
                  );
                })
              ) : (
                <div className="py-6 text-center">
                  <p className="text-sm text-gray-500">
                    &quot;{searchQuery}&quot; not found
                  </p>
                </div>
              )}
            </div>

            {/* Add new category button - show when no exact match */}
            {searchQuery.trim() && !exactMatch && (
              <div className="border-t p-2">
                <button
                  type="button"
                  onClick={() => handleCreateCategory(searchQuery, null)}
                  disabled={isCreating}
                  className="w-full flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-50"
                >
                  <Plus className="h-4 w-4" />
                  {isCreating ? 'Creating...' : `Add "${searchQuery}" as new category`}
                </button>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Sub-category chain */}
      {value && categoryChain.length > 0 && (
        <div className="space-y-2">
          {/* Show breadcrumb trail */}
          <div className="flex items-center flex-wrap gap-1 text-xs text-gray-500">
            {categoryChain.map((catId, idx) => {
              const cat = categories.find((c) => c.id === catId);
              return (
                <React.Fragment key={catId}>
                  {idx > 0 && <ChevronRight className="h-3 w-3" />}
                  <span className={cn(
                    'px-1.5 py-0.5 rounded',
                    idx === categoryChain.length - 1
                      ? 'bg-blue-100 text-blue-700 font-medium'
                      : 'bg-gray-100 text-gray-600'
                  )}>
                    {cat?.name}
                  </span>
                </React.Fragment>
              );
            })}
          </div>

          {/* Add sub-category UI */}
          {addingSubAt === null ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setAddingSubAt(categoryChain.length - 1)}
              className="w-full border-dashed border-blue-300 text-blue-600 hover:bg-blue-50 h-8 text-xs"
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Add sub-category under &quot;{categories.find(c => c.id === categoryChain[categoryChain.length - 1])?.name}&quot;
            </Button>
          ) : (
            <div className="flex gap-2 items-center">
              <Input
                placeholder="Sub-category name..."
                value={newSubName}
                onChange={(e) => setNewSubName(e.target.value)}
                className="h-8 text-sm flex-1"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { e.preventDefault(); handleAddSub(); }
                  if (e.key === 'Escape') { setAddingSubAt(null); setNewSubName(''); }
                }}
              />
              <Button
                type="button"
                size="sm"
                onClick={handleAddSub}
                disabled={!newSubName.trim() || isCreating}
                className="bg-blue-600 hover:bg-blue-700 h-8 px-3 text-xs"
              >
                {isCreating ? '...' : 'Add'}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => { setAddingSubAt(null); setNewSubName(''); }}
                className="h-8 px-2 text-xs"
              >
                Cancel
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
