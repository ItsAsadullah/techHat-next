import { z } from "zod";

export const productSchema = z.object({
  name: z.string().min(2, "Product name must be at least 2 characters"),
  slug: z.string().min(2, "Slug is required"),
  shortDesc: z.string().optional(),
  description: z.string().optional(),
  categoryId: z.string().min(1, "Category is required"),
  brandId: z.string().optional(),
  vendorId: z.string().optional(),
  type: z.enum(["PHYSICAL", "DIGITAL", "SERVICE"]),
  productVariantType: z.enum(["simple", "variable"]).default("simple"),
  status: z.enum(["DRAFT", "PUBLISHED", "SCHEDULED"]).default("DRAFT"),
  
  // Pricing (defaults — actual pricing lives on variations)
  price: z.coerce.number().min(0, "Price must be positive"),
  offerPrice: z.coerce.number().min(0).optional(),
  costPrice: z.coerce.number().min(0).optional(),
  taxClass: z.string().optional(),
  
  // Inventory (derived from variations)
  stock: z.coerce.number().int().min(0).default(0),
  minStock: z.coerce.number().int().min(0).default(5),
  manageStock: z.boolean().default(true),
  stockStatus: z.enum(["IN_STOCK", "OUT_OF_STOCK", "LOW_STOCK"]).default("IN_STOCK"),
  
  // Media
  images: z.array(z.string()).default([]),
  videoUrl: z.string().url().optional().or(z.literal("")),
  
  // SEO
  seoTitle: z.string().optional(),
  metaDesc: z.string().optional(),
  tags: z.string().optional(), // Comma separated
});

export type ProductFormValues = z.infer<typeof productSchema>;
