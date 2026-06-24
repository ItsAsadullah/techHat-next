import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting SKU update process...');
  
  // Get all products ordered by creation date
  const products = await prisma.product.findMany({
    orderBy: {
      createdAt: 'asc'
    }
  });

  console.log(`Found ${products.length} products to update.`);

  let counter = 1;
  for (const product of products) {
    const cleanModel = product.model ? product.model.replace(/[^a-zA-Z0-9-]/g, '').toUpperCase() : '';
    
    // Build prefix
    const prefixParts = ['TH'];
    if (cleanModel) prefixParts.push(cleanModel);
    
    const prefix = prefixParts.join('-');

    // 4 digits keeps the barcode short and clean
    const paddedNum = String(counter).padStart(4, '0');
    const newSku = `${prefix}-${paddedNum}`;

    // Update product sku and barcode
    // Some products might have variants, but user asked for "all products sku". 
    // Usually barcode is synced with SKU.
    await prisma.product.update({
      where: { id: product.id },
      data: {
        sku: newSku,
        barcode: newSku // Syncing barcode as well
      }
    });

    console.log(`Updated Product: ${product.name} -> SKU: ${newSku}`);
    counter++;
  }

  console.log('Finished updating all SKUs.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
