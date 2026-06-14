import { useForm, UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { productSchema, ProductFormValues } from '../schemas/product.schema';

export function useProductForm(initialData?: Partial<ProductFormValues>): UseFormReturn<ProductFormValues> {
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema) as any,
    defaultValues: {
      name: initialData?.name || '',
      categoryId: initialData?.categoryId || '',
      brandId: initialData?.brandId || '',
      productVariantType: initialData?.productVariantType || 'simple',
      unit: initialData?.unit || 'pc',
      videoUrl: initialData?.videoUrl || '',
      warrantyMonths: initialData?.warrantyMonths || 0,
      warrantyType: initialData?.warrantyType || '',
      model: initialData?.model || '',
      isActive: initialData?.isActive ?? true,
      isFlashSale: initialData?.isFlashSale ?? false,
      isFeatured: initialData?.isFeatured ?? false,
      isBestSeller: initialData?.isBestSeller ?? false,
      description: initialData?.description || '',
      shortDesc: initialData?.shortDesc || '',
      
      // Pricing
      price: initialData?.price || 0,
      offerPrice: initialData?.offerPrice || null,
      onlinePrice: initialData?.onlinePrice || null,
      wholesalePrice: initialData?.wholesalePrice || null,
      taxClass: initialData?.taxClass || null,
      costPrice: initialData?.costPrice || 0,
      
      // Inventory Config
      sku: initialData?.sku || '',
      barcode: initialData?.barcode || '',
      trackInventory: initialData?.trackInventory ?? true,
      trackSerials: initialData?.trackSerials ?? false,
      trackExpiry: initialData?.trackExpiry ?? false,
      trackBatch: initialData?.trackBatch ?? false,
      trackWarranty: initialData?.trackWarranty ?? false,
      minStock: initialData?.minStock ?? 5,
      maxStock: initialData?.maxStock ?? 100,
      reorderPoint: initialData?.reorderPoint ?? 10,
      defaultWarehouseId: initialData?.defaultWarehouseId || null,
      defaultSupplierId: initialData?.defaultSupplierId || null,
      
      images: initialData?.images || [],
    } as any,
  });

  return form;
}
