import { prisma } from './lib/prisma';
async function main() {
  const users = await prisma.$queryRawUnsafe(`SELECT id, email, raw_app_meta_data FROM auth.users`);
  console.log(users);
}
main().catch(console.error).finally(() => process.exit(0));
