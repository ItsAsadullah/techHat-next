const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const items = await prisma.orderItem.findMany({ where: { order: { orderNumber: 'TH-2026-000020' } } });
  console.log('Items found in DB:', items.length);
  console.log(items);
}

check().catch(console.error).finally(() => prisma.$disconnect());
