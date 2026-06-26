import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Running manual schema migration...');

  try {
    // Customer table
    await prisma.$executeRawUnsafe(`ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "last_payment_date" TIMESTAMP(3);`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "credit_score" INTEGER DEFAULT 100;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "credit_rating" TEXT DEFAULT 'GOOD';`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "payment_score" DOUBLE PRECISION DEFAULT 0;`);
    console.log('Customer table updated.');

    // CustomerPayment table
    await prisma.$executeRawUnsafe(`ALTER TABLE "customer_payments" ADD COLUMN IF NOT EXISTS "receipt_number" TEXT UNIQUE;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "customer_payments" ADD COLUMN IF NOT EXISTS "collection_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "customer_payments" ADD COLUMN IF NOT EXISTS "remarks" TEXT;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "customer_payments" ADD COLUMN IF NOT EXISTS "collector" TEXT;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "customer_payments" ADD COLUMN IF NOT EXISTS "cash_amount" DOUBLE PRECISION NOT NULL DEFAULT 0;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "customer_payments" ADD COLUMN IF NOT EXISTS "bkash_amount" DOUBLE PRECISION NOT NULL DEFAULT 0;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "customer_payments" ADD COLUMN IF NOT EXISTS "nagad_amount" DOUBLE PRECISION NOT NULL DEFAULT 0;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "customer_payments" ADD COLUMN IF NOT EXISTS "rocket_amount" DOUBLE PRECISION NOT NULL DEFAULT 0;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "customer_payments" ADD COLUMN IF NOT EXISTS "card_amount" DOUBLE PRECISION NOT NULL DEFAULT 0;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "customer_payments" ADD COLUMN IF NOT EXISTS "bank_amount" DOUBLE PRECISION NOT NULL DEFAULT 0;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "customer_payments" ADD COLUMN IF NOT EXISTS "cheque_amount" DOUBLE PRECISION NOT NULL DEFAULT 0;`);
    console.log('CustomerPayment table updated.');

    console.log('Migration successful.');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
