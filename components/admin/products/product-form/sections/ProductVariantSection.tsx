'use client';

import { useFormContext, useFieldArray, Controller } from 'react-hook-form';
import { ProductFormValues } from '../schemas/product.schema';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, RefreshCw, Layers, Package, ShieldAlert, X, Check, ChevronsUpDown } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { memo, useCallback, useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { CldUploadWidget } from 'next-cloudinary';
import NextImage from 'next/image';
import { ImagePlus, PaintBucket, ImageIcon, Upload, Trash } from 'lucide-react';
import { MediaLibrary } from '@/components/admin/media-library';

interface AttributeValueDef {
  id: string;
  value: string;
  label?: string; // backwards compat
  shortCode?: string | null;
}

interface AttributeDef {
  id: string;
  name: string;
  values: AttributeValueDef[];
}

interface Props {
  attributesList: AttributeDef[];
  categoryAttributes?: any[];
}

function VariantImageUploader({ 
  currentImage, 
  variantName, 
  onImageUpload, 
  onImageRemove 
}: { 
  currentImage: string | null; 
  variantName: string; 
  onImageUpload: (url: string) => void; 
  onImageRemove: () => void; 
}) {
  const [libraryOpen, setLibraryOpen] = useState(false);

  const uploadOptions = useMemo(() => ({
    maxFiles: 1,
    resourceType: "image" as const,
    clientAllowedFormats: ["png", "jpeg", "jpg", "webp"],
    folder: "products/variants",
    sources: ['local', 'url', 'camera', 'google_drive'],
    singleUploadAutoClose: false
  }), []);

  const handleSuccess = useCallback((result: any) => {
    if (typeof result.info === 'object' && result.info.secure_url) {
      onImageUpload(result.info.secure_url);
    }
  }, [onImageUpload]);

  return (
    <>
      <MediaLibrary
        multiple={false}
        open={libraryOpen}
        onOpenChange={setLibraryOpen}
        onSelect={(url) => {
          const finalUrl = Array.isArray(url) ? url[0] : url;
          if (finalUrl) onImageUpload(finalUrl);
        }}
      />
      <CldUploadWidget
        signatureEndpoint="/api/cloudinary/sign"
        onSuccess={handleSuccess}
        options={uploadOptions}
      >
        {({ open }) => (
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="relative w-9 h-9 rounded bg-muted/50 border border-dashed flex flex-col items-center justify-center shrink-0 hover:bg-muted transition-colors overflow-hidden group/img"
              >
                {currentImage ? (
                  <>
                    <NextImage src={currentImage} alt={variantName} fill sizes="36px" className="object-cover" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity">
                      <ImagePlus className="w-3.5 h-3.5 text-white" />
                    </div>
                  </>
                ) : (
                  <ImagePlus className="w-3.5 h-3.5 text-muted-foreground" />
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setLibraryOpen(true); }} className="cursor-pointer">
                <ImageIcon className="w-4 h-4 mr-2" />
                Choose from Library
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={(e) => { e.preventDefault(); open(); }} className="cursor-pointer">
                <Upload className="w-4 h-4 mr-2" />
                Upload New
              </DropdownMenuItem>
              {currentImage && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onSelect={() => onImageRemove()} 
                    className="text-red-600 cursor-pointer focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/30"
                  >
                    <Trash className="w-4 h-4 mr-2" />
                    Remove Image
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </CldUploadWidget>
    </>
  );
}

// Multi-select for attribute values
function AttributeValueSelect({ 
  options, 
  selectedValues, 
  onChange 
}: { 
  options: AttributeValueDef[], 
  selectedValues: { id: string, label: string, shortCode?: string | null }[], 
  onChange: (vals: { id: string, label: string, shortCode?: string | null }[]) => void 
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const toggleOption = (opt: AttributeValueDef) => {
    const isSelected = selectedValues.some(v => v.id === opt.id);
    if (isSelected) {
      onChange(selectedValues.filter(v => v.id !== opt.id));
    } else {
      onChange([...selectedValues, { id: opt.id, label: opt.value || opt.label || '', shortCode: opt.shortCode }]);
    }
  };

  const filteredOptions = useMemo(() => {
    if (!search.trim()) return options;
    return options.filter(opt => 
      (opt.value || opt.label || '').toLowerCase().includes(search.toLowerCase())
    );
  }, [options, search]);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5 min-h-[32px]">
        {selectedValues.map((v) => (
          <Badge key={v.id} variant="secondary" className="flex items-center gap-1 px-2 py-0.5 font-normal">
            {v.label} {v.shortCode && <span className="text-[9px] text-muted-foreground ml-1">({v.shortCode})</span>}
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground focus:outline-none ml-1"
              onClick={() => onChange(selectedValues.filter(sv => sv.id !== v.id))}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between h-8 text-xs bg-white dark:bg-gray-900"
          >
            Select values...
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0" align="start">
          <div className="flex flex-col">
            <div className="px-3 py-2 border-b">
              <input
                type="text"
                className="w-full bg-transparent outline-none text-sm placeholder:text-muted-foreground"
                placeholder="Search values..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="max-h-[200px] overflow-y-auto p-1">
              {filteredOptions.length === 0 ? (
                <div className="py-4 text-center text-sm text-muted-foreground">No value found.</div>
              ) : (
                filteredOptions.map((opt) => {
                  const isSelected = selectedValues.some(v => v.id === opt.id);
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => toggleOption(opt)}
                      className={cn(
                        "w-full flex items-center px-2 py-1.5 text-sm rounded-sm hover:bg-muted/50 text-left transition-colors",
                        isSelected ? "bg-muted/20" : ""
                      )}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4 text-primary shrink-0",
                          isSelected ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <span className="flex-1 truncate">{opt.value || opt.label}</span>
                      {opt.shortCode && (
                        <span className="ml-2 text-xs text-muted-foreground font-mono">{opt.shortCode}</span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

// Memoized variant row
const VariantRow = memo(({
  index,
  variant,
  register,
  remove,
  setValue
}: {
  index: number;
  variant: any;
  register: any;
  remove: (index: number) => void;
  setValue: any;
}) => {
  const { watch, getValues } = useFormContext<ProductFormValues>();
  const currentImage = watch(`variants.${index}.image`);
  const currentColor = watch(`variants.${index}.customColor`);
  const hasColorAttr = variant.attributes && Object.keys(variant.attributes).some(k => k.toLowerCase() === 'color');

  return (
    <tr className="hover:bg-muted/20 group">
      <td className="px-3 py-2">
        <div className="flex items-center gap-3">
          <VariantImageUploader 
            currentImage={currentImage}
            variantName={variant.name}
            onImageUpload={(url) => {
              setValue(`variants.${index}.image`, url, { shouldDirty: true });
              
              // Auto-apply this image to other variants with the exact same Color
              const colorKey = Object.keys(variant.attributes || {}).find(k => k.toLowerCase() === 'color');
              if (colorKey && variant.attributes[colorKey]) {
                const myColorValue = variant.attributes[colorKey];
                const allVariants = getValues('variants') || [];
                
                allVariants.forEach((v: any, i: number) => {
                  if (i === index) return;
                  const vColorKey = Object.keys(v.attributes || {}).find(k => k.toLowerCase() === 'color');
                  if (vColorKey && v.attributes[vColorKey] === myColorValue) {
                    setValue(`variants.${i}.image`, url, { shouldDirty: true });
                  }
                });
              }
            }}
            onImageRemove={() => {
              setValue(`variants.${index}.image`, null, { shouldDirty: true });
              
              // Optionally remove from others with same color if they have the EXACT SAME image
              const colorKey = Object.keys(variant.attributes || {}).find(k => k.toLowerCase() === 'color');
              if (colorKey && variant.attributes[colorKey]) {
                const myColorValue = variant.attributes[colorKey];
                const allVariants = getValues('variants') || [];
                
                allVariants.forEach((v: any, i: number) => {
                  if (i === index) return;
                  const vColorKey = Object.keys(v.attributes || {}).find(k => k.toLowerCase() === 'color');
                  if (vColorKey && v.attributes[vColorKey] === myColorValue) {
                    if (v.image === currentImage) {
                      setValue(`variants.${i}.image`, null, { shouldDirty: true });
                    }
                  }
                });
              }
            }}
          />

          <div className="flex flex-col gap-1 w-full max-w-[150px]">
            <span className="font-medium text-xs truncate" title={variant.name}>{variant.name}</span>
            {currentImage && (
              <Input 
                className="h-6 text-[10px] w-full bg-transparent px-1.5 py-0" 
                placeholder="Alt text..." 
                title="Image Alt Text"
                {...register(`variants.${index}.imageAlt`)} 
              />
            )}
            <input type="hidden" {...register(`variants.${index}.name`)} />
            <input type="hidden" {...register(`variants.${index}.id`)} />
          </div>
        </div>
      </td>
      <td className="px-3 py-2">
        <Input
          className="h-7 text-xs font-mono w-[130px]"
          placeholder="SKU"
          {...register(`variants.${index}.sku`)}
        />
      </td>
      <td className="px-3 py-2">
        <div className="relative">
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">৳</span>
          <Input
            className="h-7 text-xs w-[90px] pl-5"
            type="number"
            step="0.01"
            {...register(`variants.${index}.price`, { valueAsNumber: true })}
          />
        </div>
      </td>
      {hasColorAttr && (
        <td className="px-3 py-2">
          <div className="flex items-center gap-2">
            <div className="relative w-6 h-6 rounded-full overflow-hidden border shadow-sm shrink-0 cursor-pointer group/color">
              <input
                type="color"
                className="absolute -inset-2 w-10 h-10 cursor-pointer opacity-0"
                value={currentColor || '#ffffff'}
                onChange={(e) => setValue(`variants.${index}.customColor`, e.target.value, { shouldDirty: true })}
              />
              <div className="w-full h-full" style={{ backgroundColor: currentColor || '#ffffff' }} />
              {!currentColor && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <PaintBucket className="w-3 h-3 text-muted-foreground/50" />
                </div>
              )}
            </div>
          </div>
        </td>
      )}
      {!hasColorAttr && (
        <td className="px-3 py-2 text-muted-foreground text-[10px]">
          -
        </td>
      )}
      <td className="px-3 py-2">
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] font-medium text-gray-400">Ledger Driven</span>
        </div>
        <input type="hidden" {...register(`variants.${index}.stock`, { valueAsNumber: true })} />
      </td>
      <td className="px-3 py-2 text-center">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => remove(index)}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </td>
    </tr>
  );
});
VariantRow.displayName = 'VariantRow';

export function ProductVariantSection({ attributesList = [], categoryAttributes = [] }: Props) {
  const { control, watch, register, setValue, getValues, formState: { errors } } = useFormContext<ProductFormValues>();

  const productVariantType = watch('productVariantType');
  const basePrice          = watch('price') || 0;
  const baseSku            = watch('sku') || '';
  const watchedAttributes  = watch('attributes') || [];

  const { fields: attributes, append: appendAttr, remove: removeAttr, update: updateAttr } = useFieldArray({
    control,
    name: 'attributes',
  });

  const { fields: variations, append: appendVar, remove: removeVar, replace: replaceVars } = useFieldArray({
    control,
    name: 'variants',
  });

  // Extract available attributes not yet selected
  const categoryId = watch('categoryId');
  const availableAttributes = useMemo(() => {
    const selectedIds = watchedAttributes.map(a => a?.attributeId).filter(Boolean);
    const unselected = attributesList.filter(a => !selectedIds.includes(a.id));
    
    if (!categoryId || !categoryAttributes || categoryAttributes.length === 0) return unselected;
    
    const suggestedIds = categoryAttributes
      .filter(ca => ca.categoryId === categoryId)
      .map(ca => ca.attributeId);
      
    return unselected.sort((a, b) => {
      const aSuggested = suggestedIds.includes(a.id);
      const bSuggested = suggestedIds.includes(b.id);
      if (aSuggested && !bSuggested) return -1;
      if (!aSuggested && bSuggested) return 1;
      return a.name.localeCompare(b.name);
    }).map(a => ({
      ...a,
      isSuggested: suggestedIds.includes(a.id)
    }));
  }, [attributesList, watchedAttributes, categoryId, categoryAttributes]);

  if (productVariantType === 'simple') return null;

  /**
   * Smart Merge Variant Generation.
   */
  const generateVariations = useCallback(() => {
    const currentAttributes = getValues('attributes') || [];
    if (currentAttributes.length === 0) return;

    // We need cartesian product of objects
    const cartesian = (args: any[][]): any[][] =>
      args.reduce<any[][]>((a, b) => a.flatMap(d => b.map(e => [...(Array.isArray(d) ? d : [d]), e])), [[]]);

    const activeAttributes = currentAttributes.filter(a => a.values && a.values.length > 0);
    const attrValuesArrays = activeAttributes.map(a => a.values);
    if (attrValuesArrays.length === 0) return;

    const combinations = cartesian(attrValuesArrays);

    const existingByName = new Map<string, typeof variations[number]>();
    for (const v of variations) {
      existingByName.set(v.name, v);
    }

    const newVariations = combinations.map(combo => {
      const values = Array.isArray(combo) ? combo : [combo];
      const variantName = values.map(v => v.label).join(' / ');

      const attrMap: Record<string, string> = {};
      const attrValueIds: string[] = [];
      activeAttributes.forEach((attr, idx) => {
        attrMap[attr.name] = values[idx].label;
        attrValueIds.push(values[idx].id);
      });

      const existing = existingByName.get(variantName);
      if (existing) {
        return {
          ...existing,
          attributeValueIds: attrValueIds // Ensure this is always updated
        };
      }

      // Smart SKU Generation using Short Codes
      const skuParts = values.map(v => {
        if (v.shortCode) return v.shortCode;
        return v.label.replace(/[^a-zA-Z0-9]/g, '').substring(0, 3).toUpperCase();
      });
      const skuSuffix = skuParts.join('-');
      const generatedSku = baseSku ? `${baseSku}-${skuSuffix}` : skuSuffix;

      return {
        id:         Math.random().toString(36).substring(2, 11),
        name:       variantName,
        sku:        generatedSku,
        upc:        '',
        price:      basePrice,
        offerPrice: null,
        stock:      0,
        hasSerial:  false,
        serials:    [],
        attributes: attrMap,
        attributeValueIds: attrValueIds,
      };
    });

    replaceVars(newVariations as any);
  }, [attributes, variations, baseSku, basePrice, replaceVars, getValues]);

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <Label className="text-sm font-medium">Global Attributes</Label>
          <Select
            key={`attr-select-${attributes.length}`}
            onValueChange={(val) => {
              const attrDef = attributesList.find(a => a.id === val);
              if (attrDef) {
                appendAttr({
                  id: Math.random().toString(36).substring(2, 11),
                  attributeId: attrDef.id,
                  name: attrDef.name,
                  values: []
                });
              }
            }}
          >
            <SelectTrigger className="w-[180px] h-8 text-xs">
              <SelectValue placeholder="Add Attribute..." />
            </SelectTrigger>
            <SelectContent>
              {availableAttributes.length === 0 ? (
                <SelectItem value="empty" disabled>No attributes available</SelectItem>
              ) : (
                availableAttributes.map(a => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name} {(a as any).isSuggested && <span className="text-muted-foreground text-[10px] ml-1">(Suggested)</span>}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        {attributes.length === 0 && (
          <div className="py-8 text-center border-2 border-dashed rounded-lg bg-muted/20">
            <Layers className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No attributes added yet.</p>
            <p className="text-xs text-muted-foreground mt-1">Select an attribute from the dropdown to create variants.</p>
          </div>
        )}

        <div className="space-y-3">
          {attributes.map((attr, index) => {
            const attrDef = attributesList.find(a => a.id === attr.attributeId || (a.name.toLowerCase() === attr.name?.toLowerCase()));
            
            return (
              <div key={attr.id} className="p-4 border rounded-xl space-y-3 bg-muted/10">
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <Input
                      value={attr.name}
                      readOnly
                      className="h-9 w-full font-medium bg-gray-100 dark:bg-gray-800"
                    />
                    <input type="hidden" {...register(`attributes.${index}.attributeId` as const)} value={attr.attributeId} />
                    <input type="hidden" {...register(`attributes.${index}.name` as const)} value={attr.name} />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-red-500 shrink-0 hover:bg-red-50 dark:hover:bg-red-950/30"
                    onClick={() => removeAttr(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="pl-1">
                  <Label className="text-xs text-muted-foreground mb-1.5 block">Attribute Values</Label>
                  {attrDef ? (
                    <Controller
                      control={control}
                      name={`attributes.${index}.values`}
                      render={({ field }) => (
                        <AttributeValueSelect
                          options={attrDef.values}
                          selectedValues={field.value || []}
                          onChange={field.onChange}
                        />
                      )}
                    />
                  ) : (
                    <p className="text-xs text-red-500">Attribute definition missing.</p>
                  )}
                  {errors?.attributes?.[index]?.values && (
                    <p className="text-red-500 text-[10px] mt-1">{errors.attributes[index]?.values?.message}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {attributes.length > 0 && (
          <div className="space-y-2">
            <Button
              type="button"
              variant="secondary"
              className="w-full h-9 text-sm"
              onClick={generateVariations}
              disabled={!watchedAttributes.some(a => a.values && a.values.length > 0)}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              {variations.length > 0 ? 'Re-generate Variants (Smart Merge)' : 'Generate Variants'}
            </Button>
            {variations.length > 0 && (
              <div className="flex items-start gap-1.5 text-[11px] text-amber-700 dark:text-amber-400">
                <ShieldAlert className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <span>Smart merge is active — existing prices, SKUs, and images are preserved. Only new combinations are added.</span>
              </div>
            )}
          </div>
        )}
      </div>

      {variations.length > 0 && (
        <div className="space-y-3 pt-3 border-t">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">
              Variants
              <span className="ml-2 text-xs font-normal text-muted-foreground">({variations.length})</span>
            </Label>
          </div>

          <div className="border rounded-lg overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/30 border-b text-left">
                  <th className="px-3 py-2 font-medium text-xs text-muted-foreground">Variant</th>
                  <th className="px-3 py-2 font-medium text-xs text-muted-foreground">SKU</th>
                  <th className="px-3 py-2 font-medium text-xs text-muted-foreground">Price</th>
                  <th className="px-3 py-2 font-medium text-xs text-muted-foreground">Color</th>
                  <th className="px-3 py-2 font-medium text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      Stock
                      <span className="text-[9px] uppercase tracking-wider bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-1 rounded">Inventory</span>
                    </span>
                  </th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {variations.map((variant, index) => (
                  <VariantRow
                    key={variant.id}
                    index={index}
                    variant={variant}
                    register={register}
                    remove={removeVar}
                    setValue={setValue}
                  />
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Package className="h-3.5 w-3.5 shrink-0" />
            Stock levels are managed by the Inventory Module. Prices and SKUs are editable here.
          </p>
        </div>
      )}
    </div>
  );
}
