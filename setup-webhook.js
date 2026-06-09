const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createWebhook() {
  console.log("Enabling pg_net...");
  await prisma.$executeRawUnsafe(`CREATE EXTENSION IF NOT EXISTS pg_net;`);

  console.log("Creating webhook function...");
  await prisma.$executeRawUnsafe(`
    CREATE OR REPLACE FUNCTION notify_telegram_on_new_order()
    RETURNS trigger AS $$
    DECLARE
      payload jsonb;
      function_url text := 'https://xkqzlwhkagsrqpmfuhzp.supabase.co/functions/v1/telegram-order-notification';
    BEGIN
      payload := jsonb_build_object(
        'type', 'INSERT',
        'table', TG_TABLE_NAME,
        'schema', TG_TABLE_SCHEMA,
        'record', row_to_json(NEW),
        'old_record', NULL
      );

      PERFORM net.http_post(
        url       := function_url,
        headers   := '{"Content-Type": "application/json", "x-webhook-secret": "techhat-wh-secret-2026"}'::jsonb,
        body      := payload::text
      );

      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
  `);

  console.log("Creating trigger...");
  await prisma.$executeRawUnsafe(`DROP TRIGGER IF EXISTS trg_new_order_telegram ON orders;`);
  await prisma.$executeRawUnsafe(`
    CREATE TRIGGER trg_new_order_telegram
      AFTER INSERT ON orders
      FOR EACH ROW
      EXECUTE FUNCTION notify_telegram_on_new_order();
  `);

  console.log("Webhook created successfully via SQL!");
}

createWebhook().catch(console.error).finally(() => prisma.$disconnect());
