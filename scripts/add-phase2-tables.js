const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Running raw SQL to create Phase 2 tables...');

  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "stock_reservations" (
        "id" TEXT NOT NULL,
        "product_id" TEXT NOT NULL,
        "variant_id" TEXT,
        "referenceType" TEXT NOT NULL,
        "reference_id" TEXT NOT NULL,
        "quantity" INTEGER NOT NULL,
        "expires_at" TIMESTAMP(3) NOT NULL,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT "stock_reservations_pkey" PRIMARY KEY ("id")
      );
    `);
    console.log('Created stock_reservations');

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "stock_reservations_product_id_variant_id_idx" ON "stock_reservations"("product_id", "variant_id");
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "stock_reservations_reference_id_idx" ON "stock_reservations"("reference_id");
    `);
    console.log('Created indexes for stock_reservations');

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "supplier_ledgers" (
        "id" TEXT NOT NULL,
        "supplier_id" TEXT NOT NULL,
        "type" TEXT NOT NULL,
        "debit" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "credit" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "running_balance" DOUBLE PRECISION NOT NULL,
        "reference_id" TEXT,
        "note" TEXT,
        "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT "supplier_ledgers_pkey" PRIMARY KEY ("id")
      );
    `);
    console.log('Created supplier_ledgers');

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "supplier_ledgers_supplier_id_idx" ON "supplier_ledgers"("supplier_id");
    `);
    console.log('Created indexes for supplier_ledgers');

    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "supplier_ledgers" ADD CONSTRAINT "supplier_ledgers_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      `);
      console.log('Added foreign key for supplier_ledgers');
    } catch (e) {
      console.log('Foreign key might already exist:', e.message);
    }

    console.log('Done!');
  } catch (error) {
    console.error('Error applying SQL:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
