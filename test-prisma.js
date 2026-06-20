const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    console.log("Testing with empty where...");
    const p1 = await prisma.product.findMany({
      where: {},
      take: 2,
    });
    console.log("Empty where success:", p1.length);

    console.log("Testing with query...");
    const p2 = await prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: 'a', mode: 'insensitive' } },
          { sku: { contains: 'a', mode: 'insensitive' } },
        ]
      },
      take: 2,
    });
    console.log("Query where success:", p2.length);
  } catch (e) {
    console.error("Error:", e);
  } finally {
    await prisma.$disconnect();
  }
}

test();
