'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { addMonths, startOfMonth, endOfMonth } from 'date-fns';

export async function getFiscalYears() {
  try {
    const years = await prisma.fiscalYear.findMany({
      include: {
        periods: {
          orderBy: { startDate: 'asc' }
        }
      },
      orderBy: { startDate: 'desc' }
    });
    return { success: true, data: years };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createFiscalYear(data: { name: string; startDate: Date; endDate: Date }) {
  try {
    const existing = await prisma.fiscalYear.findUnique({ where: { name: data.name } });
    if (existing) throw new Error(`Fiscal Year ${data.name} already exists`);

    const year = await prisma.$transaction(async (tx) => {
      const fy = await tx.fiscalYear.create({
        data: {
          name: data.name,
          startDate: data.startDate,
          endDate: data.endDate,
          isClosed: false,
        }
      });

      // Generate 12 monthly periods
      let currentStart = startOfMonth(new Date(data.startDate));
      const end = new Date(data.endDate);
      
      const periodsToCreate = [];
      while (currentStart <= end) {
        const currentEnd = endOfMonth(currentStart);
        // Ensure period doesn't go beyond fiscal year end
        const periodEnd = currentEnd > end ? end : currentEnd;
        
        periodsToCreate.push({
          fiscalYearId: fy.id,
          name: currentStart.toLocaleString('default', { month: 'long', year: 'numeric' }),
          startDate: currentStart,
          endDate: periodEnd,
          isClosed: false
        });

        currentStart = startOfMonth(addMonths(currentStart, 1));
      }

      await tx.accountingPeriod.createMany({
        data: periodsToCreate
      });

      return fy;
    });

    revalidatePath('/admin/accounting/fiscal-years');
    return { success: true, data: year };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function togglePeriodStatus(periodId: string, isClosed: boolean) {
  try {
    await prisma.accountingPeriod.update({
      where: { id: periodId },
      data: { isClosed }
    });
    revalidatePath('/admin/accounting/fiscal-years');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
