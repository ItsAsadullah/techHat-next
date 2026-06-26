import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

async function main() {
  console.log('Dumping POSCustomer mappings...');

  try {
    const posCustomers = await prisma.$queryRaw<any[]>`SELECT * FROM "pos_customers"`;
    
    // Get all orders with pos_customer_id
    const orders = await prisma.$queryRaw<any[]>`SELECT id, pos_customer_id FROM "orders" WHERE pos_customer_id IS NOT NULL`;
    
    const dumpData = {
      posCustomers,
      orders
    };
    
    fs.writeFileSync('migration_dump.json', JSON.stringify(dumpData, null, 2));
    console.log(`Dumped ${posCustomers.length} customers and ${orders.length} orders.`);
  } catch (err) {
    console.error('Failed to dump data:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
