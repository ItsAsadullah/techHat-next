import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting Customer Ledger Sync...');

  try {
    const customers = await prisma.customer.findMany({
      include: {
        orders: {
          orderBy: { createdAt: 'asc' }
        },
        payments: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    for (const customer of customers) {
      console.log(`Syncing ledger for customer: ${customer.name}`);
      
      // Delete existing ledgers to avoid duplication if we are re-syncing
      await prisma.customerLedger.deleteMany({
        where: { customerId: customer.id }
      });

      let runningBalance = customer.openingBalance || 0;
      let totalPurchase = 0;
      let totalPaid = 0;
      let totalDue = 0;

      // Create an opening balance ledger entry if needed
      if (customer.openingBalance > 0) {
        await prisma.customerLedger.create({
          data: {
            customerId: customer.id,
            date: customer.createdAt,
            type: 'OPENING_BALANCE',
            debit: customer.openingBalance,
            credit: 0,
            runningBalance: runningBalance,
            note: 'Opening Balance'
          }
        });
        totalDue = runningBalance;
      }

      // We will sort all events (orders and payments) by date
      const events: any[] = [];

      customer.orders.forEach(order => {
        // Sale event
        if (order.status !== 'CANCELLED') {
          events.push({
            type: 'SALE',
            date: order.createdAt,
            amount: order.grandTotal,
            referenceId: order.orderNumber,
            note: `Order ${order.orderNumber}`
          });
          
          // If there was cash/card/mobile payment directly on the order, we need to record it as payment
          // Actually, in the old system, paidAmount was stored in the order
          if (order.paidAmount && order.paidAmount > 0) {
            events.push({
              type: 'PAYMENT',
              date: order.createdAt,
              amount: order.paidAmount,
              referenceId: order.orderNumber,
              note: `Payment for Order ${order.orderNumber}`
            });
          }
        }
      });

      customer.payments.forEach(payment => {
        events.push({
          type: 'PAYMENT',
          date: payment.createdAt,
          amount: payment.amount,
          referenceId: payment.id,
          note: payment.reference || `Payment ${payment.paymentMethod}`
        });
      });

      // Sort events by date
      events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      // Create ledger entries sequentially to maintain running balance
      for (const event of events) {
        if (event.type === 'SALE') {
          runningBalance += event.amount;
          totalPurchase += event.amount;
          await prisma.customerLedger.create({
            data: {
              customerId: customer.id,
              date: event.date,
              type: 'SALE',
              referenceId: event.referenceId,
              debit: event.amount,
              credit: 0,
              runningBalance: runningBalance,
              note: event.note
            }
          });
        } else if (event.type === 'PAYMENT') {
          runningBalance -= event.amount;
          totalPaid += event.amount;
          await prisma.customerLedger.create({
            data: {
              customerId: customer.id,
              date: event.date,
              type: 'PAYMENT',
              referenceId: event.referenceId,
              debit: 0,
              credit: event.amount,
              runningBalance: runningBalance,
              note: event.note
            }
          });
        }
      }

      // Update the customer's cached stats
      await prisma.customer.update({
        where: { id: customer.id },
        data: {
          totalPurchase,
          totalPaid,
          totalDue: runningBalance,
          balance: runningBalance,
          lastPurchaseDate: events.filter(e => e.type === 'SALE').pop()?.date || null
        }
      });

      console.log(`Updated ${customer.name}: Purchase=${totalPurchase}, Paid=${totalPaid}, Due=${runningBalance}`);
    }

    console.log('Customer Ledger Sync completed successfully.');
  } catch (err) {
    console.error('Failed to sync customer ledgers:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
