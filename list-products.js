const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.product.findMany().then(products => console.log(products.map(p => p.name))).finally(()=>prisma.$disconnect());
