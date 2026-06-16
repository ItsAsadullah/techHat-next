const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Populating Supplier Ledgers...');

  const suppliers = await prisma.supplier.findMany({ select: { id: true, name: true, openingBalance: true } });
  
  for (const supplier of suppliers) {
    console.log(`Processing ${supplier.name}...`);
    
    // We can't easily import the TS service here because it's a JS script without ts-node setup.
    // So we'll run the logic inline or just use the TS version via a server action call or ts-node.
    // Let's implement the logic here in JS:
    
    await prisma.$transaction(async (tx) => {
      await tx.supplierLedger.deleteMany({ where: { supplierId: supplier.id } });

      let runningBalance = 0;

      if (supplier.openingBalance > 0) {
        runningBalance += supplier.openingBalance;
        await tx.supplierLedger.create({
          data: {
            supplierId: supplier.id,
            type: 'OPENING_BALANCE',
            debit: 0,
            credit: supplier.openingBalance,
            runningBalance,
            note: 'Initial Opening Balance'
          }
        });
      }

      const purchases = await tx.purchaseOrder.findMany({
        where: { supplierId: supplier.id, status: { in: ['APPROVED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CLOSED'] } },
        orderBy: { createdAt: 'asc' }
      });

      const payments = await tx.supplierPayment.findMany({
        where: { supplierId: supplier.id },
        orderBy: { createdAt: 'asc' }
      });

      const returns = await tx.purchaseReturn.findMany({
        where: { supplierId: supplier.id, status: 'PROCESSED' },
        orderBy: { createdAt: 'asc' }
      });

      const events = [
        ...purchases.map(p => ({ date: p.createdAt, type: 'PURCHASE', data: p })),
        ...payments.map(p => ({ date: p.createdAt, type: 'PAYMENT', data: p })),
        ...returns.map(r => ({ date: r.createdAt, type: 'RETURN', data: r }))
      ].sort((a, b) => a.date.getTime() - b.date.getTime());

      for (const event of events) {
        if (event.type === 'PURCHASE') {
          const po = event.data;
          runningBalance += po.totalAmount || po.grandTotal;
          await tx.supplierLedger.create({
            data: {
              supplierId: supplier.id,
              type: 'PURCHASE',
              debit: 0,
              credit: po.totalAmount || po.grandTotal,
              runningBalance,
              referenceId: po.id,
              date: po.createdAt,
              note: `Purchase Order ${po.poNumber}`
            }
          });
        } else if (event.type === 'PAYMENT') {
          const pay = event.data;
          runningBalance -= pay.amount;
          await tx.supplierLedger.create({
            data: {
              supplierId: supplier.id,
              type: 'PAYMENT',
              debit: pay.amount,
              credit: 0,
              runningBalance,
              referenceId: pay.id,
              date: pay.createdAt,
              note: `Payment via ${pay.paymentMethod}`
            }
          });
        } else if (event.type === 'RETURN') {
          const ret = event.data;
          runningBalance -= ret.refundAmount || 0;
          await tx.supplierLedger.create({
            data: {
              supplierId: supplier.id,
              type: 'RETURN',
              debit: ret.refundAmount || 0,
              credit: 0,
              runningBalance,
              referenceId: ret.id,
              date: ret.createdAt,
              note: `Purchase Return ${ret.returnNumber}`
            }
          });
        }
      }
    });
  }
  
  console.log('Done populating supplier ledgers.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
