const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkInsert() {
  try {
    await prisma.$executeRawUnsafe(`
      INSERT INTO public.users (id, email, "fullName", "avatarUrl", role)
      VALUES (
        gen_random_uuid()::TEXT,
        'test_insert_trigger@example.com',
        'Test Name',
        '',
        'USER'::"Role"
      )
    `);
    console.log("Insert successful!");
  } catch (error) {
    console.error("Insert failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkInsert();
