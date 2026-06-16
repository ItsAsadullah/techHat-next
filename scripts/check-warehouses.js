const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkWarehouses() {
  const count = await prisma.warehouse.count();
  console.log("Total Warehouses:", count);
  if (count === 0) {
    console.log("Creating default warehouse...");
    await prisma.warehouse.create({
      data: {
        name: 'Main Warehouse',
        code: 'WH-MAIN',
        address: 'Dhaka HQ',
        isActive: true,
      }
    });
    console.log("Main Warehouse created!");
  } else {
    const list = await prisma.warehouse.findMany();
    console.log("Warehouses:", list);
  }
  await prisma.$disconnect();
}
checkWarehouses();
