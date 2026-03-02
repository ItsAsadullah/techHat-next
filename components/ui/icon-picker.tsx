'use client';

import { useState, type ElementType } from 'react';
import * as Icons from 'lucide-react';
import { Search, X, Smile } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CATEGORY_ICON_LIST } from '@/lib/category-icon';

interface IconPickerProps {
  value: string;
  onChange: (value: string) => void;
}

export function IconPicker({ value, onChange }: IconPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = CATEGORY_ICON_LIST.filter(
    (icon) =>
      icon.label.toLowerCase().includes(search.toLowerCase()) ||
      icon.name.toLowerCase().includes(search.toLowerCase())
  );

  // Deduplicate by name (some icons share names like UtensilsCrossed)
  const deduplicated = filtered.filter(
    (icon, idx, arr) => arr.findIndex((i) => i.name === icon.name) === idx
  );

  const CurrentIcon = value ? (Icons as any)[value] as ElementType | undefined : null;

  return (
    <>
      {/* Trigger Button */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen(true)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen(true); } }}
        className={cn(
          'flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all w-full text-left cursor-pointer',
          value
            ? 'border-blue-300 bg-blue-50 hover:border-blue-400'
            : 'border-dashed border-gray-300 hover:border-orange-400 bg-white'
        )}
      >
        <div
          className={cn(
            'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0',
            value ? 'bg-gradient-to-br from-blue-500 to-indigo-600' : 'bg-gray-100'
          )}
        >
          {CurrentIcon ? (
            <CurrentIcon className="w-6 h-6 text-white" />
          ) : (
            <Smile className="w-6 h-6 text-gray-400" />
          )}
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-800">
            {value || 'No icon selected'}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {value ? 'Click to change icon' : 'Click to pick an icon'}
          </p>
        </div>
        {value && (
          <button
            type="button"
            className="ml-auto p-1.5 hover:bg-red-50 rounded-lg transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              onChange('');
            }}
          >
            <X className="w-4 h-4 text-red-400" />
          </button>
        )}
      </div>

      {/* Picker Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-2xl border-2 border-gray-200 shadow-2xl max-w-lg max-h-[90vh] flex flex-col">
          <DialogHeader className="pb-2 flex-shrink-0">
            <DialogTitle className="text-lg font-bold text-gray-900">Choose Category Icon</DialogTitle>
          </DialogHeader>

          {/* Search */}
          <div className="relative flex-shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search icons..."
              className="pl-9 h-10 rounded-lg border-2 border-gray-200 focus:border-blue-400"
              autoFocus
            />
          </div>

          {/* Icon Grid */}
          <div className="overflow-y-auto flex-1 -mx-1 px-1">
            {deduplicated.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-sm">
                No icons found for &quot;{search}&quot;
              </div>
            ) : (
              <div className="grid grid-cols-5 gap-2 pt-1 pb-2">
                {deduplicated.map((icon) => {
                  const Icon = (Icons as any)[icon.name] as ElementType | undefined;
                  if (!Icon) return null;
                  const isSelected = value === icon.name;
                  return (
                    <button
                      key={icon.name}
                      type="button"
                      onClick={() => {
                        onChange(icon.name);
                        setOpen(false);
                        setSearch('');
                      }}
                      className={cn(
                        'flex flex-col items-center gap-1.5 p-2.5 rounded-xl border-2 transition-all',
                        'hover:border-blue-300 hover:bg-blue-50',
                        isSelected
                          ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                          : 'border-gray-100 bg-white'
                      )}
                      title={icon.label}
                    >
                      <div
                        className={cn(
                          'w-9 h-9 rounded-lg flex items-center justify-center',
                          isSelected
                            ? 'bg-gradient-to-br from-blue-500 to-indigo-600'
                            : 'bg-gray-100'
                        )}
                      >
                        <Icon
                          className={cn(
                            'w-5 h-5',
                            isSelected ? 'text-white' : 'text-gray-600'
                          )}
                        />
                      </div>
                      <span className="text-[10px] text-gray-500 text-center leading-tight line-clamp-2">
                        {icon.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 pt-2 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs text-gray-400">
              {deduplicated.length} icon{deduplicated.length !== 1 ? 's' : ''}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setOpen(false);
                setSearch('');
              }}
              className="rounded-lg text-xs"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
