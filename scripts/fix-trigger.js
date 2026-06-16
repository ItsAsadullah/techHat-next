const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixTrigger() {
  try {
    await prisma.$executeRawUnsafe(`
      CREATE OR REPLACE FUNCTION public.handle_new_user()
      RETURNS trigger
      LANGUAGE plpgsql
      SECURITY DEFINER
      SET search_path TO 'public'
      AS $function$
      BEGIN
        INSERT INTO public.users (id, email, "fullName", "avatarUrl", role, "updatedAt")
        VALUES (
          NEW.id::TEXT,
          NEW.email,
          COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
          COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
          'USER'::"Role",
          NOW()
        )
        ON CONFLICT (id) DO NOTHING;
        RETURN NEW;
      END;
      $function$;
    `);
    console.log("Trigger function updated!");
  } catch (error) {
    console.error("Error updating trigger:", error);
  } finally {
    await prisma.$disconnect();
  }
}

fixTrigger();
