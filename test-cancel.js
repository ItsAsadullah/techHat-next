const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testCancel() {
  const order = await prisma.order.findFirst({
    where: { status: 'PENDING' },
    include: { items: true }
  });

  if (!order) {
    console.log("No pending orders found.");
    return;
  }

  console.log(`Trying to cancel order: ${order.orderNumber}`);

  try {
    await prisma.$transaction(async (tx) => {
      for (const item of order.items) {
        if (item.variantId) {
          await tx.variant.update({ where: { id: item.variantId }, data: { stock: { increment: item.quantity } } });
        } else {
          await tx.product.update({ where: { id: item.productId }, data: { stock: { increment: item.quantity }, soldCount: { decrement: item.quantity } } });
        }
      }
      await tx.order.update({ where: { id: order.id }, data: { status: 'CANCELLED' } });
      console.log("Transaction succeeded (simulated).");
    });
  } catch (e) {
    console.error("Error during transaction:", e.message);
  } finally {
    await prisma.$disconnect();
  }
}

testCancel();
