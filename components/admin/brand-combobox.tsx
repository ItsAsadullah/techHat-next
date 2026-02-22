'use client';

import * as React from 'react';
import { Check, ChevronDown, Plus, Search, Upload, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { compressImage } from '@/lib/compress-image';
import { Label } from '@/components/ui/label';
import { createBrand } from '@/lib/actions/brand-actions';
import Image from 'next/image';

interface Brand {
  id: string;
  name: string;
  logo?: string | null;
}

interface BrandComboboxProps {
  brands: Brand[];
  value?: string;
  onValueChange: (value: string) => void;
  onBrandsUpdate?: (brands: Brand[]) => void;
}

export function BrandCombobox({
  brands: initialBrands,
  value,
  onValueChange,
  onBrandsUpdate,
}: BrandComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [brands, setBrands] = React.useState<Brand[]>(initialBrands);
  const [showAddDialog, setShowAddDialog] = React.useState(false);
  const [newBrandName, setNewBrandName] = React.useState('');
  const [logoFile, setLogoFile] = React.useState<File | null>(null);
  const [logoPreview, setLogoPreview] = React.useState<string>('');
  const [isCreating, setIsCreating] = React.useState(false);

  const inputRef = React.useRef<HTMLInputElement>(null);

  // Sync brands from parent
  React.useEffect(() => {
    setBrands(initialBrands);
  }, [initialBrands]);

  // Filter brands by search query
  const filteredBrands = React.useMemo(() => {
    if (!searchQuery.trim()) return brands;
    return brands.filter((b) =>
      b.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [brands, searchQuery]);

  const selectedBrand = brands.find((b) => b.id === value);

  // Check if search query exactly matches any brand
  const exactMatch = React.useMemo(() => {
    if (!searchQuery.trim()) return true;
    return brands.some((b) => b.name.toLowerCase() === searchQuery.trim().toLowerCase());
  }, [brands, searchQuery]);

  // Handle logo file selection
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const resetDialog = () => {
    setNewBrandName('');
    setLogoFile(null);
    setLogoPreview('');
    setShowAddDialog(false);
  };

  // Handle creating new brand
  const handleCreateBrand = async () => {
    if (!newBrandName.trim()) return;
    setIsCreating(true);
    try {
      let logoBase64: string | undefined;
      if (logoFile) {
        logoBase64 = await compressImage(logoFile, 400, 400, 0.85, 0.3);
      }

      const result = await createBrand(newBrandName.trim(), logoBase64);

      if (result.success && result.data) {
        const newBrand = result.data as Brand;
        const updated = [...brands, newBrand];
        setBrands(updated);
        onBrandsUpdate?.(updated);
        onValueChange(newBrand.id);
        setSearchQuery('');
        resetDialog();
        setOpen(false);
      }
    } catch (error) {
      console.error('Failed to create brand:', error);
    } finally {
      setIsCreating(false);
    }
  };

  // Open add dialog with search query pre-filled
  const openAddDialog = () => {
    setNewBrandName(searchQuery);
    setShowAddDialog(true);
    setOpen(false);
  };

  // Select a brand
  const handleSelect = (brandId: string) => {
    onValueChange(brandId === value ? '' : brandId);
    setSearchQuery('');
    setOpen(false);
  };

  return (
    <>
      <Popover open={open} onOpenChange={(o) => { setOpen(o); if (o) { setSearchQuery(''); setTimeout(() => inputRef.current?.focus(), 50); } }}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            type="button"
            aria-expanded={open}
            className="w-full justify-between h-11 bg-gray-50/50 border-gray-200 font-normal text-left"
          >
            <span className={cn('truncate flex items-center gap-2', !value && 'text-muted-foreground')}>
              {selectedBrand ? (
                <>
                  {selectedBrand.logo && (
                    <Image
                      src={selectedBrand.logo}
                      alt={selectedBrand.name}
                      width={18}
                      height={18}
                      className="rounded object-contain shrink-0"
                      style={{ width: "auto", height: "auto" }}
                    />
                  )}
                  {selectedBrand.name}
                </>
              ) : (
                'Select Brand'
              )}
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
                placeholder="Search brand..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400"
                onKeyDown={(e) => {
                  if (e.key === 'Escape') setOpen(false);
                }}
              />
              {searchQuery && (
                <button type="button" onClick={() => setSearchQuery('')} className="text-gray-400 hover:text-gray-600">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Brand List */}
            <div className="max-h-[250px] overflow-y-auto p-1">
              {filteredBrands.length > 0 ? (
                filteredBrands.map((brand) => {
                  const isSelected = value === brand.id;
                  return (
                    <button
                      key={brand.id}
                      type="button"
                      onClick={() => handleSelect(brand.id)}
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
                      {brand.logo && (
                        <Image
                          src={brand.logo}
                          alt={brand.name}
                          width={20}
                          height={20}
                          className="rounded object-contain shrink-0"
                          style={{ width: "auto", height: "auto" }}
                        />
                      )}
                      <span className="truncate">{brand.name}</span>
                    </button>
                  );
                })
              ) : (
                <div className="py-6 text-center">
                  <p className="text-sm text-gray-500">
                    {searchQuery ? `"${searchQuery}" not found` : 'No brands available'}
                  </p>
                </div>
              )}
            </div>

            {/* Add new brand button */}
            {(searchQuery.trim() && !exactMatch) || filteredBrands.length === 0 ? (
              <div className="border-t p-2">
                <button
                  type="button"
                  onClick={openAddDialog}
                  className="w-full flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Add New Brand{searchQuery.trim() ? ` "${searchQuery}"` : ''}
                </button>
              </div>
            ) : null}
          </div>
        </PopoverContent>
      </Popover>

      {/* Add Brand Dialog */}
      <Dialog open={showAddDialog} onOpenChange={(o) => { if (!o) resetDialog(); }}>
        <DialogContent className="sm:max-w-[460px] p-0 overflow-hidden bg-white">
          {/* Header with gradient */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 pt-6 pb-5">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-white">Add New Brand</DialogTitle>
              <DialogDescription className="text-blue-100 text-sm">
                Enter brand details to create a new brand
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="px-6 py-5 space-y-5">
            {/* Brand Name */}
            <div className="space-y-1.5">
              <Label htmlFor="brandName" className="text-sm font-semibold text-gray-700">
                Brand Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="brandName"
                placeholder="e.g. Samsung, Apple, Xiaomi"
                value={newBrandName}
                onChange={(e) => setNewBrandName(e.target.value)}
                className="h-11 bg-gray-50 border-gray-200 focus:bg-white focus:border-blue-400 focus:ring-blue-400/20 transition-all"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { e.preventDefault(); handleCreateBrand(); }
                }}
              />
            </div>

            {/* Logo Upload */}
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold text-gray-700">
                Brand Logo <span className="text-gray-400 font-normal text-xs">(Optional)</span>
              </Label>
              {logoPreview ? (
                <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="relative w-20 h-20 border border-gray-200 rounded-lg overflow-hidden bg-white shrink-0">
                    <Image
                      src={logoPreview}
                      alt="Logo preview"
                      fill
                      className="object-contain p-2"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-700 truncate">{logoFile?.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {logoFile ? `${(logoFile.size / 1024).toFixed(1)} KB` : ''}
                    </p>
                    <button
                      type="button"
                      onClick={() => { setLogoFile(null); setLogoPreview(''); }}
                      className="mt-1.5 text-xs text-red-500 hover:text-red-600 font-medium flex items-center gap-1"
                    >
                      <X className="h-3 w-3" /> Remove
                    </button>
                  </div>
                </div>
              ) : (
                <label
                  htmlFor="brandLogo"
                  className="group flex flex-col items-center justify-center w-full py-6 border-2 border-gray-200 border-dashed rounded-xl cursor-pointer bg-gray-50 hover:bg-blue-50/50 hover:border-blue-300 transition-all"
                >
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-2 group-hover:bg-blue-200 transition-colors">
                    <Upload className="w-5 h-5 text-blue-600" />
                  </div>
                  <p className="text-sm font-medium text-gray-600 group-hover:text-blue-600">Click to upload logo</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">PNG, JPG, SVG — Max 2MB</p>
                  <input
                    id="brandLogo"
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleLogoChange}
                  />
                </label>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={resetDialog} className="border-gray-300 text-gray-600 hover:bg-gray-100">
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleCreateBrand}
              disabled={!newBrandName.trim() || isCreating}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 shadow-sm"
            >
              {isCreating ? 'Creating...' : 'Create Brand'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
