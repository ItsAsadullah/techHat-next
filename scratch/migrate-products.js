const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Migrating products table...");
    try {
        await prisma.$executeRawUnsafe(`
            ALTER TABLE products 
            ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN DEFAULT true;
        `);
        console.log("Successfully added isActive column.");
        
        // Optional: migrate data from status to isActive
        await prisma.$executeRawUnsafe(`
            UPDATE products 
            SET "isActive" = (status = 'ACTIVE')
            WHERE status IS NOT NULL;
        `);
        console.log("Successfully migrated status data to isActive.");
    } catch(e) {
        console.error("Migration failed:", e.message);
    }
}
main().finally(() => prisma.$disconnect());
