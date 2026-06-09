const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: { id: true, orderNumber: true, createdAt: true, items: { select: { productName: true } } }
  });
  console.log("Recent Orders:");
  console.dir(orders, { depth: null });
}

check().catch(console.error).finally(() => prisma.$disconnect());
