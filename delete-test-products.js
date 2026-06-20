const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const products = await prisma.product.findMany({ where: { name: { contains: 'Test' } } });
  console.log('Found', products.length, 'test products.');
  for (const p of products) {
    console.log('Deleting', p.name, p.id);
    // Delete non-cascading relations forcefully
    await prisma.orderItem.deleteMany({ where: { productId: p.id } });
    await prisma.returnItem.deleteMany({ where: { productId: p.id } });
    await prisma.purchaseOrderItem.deleteMany({ where: { productId: p.id } });
    await prisma.purchaseReturnItem.deleteMany({ where: { productId: p.id } });
    await prisma.goodsReceiveNoteItem.deleteMany({ where: { productId: p.id } });
    await prisma.warehouseTransferItem.deleteMany({ where: { productId: p.id } });
    await prisma.stockAdjustmentItem.deleteMany({ where: { productId: p.id } });
    await prisma.stockLedger.deleteMany({ where: { productId: p.id } });
    await prisma.supplierProduct.deleteMany({ where: { productId: p.id } });
    
    // Now delete product
    await prisma.product.delete({ where: { id: p.id } });
  }
  console.log('Deleted successfully.');
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
