import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const accounts = [
  { code: '1000', name: 'Cash & Equivalents', type: 'ASSET', isSystem: true },
  { code: '1100', name: 'Accounts Receivable', type: 'ASSET', isSystem: true },
  { code: '1200', name: 'Inventory Asset', type: 'ASSET', isSystem: true },
  { code: '2000', name: 'Accounts Payable', type: 'LIABILITY', isSystem: true },
  { code: '3000', name: 'Owner Equity', type: 'EQUITY', isSystem: true },
  { code: '4000', name: 'Sales Revenue', type: 'REVENUE', isSystem: true },
  { code: '5000', name: 'Cost of Goods Sold', type: 'COGS', isSystem: true },
  { code: '6000', name: 'Operating Expense', type: 'EXPENSE', isSystem: true },
];

async function main() {
  console.log('Seeding standard Chart of Accounts...');
  for (const acc of accounts) {
    await prisma.chartOfAccount.upsert({
      where: { code: acc.code },
      update: {},
      create: {
        code: acc.code,
        name: acc.name,
        type: acc.type as any,
        isSystem: acc.isSystem
      }
    });
    console.log(`✅ Upserted Account: ${acc.code} - ${acc.name}`);
  }
  
  // Also create a default Accounting Period if it doesn't exist
  const year = new Date().getFullYear();
  const existingPeriod = await prisma.accountingPeriod.findFirst({
    where: { isClosed: false }
  });

  if (!existingPeriod) {
    console.log('Creating default Accounting Period...');
    
    // check if fiscal year exists
    let fiscalYear = await prisma.fiscalYear.findFirst();
    if (!fiscalYear) {
      fiscalYear = await prisma.fiscalYear.create({
        data: {
          name: `FY-${year}`,
          startDate: new Date(`${year}-01-01`),
          endDate: new Date(`${year}-12-31`),
        }
      });
    }

    await prisma.accountingPeriod.create({
      data: {
        name: `${year}-M01`,
        startDate: new Date(`${year}-01-01`),
        endDate: new Date(`${year}-01-31`),
        fiscalYearId: fiscalYear.id
      }
    });
    console.log('✅ Created default Accounting Period');
  }

  console.log('🎉 Chart of Accounts initialization complete!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
