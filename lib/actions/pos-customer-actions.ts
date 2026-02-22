'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// -----------------------------------------------
// CUSTOMER
// -----------------------------------------------

export async function upsertPOSCustomer(name: string, phone: string) {
  try {
    const existing = await prisma.pOSCustomer.findUnique({ where: { phone } });
    if (existing) return existing;
    return prisma.pOSCustomer.create({ data: { name, phone } });
  } catch (error: any) {
    console.error('upsertPOSCustomer error:', error);
    throw new Error(error.message || 'Failed to save customer');
  }
}

export async function getPOSCustomers(search?: string) {
  const where: any = {};
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search, mode: 'insensitive' } },
    ];
  }
  return prisma.pOSCustomer.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      orders: {
        select: { grandTotal: true, dueAmount: true },
      },
    },
  });
}

export async function getPOSCustomerById(id: string) {
  return prisma.pOSCustomer.findUnique({
    where: { id },
    include: {
      orders: {
        where: { isPos: true },
        orderBy: { createdAt: 'desc' },
        include: {
          items: true,
          guarantor: true,
        },
      },
    },
  });
}

export async function updatePOSCustomerStats(customerId: string) {
  const agg = await prisma.order.aggregate({
    where: { posCustomerId: customerId, isPos: true },
    _sum: { grandTotal: true, dueAmount: true },
  });
  await prisma.pOSCustomer.update({
    where: { id: customerId },
    data: {
      totalPurchase: agg._sum.grandTotal || 0,
      totalDue: agg._sum.dueAmount || 0,
    },
  });
}

// -----------------------------------------------
// GUARANTOR
// -----------------------------------------------

export async function createGuarantor(data: {
  orderId: string;
  name: string;
  phone: string;
  relation?: string;
  address?: string;
}) {
  try {
    return await prisma.guarantor.create({ data });
  } catch (error: any) {
    console.error('createGuarantor error:', error);
    throw new Error(error.message || 'Failed to create guarantor');
  }
}

export async function getGuarantorByOrderId(orderId: string) {
  try {
    return await prisma.guarantor.findUnique({ where: { orderId } });
  } catch (error: any) {
    console.error('getGuarantorByOrderId error:', error);
    return null;
  }
}

// -----------------------------------------------
// DUE PAYMENT
// -----------------------------------------------

export async function recordDuePayment(orderId: string, amount: number, note?: string) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { dueAmount: true, paidAmount: true, grandTotal: true, posCustomerId: true },
    });
    if (!order) throw new Error('Order not found');

    const newDue = Math.max(0, (order.dueAmount || 0) - amount);
    const newPaid = (order.paidAmount || 0) + amount;
    const newStatus =
      newDue <= 0 ? 'PAID' : newPaid > 0 ? 'PARTIAL' : 'DUE';

    await prisma.$transaction([
      prisma.duePayment.create({
        data: { orderId, amount, note },
      }),
      prisma.order.update({
        where: { id: orderId },
        data: {
          dueAmount: newDue,
          paidAmount: newPaid,
          posPaymentStatus: newStatus as any,
        },
      }),
    ]);

    if (order.posCustomerId) {
      await updatePOSCustomerStats(order.posCustomerId);
    }

    revalidatePath('/admin/pos/reports');
    revalidatePath('/admin/pos/customers');
  } catch (error: any) {
    console.error('recordDuePayment error:', error);
    throw new Error(error.message || 'Failed to record payment');
  }
}

export async function getDuePaymentsByOrder(orderId: string) {
  try {
    return await prisma.duePayment.findMany({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
    });
  } catch (error: any) {
    console.error('getDuePaymentsByOrder error:', error);
    return [];
  }
}

// -----------------------------------------------
// SALES REPORT
// -----------------------------------------------

export type ReportFilter = {
  startDate?: Date;
  endDate?: Date;
  search?: string;
  status?: 'PAID' | 'PARTIAL' | 'DUE' | 'ALL';
};

export async function getPOSSalesReport(filter?: ReportFilter) {
  try {
    const where: any = { isPos: true };

    if (filter?.startDate || filter?.endDate) {
      where.createdAt = {};
      if (filter.startDate) where.createdAt.gte = filter.startDate;
      if (filter.endDate) where.createdAt.lte = filter.endDate;
    }

    if (filter?.status && filter.status !== 'ALL') {
      where.posPaymentStatus = filter.status;
    }

    if (filter?.search) {
      where.OR = [
        { orderNumber: { contains: filter.search, mode: 'insensitive' } },
        { customerName: { contains: filter.search, mode: 'insensitive' } },
        { customerPhone: { contains: filter.search, mode: 'insensitive' } },
      ];
    }

    const [orders, summary] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          items: true,
          guarantor: true,
          posCustomer: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.order.aggregate({
        where,
        _sum: { grandTotal: true, paidAmount: true, dueAmount: true, discount: true },
        _count: true,
      }),
    ]);

    return {
      orders,
      summary: {
        totalSales: summary._sum.grandTotal || 0,
        totalPaid: summary._sum.paidAmount || 0,
        totalDue: summary._sum.dueAmount || 0,
        totalDiscount: summary._sum.discount || 0,
        totalOrders: summary._count,
      },
    };
  } catch (error: any) {
    console.error('getPOSSalesReport error:', error);
    return {
      orders: [],
      summary: { totalSales: 0, totalPaid: 0, totalDue: 0, totalDiscount: 0, totalOrders: 0 },
    };
  }
}
