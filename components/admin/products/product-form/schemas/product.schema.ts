import * as z from 'zod';

export const productSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  categoryId: z.string().min(1, 'Category is required'),
  brandId: z.string().optional().or(z.literal('')),
  productVariantType: z.enum(['simple', 'variable']).default('simple'),
  unit: z.string().default('pc'),
  videoUrl: z.string().optional().or(z.literal('')),
  warrantyMonths: z.number().default(0),
  warrantyType: z.string().optional().or(z.literal('')),
  model: z.string().optional().or(z.literal('')),
  isActive: z.boolean().default(true),
  isFlashSale: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
  isBestSeller: z.boolean().default(false),
  description: z.string().optional().or(z.literal('')),
  shortDesc: z.string().optional().or(z.literal('')),

  // Pricing
  price: z.number().min(0, 'Selling price must be positive'),
  offerPrice: z.number().optional().nullable(),
  onlinePrice: z.number().optional().nullable(),
  wholesalePrice: z.number().optional().nullable(),
  taxClass: z.string().optional().nullable(),
  costPrice: z.number().min(0).default(0),

  // Inventory Configuration
  sku: z.string().optional().or(z.literal('')),
  barcode: z.string().optional().or(z.literal('')),
  trackInventory: z.boolean().default(true),
  trackSerials: z.boolean().default(false),
  trackExpiry: z.boolean().default(false),
  trackBatch: z.boolean().default(false),
  trackWarranty: z.boolean().default(false),
  minStock: z.number().default(5),
  maxStock: z.number().default(100),
  reorderPoint: z.number().default(10),
  defaultWarehouseId: z.string().optional().nullable(),
  defaultSupplierId: z.string().optional().nullable(),
  
  // Dynamic fields
  images: z.array(z.string()).optional(),
});

export type ProductFormValues = z.infer<typeof productSchema>;
