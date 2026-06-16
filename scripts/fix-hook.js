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
        declare
          claims jsonb;
          user_role text;
        begin
          if coalesce((event->'claims'->'app_metadata'->>'app_role'), '') = 'admin' then
            return event;
          end if;

          claims := event->'claims';

          if event->>'claims' is not null then
            select role::text into user_role from public.users where id = (event->>'user_id')::text;

            if coalesce(user_role, '') = 'SUPER_ADMIN' or coalesce(user_role, '') = 'ADMIN' or coalesce(user_role, '') = 'MANAGER' then
              claims := jsonb_set(claims, '{app_metadata, app_role}', '"admin"');
            else
              claims := jsonb_set(claims, '{app_metadata, app_role}', '"customer"');
            end if;

            event := jsonb_set(event, '{claims}', claims);
          end if;

          return event;
        end;
      $function$;
    `);
    console.log("Hook function recreated with proper casting!");
  } catch (error) {
    console.error("Error recreating hook:", error);
  } finally {
    await prisma.$disconnect();
  }
}

fixHook();
