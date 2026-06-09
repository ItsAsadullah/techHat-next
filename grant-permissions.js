const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function grantPermissions() {
  console.log("Granting permissions...");
  
  await prisma.$executeRawUnsafe('GRANT USAGE ON SCHEMA public TO service_role, anon, authenticated;');
  await prisma.$executeRawUnsafe('GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO service_role, postgres;');
  await prisma.$executeRawUnsafe('GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO service_role, postgres;');
  await prisma.$executeRawUnsafe('ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role, postgres;');
  
  console.log("Permissions granted!");
}

grantPermissions().catch(console.error).finally(() => prisma.$disconnect());
