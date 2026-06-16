const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');

const prisma = new PrismaClient();

async function main() {
  console.log('Applying Customer Phase 3 Schema Additions...');

  try {
    const rawSqls = [
      `
      CREATE TABLE IF NOT EXISTS "customers" (
          "id" TEXT NOT NULL,
          "customer_code" TEXT NOT NULL,
          "name" TEXT NOT NULL,
          "phone" TEXT,
          "email" TEXT,
          "address" TEXT,
          "company_name" TEXT,
          "tax_id" TEXT,
          "customerGroup" TEXT NOT NULL DEFAULT 'RETAIL',
          "opening_balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
          "balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
          "credit_limit" DOUBLE PRECISION NOT NULL DEFAULT 0,
          "status" TEXT NOT NULL DEFAULT 'ACTIVE',
          "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

          CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
      );
      `,
      `
      CREATE UNIQUE INDEX IF NOT EXISTS "customers_customer_code_key" ON "customers"("customer_code");
      `,
      `
      CREATE TABLE IF NOT EXISTS "customer_ledgers" (
          "id" TEXT NOT NULL,
          "customer_id" TEXT NOT NULL,
          "type" TEXT NOT NULL,
          "debit" DOUBLE PRECISION NOT NULL DEFAULT 0,
          "credit" DOUBLE PRECISION NOT NULL DEFAULT 0,
          "running_balance" DOUBLE PRECISION NOT NULL,
          "reference_id" TEXT,
          "note" TEXT,
          "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

          CONSTRAINT "customer_ledgers_pkey" PRIMARY KEY ("id")
      );
      `,
      `
      CREATE INDEX IF NOT EXISTS "customer_ledgers_customer_id_idx" ON "customer_ledgers"("customer_id");
      `,
      `
      ALTER TABLE "customer_ledgers" DROP CONSTRAINT IF EXISTS "customer_ledgers_customer_id_fkey";
      `,
      `
      ALTER TABLE "customer_ledgers" ADD CONSTRAINT "customer_ledgers_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      `,
      `
      ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "customer_id" TEXT;
      `,
      `
      ALTER TABLE "orders" DROP CONSTRAINT IF EXISTS "orders_customer_id_fkey";
      `,
      `
      ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
      `
    ];

    for (const sql of rawSqls) {
      await prisma.$executeRawUnsafe(sql);
      console.log('Executed block.');
    }

    console.log('SQL Migration complete! Generating Prisma Client...');
    
    try {
      execSync('npx prisma generate', { stdio: 'inherit' });
    } catch (e) {
      console.error('Warning: Prisma generate failed, likely due to file locks by next.js server.', e.message);
    }

    console.log('Done!');
  } catch (error) {
    console.error('Error during migration:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
