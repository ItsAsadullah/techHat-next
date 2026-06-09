const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function backfill() {
  const products = await prisma.product.findMany({
    select: { id: true, sku: true, model: true }
  });

  let updatedCount = 0;
  for (const p of products) {
    if (!p.model && p.sku) {
      // Extract model from SKU: usually the last segment after '-'
      const parts = p.sku.split('-');
      const model = parts[parts.length - 1];
      
      if (model) {
        await prisma.product.update({
          where: { id: p.id },
          data: { model }
        });
        updatedCount++;
      }
    }
  }
  console.log(`Backfilled model for ${updatedCount} products.`);
}

backfill()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
