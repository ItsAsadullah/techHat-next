import { PrismaClient } from '@prisma/client';
import { productSchema } from '../components/admin/products/product-form/schemas/product.schema';

const prisma = new PrismaClient();

async function test() {
  const id = '1b402157-be8b-4afc-a2c8-36c4e78fb36e';
  const product = await prisma.product.findUnique({
    where: { id },
    include: { variants: true }
  });

  if (!product) {
    console.log("Product not found");
    return;
  }

  // Mimic useProductForm initialization
  const initialData = product as any;
  const formData = {
    name:           initialData?.name || '',
    categoryId:     initialData?.categoryId || '',
    brandId:        initialData?.brandId || '',
    model:          initialData?.model || '',
    unit:           initialData?.unit || 'pc',
    warrantyMonths: initialData?.warrantyMonths || 0,
    warrantyType:   initialData?.warrantyType || '',
    productVariantType: initialData?.productVariantType || 'simple',
    status:         initialData?.status || 'DRAFT',
    tags:           initialData?.tags || [],
    price:          initialData?.price || 0,
    offerPrice:     initialData?.offerPrice ?? null,
    onlinePrice:    initialData?.onlinePrice ?? null,
    wholesalePrice: initialData?.wholesalePrice ?? null,
    taxClass:       initialData?.taxClass ?? null,
    costPrice:      initialData?.costPrice ?? null,
    sku:            initialData?.sku || '',
    barcode:        initialData?.barcode || '',
    trackInventory: initialData?.trackInventory ?? true,
    trackSerials:   initialData?.trackSerials ?? false,
    trackExpiry:    initialData?.trackExpiry ?? false,
    trackBatch:     initialData?.trackBatch ?? false,
    trackWarranty:  initialData?.trackWarranty ?? false,
    minStock:       initialData?.minStock ?? 5,
    reorderPoint:   initialData?.reorderPoint ?? 10,
    safetyStock:    initialData?.safetyStock ?? 0,
    reorderQty:     initialData?.reorderQty ?? 0,
    leadTimeDays:   initialData?.leadTimeDays ?? 0,
    isFlashSale:    initialData?.isFlashSale ?? false,
    isFeatured:     initialData?.isFeatured ?? false,
    isBestSeller:   initialData?.isBestSeller ?? false,
    description:    initialData?.description || '',
    shortDesc:      initialData?.shortDesc || '',
    videoUrl:       initialData?.videoUrl || '',
    seoTitle:       initialData?.seoTitle || '',
    metaDescription:initialData?.metaDescription || '',
    slug:           initialData?.slug || '',
    images:         initialData?.images || [],
    productSpecs:   initialData?.productSpecs?.length ? initialData.productSpecs : [{ id: '1', key: '', value: '' }],
    attributes:     initialData?.attributes || [],
    variants:       initialData?.variants || [],
  };

  const result = productSchema.safeParse(formData);
  if (!result.success) {
    console.log("Validation failed:");
    console.log(JSON.stringify(result.error.format(), null, 2));
  } else {
    console.log("Validation succeeded!");
  }
}

test().catch(console.error).finally(() => prisma.$disconnect());
