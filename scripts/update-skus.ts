import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting SKU update...');
  
  // Update Products
  const products = await prisma.product.findMany();
  let productUpdates = 0;
  
  for (const product of products) {
    if (!product.sku || !product.sku.startsWith('TH-')) {
      const model = product.model ? product.model.replace(/\s+/g, '-').toUpperCase() : product.name.substring(0, 3).toUpperCase();
      const serial = product.id.substring(0, 5).toUpperCase();
      const newSku = `TH-${model}-${serial}`;
      
      await prisma.product.update({
        where: { id: product.id },
        data: { sku: newSku }
      });
      productUpdates++;
      console.log(`Updated Product: ${product.name} -> SKU: ${newSku}`);
    }
  }

  // Update Variants
  const variants = await prisma.variant.findMany({
    include: { product: true }
  });
  let variantUpdates = 0;

  for (const variant of variants) {
    if (!variant.sku || !variant.sku.startsWith('TH-')) {
      const productModel = variant.product.model ? variant.product.model.replace(/\s+/g, '-').toUpperCase() : variant.product.name.substring(0, 3).toUpperCase();
      const variantName = variant.name.replace(/\s+/g, '-').toUpperCase();
      const serial = variant.id.substring(0, 5).toUpperCase();
      const newSku = `TH-${productModel}-${variantName}-${serial}`;
      
      await prisma.variant.update({
        where: { id: variant.id },
        data: { sku: newSku }
      });
      variantUpdates++;
      console.log(`Updated Variant: ${variant.name} -> SKU: ${newSku}`);
    }
  }

  console.log(`Update complete! Products updated: ${productUpdates}, Variants updated: ${variantUpdates}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
