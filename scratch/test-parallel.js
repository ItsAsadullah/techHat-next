const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testParallel() {
  console.log("Starting parallel test...");
  const start = Date.now();
  
  const getProductsPromise = (async () => {
    console.log("Starting getProducts...");
    const products = await prisma.product.findMany({
      take: 20,
      orderBy: { createdAt: 'desc' },
      select: {
          id: true,
          variants: { select: { id: true }, take: 5 }
      }
    });
    console.log(`getProducts finished: ${products.length} products`);
    return products;
  })();

  const getInventoryStatsPromise = (async () => {
    console.log("Starting getInventoryStats...");
    const results = await Promise.all([
        prisma.$queryRaw`
            SELECT
                COUNT(*) FILTER (WHERE stock > 0 AND stock <= COALESCE("minStock", 5))::int AS low_stock,
                COALESCE(SUM(COALESCE("costPrice", 0) * GREATEST(stock, 0)), 0)::float8 AS total_value
            FROM "products"
        `,
        prisma.product.count(),
        prisma.product.count({ where: { stock: { lte: 0 } } }),
    ]);
    console.log(`getInventoryStats finished`);
    return results;
  })();

  const getCachedCategoriesPromise = (async () => {
    console.log("Starting getCachedCategories...");
    const res = await prisma.category.findMany({ take: 20 });
    console.log(`getCachedCategories finished`);
    return res;
  })();

  const getCachedBrandsPromise = (async () => {
    console.log("Starting getCachedBrands...");
    const res = await prisma.brand.findMany({ take: 20 });
    console.log(`getCachedBrands finished`);
    return res;
  })();

  await Promise.all([
    getProductsPromise,
    getInventoryStatsPromise,
    getCachedCategoriesPromise,
    getCachedBrandsPromise
  ]);
  
  console.log(`Parallel test finished in ${Date.now() - start}ms`);
  await prisma.$disconnect();
}

testParallel().catch(console.error);
