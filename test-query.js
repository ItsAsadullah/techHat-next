const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  const query = 'Apple';
  const products = await prisma.product.findMany({
    where: query ? {
      OR: [
        { name: { contains: query } },
        { sku: { contains: query } },
      ]
    } : {},
    take: 50,
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      sku: true,
      costPrice: true,
      images: {
        take: 1,
        select: { url: true }
      },
      variants: {
        select: {
          id: true,
          name: true,
          sku: true,
          costPrice: true,
          images: {
            take: 1,
            select: { url: true }
          }
        }
      }
    }
  });
  console.log("Products found:", products.length);
}
test().finally(()=>prisma.$disconnect());
