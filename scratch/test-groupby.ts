import { prisma } from '../lib/prisma';

async function test() {
  try {
    const res = await prisma.journalEntryItem.groupBy({
      by: ['accountId'],
      where: {
        journalEntry: {
          date: { gte: new Date('2024-01-01') }
        }
      },
      _sum: { debit: true, credit: true }
    });
    console.log(res);
  } catch (e: any) {
    console.error("ERROR:", e.message);
  }
}

test();
