import { useForm, UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { productSchema, ProductFormValues } from '../schemas/product.schema';

interface UseProductFormOptions {
  initialData?: Partial<ProductFormValues> & { id?: string; updatedAt?: string | Date; costPrice?: number };
  isEditMode?: boolean;
}

export function useProductForm(options: UseProductFormOptions = {}): UseFormReturn<ProductFormValues> & { isEditMode: boolean } {
  const { initialData, isEditMode = false } = options;

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema) as any,
    defaultValues: {
      // Identity
      name:           initialData?.name || '',
      categoryId:     initialData?.categoryId || '',
      brandId:        initialData?.brandId || '',
      model:          initialData?.model || '',
      unit:           initialData?.unit || 'pc',
      warrantyMonths: initialData?.warrantyMonths || 0,
      warrantyType:   initialData?.warrantyType || '',

      // Classification
      productVariantType: initialData?.productVariantType || 'simple',

      // Lifecycle Status
      status: (initialData as any)?.status || 'DRAFT',

      // Tags
      tags: (initialData as any)?.tags || [],

      // Pricing (costPrice is display-only, never submitted from here)
      price:          initialData?.price || 0,
      offerPrice:     initialData?.offerPrice ?? null,
      onlinePrice:    initialData?.onlinePrice ?? null,
      wholesalePrice: initialData?.wholesalePrice ?? null,
      taxClass:       initialData?.taxClass ?? null,
      costPrice:      initialData?.costPrice ?? null, // display only — never written back

      // Identification
      sku:     initialData?.sku || '',
      barcode: initialData?.barcode || '',

      // Inventory Settings
      trackInventory: initialData?.trackInventory ?? true,
      trackSerials:   initialData?.trackSerials ?? false,
      trackExpiry:    initialData?.trackExpiry ?? false,
      trackBatch:     initialData?.trackBatch ?? false,
      trackWarranty:  initialData?.trackWarranty ?? false,
      minStock:       initialData?.minStock ?? 5,
      reorderPoint:   initialData?.reorderPoint ?? 10,
      safetyStock:    (initialData as any)?.safetyStock ?? 0,
      reorderQty:     (initialData as any)?.reorderQty ?? 0,
      leadTimeDays:   (initialData as any)?.leadTimeDays ?? 0,

      // Merchandising flags ONLY — visibility controlled by status
      isFlashSale:  initialData?.isFlashSale ?? false,
      isFeatured:   initialData?.isFeatured ?? false,
      isBestSeller: initialData?.isBestSeller ?? false,

      // Content
      description: initialData?.description || '',
      shortDesc:   initialData?.shortDesc || '',
      videoUrl:    initialData?.videoUrl || '',
      faqs:        (initialData as any)?.faqs?.length ? (initialData as any).faqs : [{ question: '', answer: '' }],

      // SEO
      seoTitle:        (initialData as any)?.seoTitle || '',
      metaDescription: (initialData as any)?.metaDescription || '',
      slug:            (initialData as any)?.slug || '',

      images: initialData?.images || [],

      // Arrays (managed by RHF useFieldArray)
      productSpecs: initialData?.productSpecs?.length
        ? initialData.productSpecs
        : [{ id: '1', key: '', value: '' }],

      attributes: initialData?.attributes || [],
      variants:   initialData?.variants   || [],
    } as any,
  });

  return Object.assign(form, { isEditMode });
}
