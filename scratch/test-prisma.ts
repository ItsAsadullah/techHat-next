import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function test() {
  try {
    await prisma.product.update({
      where: { id: "1b402157-be8b-4afc-a2c8-36c4e78fb36e" },
      data: {
        name: "Test Variable Product",
        categoryId: "b6838022-5a47-4fb8-b5c1-428b2a67ef59",
      } as any
    });
    console.log("Success");
  } catch (err: any) {
    console.error(err.message);
  } finally {
    await prisma.$disconnect();
  }
}

test();
