import * as z from 'zod';

// ─── Product Lifecycle Status ───
export const PRODUCT_LIFECYCLE_STATUSES = [
  'DRAFT',
  'PENDING_REVIEW',
  'PUBLISHED',
  'ACTIVE',
  'ARCHIVED',
  'DISCONTINUED',
  'COMING_SOON',
  'OUT_OF_STOCK',
] as const;

export type ProductLifecycleStatus = typeof PRODUCT_LIFECYCLE_STATUSES[number];

export const statusConfig: Record<ProductLifecycleStatus, { label: string; color: string; bg: string; dot: string; description: string }> = {
  DRAFT:          { label: 'Draft',          color: 'text-gray-600 dark:text-gray-400',         bg: 'bg-gray-100 dark:bg-gray-800',            dot: 'bg-gray-400',     description: 'Not yet ready for review' },
  PENDING_REVIEW: { label: 'Pending Review', color: 'text-yellow-700 dark:text-yellow-400',     bg: 'bg-yellow-50 dark:bg-yellow-900/20',      dot: 'bg-yellow-400',   description: 'Awaiting admin approval' },
  PUBLISHED:      { label: 'Published',      color: 'text-blue-700 dark:text-blue-400',         bg: 'bg-blue-50 dark:bg-blue-900/20',          dot: 'bg-blue-500',     description: 'Visible on the store' },
  ACTIVE:         { label: 'Active',         color: 'text-emerald-700 dark:text-emerald-400',   bg: 'bg-emerald-50 dark:bg-emerald-900/20',    dot: 'bg-emerald-500',  description: 'Live and selling' },
  ARCHIVED:       { label: 'Archived',       color: 'text-orange-700 dark:text-orange-400',     bg: 'bg-orange-50 dark:bg-orange-900/20',      dot: 'bg-orange-500',   description: 'Hidden from store, data retained' },
  DISCONTINUED:   { label: 'Discontinued',   color: 'text-red-700 dark:text-red-400',           bg: 'bg-red-50 dark:bg-red-900/20',            dot: 'bg-red-500',      description: 'No longer available' },
  COMING_SOON:    { label: 'Coming Soon',    color: 'text-purple-700 dark:text-purple-400',     bg: 'bg-purple-50 dark:bg-purple-900/20',      dot: 'bg-purple-500',   description: 'Pre-announced, not yet available' },
  OUT_OF_STOCK:   { label: 'Out of Stock',   color: 'text-rose-700 dark:text-rose-400',         bg: 'bg-rose-50 dark:bg-rose-900/20',          dot: 'bg-rose-500',     description: 'Currently unavailable' },
};

/**
 * Product Lifecycle Status serves as the single source of truth for visibility.
 */

// ─── Product Master Data Schema ───
export const productSchema = z.object({
  // ── Product Identity ──
  name:           z.string().min(1, 'Product name is required'),
  categoryId:     z.string().min(1, 'Category is required'),
  brandId:        z.string().nullable().optional().or(z.literal('')),
  model:          z.string().nullable().optional().or(z.literal('')),
  unit:           z.string().default('pc'),
  warrantyMonths: z.number().default(0),
  warrantyType:   z.string().nullable().optional().or(z.literal('')),

  // ── Product Classification ──
  productVariantType: z.enum(['simple', 'variable']).default('simple'),

  // ── Lifecycle Status (canonical — isActive is DERIVED from this) ──
  status: z.enum(PRODUCT_LIFECYCLE_STATUSES).default('DRAFT'),

  // ── Tags ──
  tags: z.array(z.string()).default([]),

  // ── Sales Pricing ──
  price:          z.number().min(0, 'Retail price must be positive'),
  offerPrice:     z.number().optional().nullable(),
  onlinePrice:    z.number().optional().nullable(),
  wholesalePrice: z.number().optional().nullable(),
  taxClass:       z.string().optional().nullable(),
  // costPrice is READ-ONLY — managed by Purchase Module. Never submitted from form.
  // Kept in schema as optional so edit initialData can pass it for display purposes only.
  costPrice:      z.number().optional().nullable(),

  // ── Identification ──
  sku:     z.string().nullable().optional().or(z.literal('')),
  barcode: z.string().nullable().optional().or(z.literal('')),

  // ── Inventory Settings (config only, NOT stock levels) ──
  trackInventory: z.boolean().default(true),
  trackSerials:   z.boolean().default(false),
  trackExpiry:    z.boolean().default(false),
  trackBatch:     z.boolean().default(false),
  trackWarranty:  z.boolean().default(false),
  minStock:       z.number().default(5),
  reorderPoint:   z.number().default(10),
  safetyStock:    z.number().default(0),
  reorderQty:     z.number().default(0),
  leadTimeDays:   z.number().default(0),

  // ── Merchandising Flags (NOT store visibility — that is controlled by status) ──
  isFlashSale:  z.boolean().default(false),
  isFeatured:   z.boolean().default(false),
  isBestSeller: z.boolean().default(false),

  // ── Content ──
  description: z.string().nullable().optional().or(z.literal('')),
  shortDesc:   z.string().nullable().optional().or(z.literal('')),
  videoUrl:    z.string().nullable().optional().or(z.literal('')),
  faqs:        z.array(z.object({
    question: z.string().min(1, 'Question is required'),
    answer: z.string().min(1, 'Answer is required'),
  })).default([]),

  // ── SEO ──
  seoTitle:        z.string().nullable().optional().or(z.literal('')),
  metaDescription: z.string().nullable().optional().or(z.literal('')),
  slug:            z.string().nullable().optional().or(z.literal('')),

  images: z.array(z.object({
    id: z.string().optional(),
    url: z.string(),
    isThumbnail: z.boolean().optional(),
    alt: z.string().nullable().optional()
  }).passthrough()).optional(),

  // ── Specifications & Variants (managed by RHF useFieldArray) ──
  productSpecs: z.array(
    z.object({
      id:    z.string().optional(),
      key:   z.string(),
      value: z.string(),
    })
  ).default([]),

  attributes: z.array(
    z.object({
      id:          z.string(),
      attributeId: z.string().optional(),
      name:        z.string().min(1, 'Attribute must be selected'),
      values:      z.array(
        z.object({
          id: z.string(),
          label: z.string(),
          shortCode: z.string().nullable().optional()
        })
      ).min(1, 'At least one value must be selected'),
    })
  ).default([]),

  variants: z.array(
    z.object({
      id:             z.string(),
      name:           z.string(),
      sku: z.string().nullable().optional(),
      upc: z.string().nullable().optional(),
      price:          z.number(),
      offerPrice: z.number().nullable().optional(),
      cost: z.number().nullable().optional(),
      // Read-only ERP fields — kept for display in variant table, never edited
      stock:          z.number().default(0),
      hasSerial:      z.boolean().default(false),
      serials:        z.array(z.string()).default([]),
      image: z.string().nullable().optional(),
      imageAlt: z.string().nullable().optional(),
      productImageId: z.string().nullable().optional(),
      attributes: z.record(z.string(), z.string()).nullable().optional(),
      attributeValueIds: z.array(z.string()).optional(),
      customColor: z.string().nullable().optional(),
    })
  ).default([]),
});

export type ProductFormValues = z.infer<typeof productSchema>;
