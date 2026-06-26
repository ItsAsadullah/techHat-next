import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('OrderItems:', await prisma.orderItem.count());
  console.log('Categories:', await prisma.category.count());
  console.log('Brands:', await prisma.brand.count());
  console.log('Specs (Table):', await prisma.productSpec.count());
  console.log('Orders:', await prisma.order.count());
  
  const products = await prisma.product.findMany({ select: { name: true, slug: true }});
  console.log('Slugs:', products.map(p => p.slug));
}
main().catch(console.error).finally(() => prisma.$disconnect());
