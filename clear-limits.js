const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clearLimits() {
  await prisma.$executeRawUnsafe('TRUNCATE TABLE ip_rate_limits;');
  console.log('IP Rate limits cleared!');
}

clearLimits().catch(console.error).finally(() => prisma.$disconnect());
