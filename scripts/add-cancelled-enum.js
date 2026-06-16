const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.$executeRaw`ALTER TYPE "PurchaseReturnStatus" ADD VALUE IF NOT EXISTS 'CANCELLED'`;
    console.log('✅ CANCELLED added to PurchaseReturnStatus enum');
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
