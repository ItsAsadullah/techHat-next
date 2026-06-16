'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getCustomers() {
  try {
    const customers = await prisma.customer.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return { success: true, data: customers };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getCustomerById(id: string) {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        orders: {
          take: 10,
          orderBy: { createdAt: 'desc' }
        },
        customerLedgers: {
          take: 50,
          orderBy: { date: 'desc' }
        }
      }
    });
    return { success: true, data: customer };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createCustomer(data: any) {
  try {
    const customer = await prisma.customer.create({
      data: {
        name: data.name,
        customerCode: data.customerCode || 'CUST-' + Date.now().toString().slice(-6),
        phone: data.phone,
        email: data.email,
        companyName: data.companyName,
        address: data.address,
        customerGroup: data.customerGroup || 'RETAIL',
        creditLimit: data.creditLimit || 0,
        openingBalance: data.openingBalance || 0,
        balance: data.openingBalance || 0,
      }
    });

    if (data.openingBalance && data.openingBalance > 0) {
      // Add opening balance to ledger
      await prisma.customerLedger.create({
        data: {
          customerId: customer.id,
          type: 'ADJUSTMENT',
          debit: data.openingBalance,
          credit: 0,
          runningBalance: data.openingBalance,
          note: 'Opening Balance'
        }
      });
    }

    revalidatePath('/admin/customers');
    return { success: true, data: customer };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateCustomer(id: string, data: any) {
  try {
    const customer = await prisma.customer.update({
      where: { id },
      data: {
        name: data.name,
        customerCode: data.customerCode || 'CUST-' + Date.now().toString().slice(-6),
        phone: data.phone,
        email: data.email,
        companyName: data.companyName,
        address: data.address,
        customerGroup: data.customerGroup,
        creditLimit: data.creditLimit,
        status: data.status,
      }
    });

    revalidatePath('/admin/customers');
    revalidatePath(`/admin/customers/${id}`);
    return { success: true, data: customer };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
