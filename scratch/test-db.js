const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  console.log("Connecting...");
  const start = Date.now();
  
  console.log("Querying count...");
  const count = await prisma.product.count();
  console.log(`Count: ${count} in ${Date.now() - start}ms`);
  
  console.log("Querying categories...");
  const categories = await prisma.category.findMany({ take: 5 });
  console.log(`Categories: ${categories.length} in ${Date.now() - start}ms`);
  
  console.log("Running raw query...");
  const agg = await prisma.$queryRaw`
    SELECT
        COUNT(*) FILTER (WHERE stock > 0 AND stock <= COALESCE("minStock", 5))::int AS low_stock,
        COALESCE(SUM(COALESCE("costPrice", 0) * GREATEST(stock, 0)), 0)::float8 AS total_value
    FROM "products"
  `;
  console.log("Agg:", agg, `in ${Date.now() - start}ms`);
  
  await prisma.$disconnect();
}

test().catch(console.error);
