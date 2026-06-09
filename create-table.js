const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createTable() {
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "order_events" (
          "id" TEXT NOT NULL,
          "order_id" TEXT NOT NULL,
          "event_type" TEXT NOT NULL,
          "old_status" TEXT,
          "new_status" TEXT,
          "old_payment_status" TEXT,
          "new_payment_status" TEXT,
          "changed_by" TEXT,
          "note" TEXT,
          "metadata" JSONB,
          "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "order_events_pkey" PRIMARY KEY ("id")
      );
    `);
    
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "order_events_order_id_idx" ON "order_events"("order_id");
    `);

    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "order_events" ADD CONSTRAINT "order_events_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      `);
    } catch (e) {
      console.log("FK constraint might already exist:", e.message);
    }
    
    console.log("order_events table created successfully.");
  } catch (e) {
    console.error("Error creating table:", e.message);
  } finally {
    await prisma.$disconnect();
  }
}

createTable();
