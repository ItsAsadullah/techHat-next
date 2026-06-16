const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixHookGrants() {
  try {
    await prisma.$executeRawUnsafe(`GRANT EXECUTE ON FUNCTION public.custom_access_token_hook(jsonb) TO supabase_auth_admin;`);
    await prisma.$executeRawUnsafe(`GRANT EXECUTE ON FUNCTION public.custom_access_token_hook(jsonb) TO postgres;`);
    await prisma.$executeRawUnsafe(`GRANT EXECUTE ON FUNCTION public.custom_access_token_hook(jsonb) TO authenticated;`);
    await prisma.$executeRawUnsafe(`GRANT EXECUTE ON FUNCTION public.custom_access_token_hook(jsonb) TO anon;`);
    await prisma.$executeRawUnsafe(`REVOKE ALL ON FUNCTION public.custom_access_token_hook(jsonb) FROM PUBLIC;`);
    console.log("Grants added!");
  } catch (error) {
    console.error("Error adding grants:", error);
  } finally {
    await prisma.$disconnect();
  }
}

fixHookGrants();
