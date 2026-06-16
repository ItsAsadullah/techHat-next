const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkProducts() {
  const count = await prisma.product.count();
  console.log("Total Products:", count);
  
  if (count > 0) {
    const products = await prisma.product.findMany({
      take: 2,
      select: {
        id: true,
        name: true,
        isActive: true
      }
    });
    console.log("Sample:", products);
  }
  
  await prisma.$disconnect();
}

checkProducts();
