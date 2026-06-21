import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.findMany({ include: { variants: true } });
  let count = 0;
  for (const p of products) {
    if (p.variants.length > 0) {
      const validPrices = p.variants.map(v => v.price).filter(p => p > 0);
      const minPrice = validPrices.length > 0 ? Math.min(...validPrices) : 0;
      
      const validOffers = p.variants.map(v => v.offerPrice).filter(p => p && p > 0);
      const minOfferPrice = validOffers.length > 0 ? Math.min(...validOffers as number[]) : null;

      if ((minPrice > 0 && p.price !== minPrice) || (minOfferPrice !== null && p.offerPrice !== minOfferPrice)) {
        await prisma.product.update({ 
          where: { id: p.id }, 
          data: { price: minPrice, offerPrice: minOfferPrice } 
        });
        console.log(`Updated ${p.name} price to ${minPrice}`);
        count++;
      }
    }
  }
  console.log(`Fixed ${count} products.`);
}
main().catch(console.error).finally(() => prisma.$disconnect());
