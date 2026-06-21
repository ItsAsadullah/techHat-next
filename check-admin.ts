import { prisma } from './lib/prisma';
async function main() {
  const user = await prisma.user.findFirst({
    where: { email: { contains: 'techhat.shop@gmail.com', mode: 'insensitive' } },
  });
  console.log('User from DB:', user);
  const staff = await prisma.staff.findFirst({
    where: { email: { contains: 'techhat.shop@gmail.com', mode: 'insensitive' } },
  });
  console.log('Staff from DB:', staff);
}
main().catch(console.error).finally(() => process.exit(0));
