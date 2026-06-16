const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkPOs() {
  const pos = await prisma.purchaseOrder.findMany({
    select: { poNumber: true, status: true }
  });
  console.log(pos);
  await prisma.$disconnect();
}
checkPOs();
