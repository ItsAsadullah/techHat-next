const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        await prisma.$queryRawUnsafe('SELECT "createdAt" FROM products LIMIT 1');
        console.log("products has createdAt");
    } catch(e) {
        console.log("products createdAt failed", e.message);
    }
    
    try {
        await prisma.$queryRawUnsafe('SELECT "created_at" FROM products LIMIT 1');
        console.log("products has created_at");
    } catch(e) {
        console.log("products created_at failed", e.message);
    }
}
main().finally(() => prisma.$disconnect());
