import { prisma } from './lib/prisma';
async function main() {
  const email = 'techhat.shop@gmail.com';
  let user = await prisma.user.findFirst({ where: { email } });
  
  if (user) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { role: 'SUPER_ADMIN' }
    });
    console.log('Updated existing user to SUPER_ADMIN:', user);
  } else {
    user = await prisma.user.create({
      data: {
        id: '2d513c5e-8f7a-4eca-b456-dea31d0bc22a', // Using the exact ID from auth.users
        email: email,
        fullName: 'TechHat Admin',
        role: 'SUPER_ADMIN'
      }
    });
    console.log('Created new SUPER_ADMIN user:', user);
  }
}
main().catch(console.error).finally(() => process.exit(0));
