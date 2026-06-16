const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkHook() {
  const result = await prisma.$queryRaw`
    SELECT pg_get_functiondef(oid)
    FROM pg_proc
    WHERE proname = 'custom_access_token_hook';
  `;
  console.log(result);
  await prisma.$disconnect();
}

checkHook();
