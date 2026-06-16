const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Applying Accounting Phase 1 Schema Additions...');

  const queries = [
    `CREATE TABLE IF NOT EXISTS "public"."fiscal_years" (
      "id" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "start_date" TIMESTAMP(3) NOT NULL,
      "end_date" TIMESTAMP(3) NOT NULL,
      "is_closed" BOOLEAN NOT NULL DEFAULT false,
      "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "fiscal_years_pkey" PRIMARY KEY ("id")
    );`,

    `CREATE UNIQUE INDEX IF NOT EXISTS "fiscal_years_name_key" ON "public"."fiscal_years"("name");`,

    `CREATE TABLE IF NOT EXISTS "public"."accounting_periods" (
      "id" TEXT NOT NULL,
      "fiscal_year_id" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "start_date" TIMESTAMP(3) NOT NULL,
      "end_date" TIMESTAMP(3) NOT NULL,
      "is_closed" BOOLEAN NOT NULL DEFAULT false,
      "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "accounting_periods_pkey" PRIMARY KEY ("id")
    );`,

    `ALTER TABLE "public"."journal_entries" ADD COLUMN IF NOT EXISTS "accounting_period_id" TEXT;`,

    `ALTER TABLE "public"."journal_entry_items" ADD COLUMN IF NOT EXISTS "description" TEXT;`,
  ];

  for (const q of queries) {
    try {
      await prisma.$executeRawUnsafe(q);
      console.log('Executed block.');
    } catch (err) {
      console.error('Error executing query:', err.message);
    }
  }

  // Generate Prisma Client
  const { execSync } = require('child_process');
  execSync('npx prisma generate', { stdio: 'inherit' });

  console.log('Done!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
