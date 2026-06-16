const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const res = await prisma.$queryRawUnsafe(`
        SELECT data_type 
        FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'status'
    `);
    console.log(res);
}
main().finally(() => prisma.$disconnect());
