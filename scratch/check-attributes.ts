import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const c1 = await prisma.attribute.count();
  const c2 = await prisma.attributeValue.count();
  const c3 = await prisma.categoryAttribute.count();
  console.log(`Attribute: ${c1}, AttributeValue: ${c2}, CategoryAttribute: ${c3}`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
