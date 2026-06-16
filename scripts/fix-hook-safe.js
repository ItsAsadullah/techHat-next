const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixHook() {
  try {
    await prisma.$executeRawUnsafe(`
      CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
      RETURNS jsonb
      LANGUAGE plpgsql
      STABLE
      AS $function$
        begin
          -- Safe hook that does nothing but return the event
          -- so that login never fails.
          return event;
        end;
      $function$;
    `);
    console.log("Hook function recreated safely!");
  } catch (error) {
    console.error("Error recreating hook:", error);
  } finally {
    await prisma.$disconnect();
  }
}

fixHook();
