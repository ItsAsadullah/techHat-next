// Run this: node scripts/apply-product-v3-migration.mjs
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Applying Product V3 Enterprise Migration...\n');

  try {
    // 1. Create enum
    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        CREATE TYPE "ProductLifecycleStatus" AS ENUM (
          'DRAFT','PENDING_REVIEW','PUBLISHED','ACTIVE',
          'ARCHIVED','DISCONTINUED','COMING_SOON','OUT_OF_STOCK'
        );
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);
    console.log('✓ Created ProductLifecycleStatus enum');

    // 2. Add columns to products
    const productCols = [
      `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "status" "ProductLifecycleStatus" NOT NULL DEFAULT 'DRAFT'`,
      `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "seoTitle" TEXT`,
      `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "metaDescription" TEXT`,
      `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "safetyStock" INTEGER NOT NULL DEFAULT 0`,
      `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "reorderQty" INTEGER NOT NULL DEFAULT 0`,
      `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "leadTimeDays" INTEGER NOT NULL DEFAULT 0`,
      `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "tags" TEXT[] NOT NULL DEFAULT '{}'`,
    ];
    for (const sql of productCols) {
      await prisma.$executeRawUnsafe(sql);
    }
    console.log('✓ Added new columns to products table');

    // 3. Create sku_sequences
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "sku_sequences" (
        "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
        "prefix" TEXT NOT NULL,
        "lastValue" INTEGER NOT NULL DEFAULT 0,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "sku_sequences_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "sku_sequences_prefix_key" UNIQUE ("prefix")
      )
    `);
    console.log('✓ Created sku_sequences table');

    // 4. Create product_audit_logs
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "product_audit_logs" (
        "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
        "product_id" TEXT NOT NULL,
        "action" TEXT NOT NULL,
        "changed_by" TEXT,
        "changed_fields" JSONB,
        "note" TEXT,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "product_audit_logs_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "product_audit_logs_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE
      )
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "product_audit_logs_product_id_created_at_idx"
      ON "product_audit_logs"("product_id", "created_at")
    `);
    console.log('✓ Created product_audit_logs table');

    // 5. Create supplier_products
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "supplier_products" (
        "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
        "product_id" TEXT NOT NULL,
        "supplier_name" TEXT NOT NULL,
        "supplier_sku" TEXT,
        "lead_time_days" INTEGER NOT NULL DEFAULT 7,
        "moq" INTEGER NOT NULL DEFAULT 1,
        "is_primary" BOOLEAN NOT NULL DEFAULT false,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "supplier_products_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "supplier_products_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE
      )
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "supplier_products_product_id_idx"
      ON "supplier_products"("product_id")
    `);
    console.log('✓ Created supplier_products table');

    console.log('\n✅ Product V3 Migration completed successfully!\n');
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
