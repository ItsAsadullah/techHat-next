import { inngest } from './client';
import { prisma } from '@/lib/prisma';

// Wait for the tsc output to decide whether to use 2 or 3 arguments!
// I'll write the logic inside the handler and fix the signature after TS completes.

export const checkLowStock = inngest.createFunction(
  { id: 'check-low-stock', name: 'Check Low Stock', triggers: [{ event: 'inventory/stock.check' }] },
  async ({ event, step }) => {
    const lowStockProducts = await step.run('fetch-low-stock', async () => {
      // Find products where stock is below a threshold (e.g. 5)
      return await prisma.product.findMany({
        where: { stock: { lte: 5 } },
        select: { id: true, name: true, sku: true, stock: true }
      });
    });

    if (lowStockProducts.length > 0) {
      await step.run('send-low-stock-alert', async () => {
        // In a real app, send email/sms to admin
        console.log(`[ALERT] ${lowStockProducts.length} products are low on stock.`);
      });
    }

    return { alerted: lowStockProducts.length };
  }
);

export const orderPlacedNotification = inngest.createFunction(
  { id: 'order-placed-notification', name: 'Order Placed Notification', triggers: [{ event: 'order/placed' }] },
  async ({ event, step }) => {
    const orderId = event.data.orderId;
    
    const order = await step.run('fetch-order', async () => {
      return await prisma.order.findUnique({
        where: { id: orderId },
        include: { Customer: true, POSCustomer: true }
      });
    });

    if (order) {
      await step.run('send-customer-notification', async () => {
        // Send email/sms to customer
        const customerName = order.Customer?.name || order.POSCustomer?.name || 'Customer';
        console.log(`[NOTIFICATION] Order ${order.orderNumber} placed successfully for ${customerName}`);
      });
    }

    return { success: true, orderId };
  }
);
