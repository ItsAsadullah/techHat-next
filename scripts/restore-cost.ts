import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const variants = await prisma.variant.findMany({ where: { stock: { gt: 0 }, costPrice: 0 } });
  let count = 0;
  for (const v of variants) {
    const lastLedger = await prisma.stockLedger.findFirst({
      where: { variantId: v.id, unitCost: { gt: 0 } },
      orderBy: { createdAt: 'desc' }
    });
    if (lastLedger) {
      await prisma.variant.update({ where: { id: v.id }, data: { costPrice: lastLedger.unitCost } });
      console.log('Restored costPrice for', v.name, 'to', lastLedger.unitCost);
      count++;
    }
  }
  console.log(`Restored ${count} variants.`);
}
main().catch(console.error).finally(() => prisma.$disconnect());
