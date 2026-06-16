const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Applying Phase 4-10 Schema Additions...');

  const queries = [
    `DO $$ BEGIN
      CREATE TYPE "public"."TransferStatus" AS ENUM ('DRAFT', 'APPROVED', 'IN_TRANSIT', 'RECEIVED', 'CANCELLED');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;`,

    `CREATE TABLE IF NOT EXISTS "public"."warehouse_transfers" (
      "id" TEXT NOT NULL,
      "transfer_number" TEXT NOT NULL,
      "source_id" TEXT NOT NULL,
      "destination_id" TEXT NOT NULL,
      "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "status" "public"."TransferStatus" NOT NULL DEFAULT 'DRAFT',
      "transfer_cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
      "note" TEXT,
      "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updated_at" TIMESTAMP(3) NOT NULL,
      CONSTRAINT "warehouse_transfers_pkey" PRIMARY KEY ("id")
    );`,

    `CREATE UNIQUE INDEX IF NOT EXISTS "warehouse_transfers_transfer_number_key" ON "public"."warehouse_transfers"("transfer_number");`,

    `CREATE TABLE IF NOT EXISTS "public"."warehouse_transfer_items" (
      "id" TEXT NOT NULL,
      "warehouse_transfer_id" TEXT NOT NULL,
      "product_id" TEXT NOT NULL,
      "variant_id" TEXT,
      "quantity" INTEGER NOT NULL,
      "received_qty" INTEGER NOT NULL DEFAULT 0,
      CONSTRAINT "warehouse_transfer_items_pkey" PRIMARY KEY ("id")
    );`,

    `DO $$ BEGIN
      CREATE TYPE "public"."AccountType" AS ENUM ('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;`,

    `CREATE TABLE IF NOT EXISTS "public"."chart_of_accounts" (
      "id" TEXT NOT NULL,
      "code" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "type" "public"."AccountType" NOT NULL,
      "is_system" BOOLEAN NOT NULL DEFAULT false,
      "balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
      CONSTRAINT "chart_of_accounts_pkey" PRIMARY KEY ("id")
    );`,

    `CREATE UNIQUE INDEX IF NOT EXISTS "chart_of_accounts_code_key" ON "public"."chart_of_accounts"("code");`,

    `CREATE TABLE IF NOT EXISTS "public"."journal_entries" (
      "id" TEXT NOT NULL,
      "entry_number" TEXT NOT NULL,
      "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "reference" TEXT,
      "note" TEXT,
      "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "journal_entries_pkey" PRIMARY KEY ("id")
    );`,

    `CREATE UNIQUE INDEX IF NOT EXISTS "journal_entries_entry_number_key" ON "public"."journal_entries"("entry_number");`,

    `CREATE TABLE IF NOT EXISTS "public"."journal_entry_items" (
      "id" TEXT NOT NULL,
      "journal_entry_id" TEXT NOT NULL,
      "account_id" TEXT NOT NULL,
      "debit" DOUBLE PRECISION NOT NULL DEFAULT 0,
      "credit" DOUBLE PRECISION NOT NULL DEFAULT 0,
      CONSTRAINT "journal_entry_items_pkey" PRIMARY KEY ("id")
    );`,
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
