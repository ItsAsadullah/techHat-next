const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const columns = await prisma.$queryRawUnsafe(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'products'
    `);
    console.log("Columns in products table:");
    console.log(columns.map(c => c.column_name).join(', '));
}
main().finally(() => prisma.$disconnect());
