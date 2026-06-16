const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function deleteAdmin() {
  try {
    // Delete from public.users first
    await prisma.user.deleteMany({
      where: { email: 'techhat.shop@gmail.com' }
    });
    console.log("Deleted from public.users");
    
    // Delete from auth.users using raw SQL
    await prisma.$executeRawUnsafe(`DELETE FROM auth.users WHERE email = 'techhat.shop@gmail.com'`);
    console.log("Deleted from auth.users");
  } catch (error) {
    console.error("Error deleting user:", error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteAdmin();
