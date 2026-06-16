const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.xkqzlwhkagsrqpmfuhzp:TechHat%40321@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

const migrations = [
  {
    name: 'Add STORE to WarehouseType enum',
    sql: `ALTER TYPE "WarehouseType" ADD VALUE IF NOT EXISTS 'STORE'`
  },
  {
    name: 'Add TRANSIT to WarehouseType enum',
    sql: `ALTER TYPE "WarehouseType" ADD VALUE IF NOT EXISTS 'TRANSIT'`
  },
  {
    name: 'Add cost_price to order_items',
    sql: `ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "cost_price" DOUBLE PRECISION NOT NULL DEFAULT 0`
  },
  {
    name: 'Add unit_cost to goods_receive_note_items',
    sql: `ALTER TABLE "goods_receive_note_items" ADD COLUMN IF NOT EXISTS "unit_cost" DOUBLE PRECISION NOT NULL DEFAULT 0`
  },
  {
    name: 'Add barcode to product_variants',
    sql: `ALTER TABLE "product_variants" ADD COLUMN IF NOT EXISTS "barcode" TEXT`
  },
  {
    name: 'Add weight to product_variants',
    sql: `ALTER TABLE "product_variants" ADD COLUMN IF NOT EXISTS "weight" DOUBLE PRECISION`
  },
  {
    name: 'Add width to product_variants',
    sql: `ALTER TABLE "product_variants" ADD COLUMN IF NOT EXISTS "width" DOUBLE PRECISION`
  },
  {
    name: 'Add height to product_variants',
    sql: `ALTER TABLE "product_variants" ADD COLUMN IF NOT EXISTS "height" DOUBLE PRECISION`
  },
  {
    name: 'Add depth to product_variants',
    sql: `ALTER TABLE "product_variants" ADD COLUMN IF NOT EXISTS "depth" DOUBLE PRECISION`
  },
  {
    name: 'Add supplier_id to supplier_products',
    sql: `ALTER TABLE "supplier_products" ADD COLUMN IF NOT EXISTS "supplier_id" TEXT`
  },
  {
    name: 'Add unit_cost to supplier_products',
    sql: `ALTER TABLE "supplier_products" ADD COLUMN IF NOT EXISTS "unit_cost" DOUBLE PRECISION NOT NULL DEFAULT 0`
  },
  {
    name: 'Add FK constraint for supplier_products.supplier_id',
    sql: `ALTER TABLE "supplier_products" ADD CONSTRAINT "supplier_products_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE SET NULL`
  },
  {
    name: 'Create stock_ledgers date index',
    sql: `CREATE INDEX IF NOT EXISTS "stock_ledgers_date_idx" ON "stock_ledgers"("date")`
  },
  {
    name: 'Create stock_ledgers warehouse_date index',
    sql: `CREATE INDEX IF NOT EXISTS "stock_ledgers_warehouse_date_idx" ON "stock_ledgers"("warehouse_id", "date")`
  },
  {
    name: 'Create supplier_products supplier_id index',
    sql: `CREATE INDEX IF NOT EXISTS "supplier_products_supplier_id_idx" ON "supplier_products"("supplier_id")`
  },
];

async function run() {
  await client.connect();
  console.log('✅ Connected to database');
  console.log('Starting Phase 0 Enterprise Migration...\n');

  let success = 0;
  let skipped = 0;

  for (const m of migrations) {
    try {
      await client.query(m.sql);
      console.log(`✅ ${m.name}`);
      success++;
    } catch (err) {
      if (err.message.includes('already exists') || err.message.includes('duplicate')) {
        console.log(`⏭️  SKIP (already exists): ${m.name}`);
        skipped++;
      } else {
        console.log(`❌ ERROR: ${m.name}`);
        console.log(`   ${err.message}`);
        skipped++;
      }
    }
  }

  console.log(`\n📊 Migration Result: ${success} applied, ${skipped} skipped`);
  await client.end();
}

run().catch(e => {
  console.error('Fatal migration error:', e.message);
  process.exit(1);
});
