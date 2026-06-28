import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

async function main() {
  console.log('Restoring Customer mappings...');

  try {
    const raw = fs.readFileSync('./id-dump.json', 'utf8');
    const { customers, orders } = JSON.parse(raw);
    
    console.log(`Loaded ${customers.length} customers and ${orders.length} orders from dump.`);

    for (const pc of customers) {
      let customerId;
      const existing: any[] = await prisma.$queryRaw`SELECT id FROM "customers" WHERE phone = ${pc.phone}`;
      
      if (existing.length > 0) {
        customerId = existing[0].id;
      } else {
        const newId = crypto.randomUUID();
        const code = `CUST-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;
        
        await prisma.$executeRaw`
          INSERT INTO "customers" (
            id, customer_code, name, phone, email, address, 
            total_purchase, total_paid, total_due, created_at, updated_at
          ) VALUES (
            ${newId}, ${code}, ${pc.name}, ${pc.phone}, ${pc.email || null}, ${pc.address || null},
            ${pc.totalPurchase || 0}, ${pc.totalPaid || 0}, ${pc.totalDue || 0}, ${pc.created_at ? new Date(pc.created_at) : new Date()}, ${pc.updated_at ? new Date(pc.updated_at) : new Date()}
          )
        `;
        customerId = newId;
        console.log(`Created Customer: ${pc.name}`);
      }

      // Update Orders to use the new customer_id
      const pcOrders = orders.filter((o: any) => o.pos_customer_id === pc.id);
      for (const o of pcOrders) {
        await prisma.$executeRaw`
          UPDATE "orders" 
          SET customer_id = ${customerId} 
          WHERE id = ${o.id}
        `;
      }
      console.log(`Updated ${pcOrders.length} orders for ${pc.name}`);
    }

    console.log('Restore completed successfully.');
  } catch (err) {
    console.error('Failed to restore data:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
