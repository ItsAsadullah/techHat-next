const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function removeHook() {
  try {
    await prisma.$executeRawUnsafe(`DROP FUNCTION IF EXISTS public.custom_access_token_hook(jsonb) CASCADE;`);
    console.log("Hook function dropped!");
  } catch (error) {
    console.error("Error dropping hook:", error);
  } finally {
    await prisma.$disconnect();
  }
}

removeHook();
