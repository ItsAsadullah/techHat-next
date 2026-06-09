const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function dropWebhook() {
  console.log("Dropping trigger...");
  await prisma.$executeRawUnsafe(`DROP TRIGGER IF EXISTS trg_new_order_telegram ON orders;`);
  
  console.log("Dropping function...");
  await prisma.$executeRawUnsafe(`DROP FUNCTION IF EXISTS notify_telegram_on_new_order();`);

  console.log("Webhook removed!");
}

dropWebhook().catch(console.error).finally(() => prisma.$disconnect());
