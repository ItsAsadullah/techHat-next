const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkTrigger() {
  const result = await prisma.$queryRaw`
    SELECT pg_get_functiondef(oid)
    FROM pg_proc
    WHERE proname = 'handle_new_user';
  `;
  console.log(result);
  await prisma.$disconnect();
}

checkTrigger();
