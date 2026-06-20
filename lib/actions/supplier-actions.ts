'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// --- TYPES ---
export interface SupplierFormData {
  supplierCode?: string;
  name: string;
  companyName?: string;
  contactPerson?: string;
  phone: string;
  mobileNumber?: string;
  whatsapp?: string;
  email?: string;
  address?: string;
  district?: string;
  country?: string;
  tradeLicenseNo?: string;
  binNumber?: string;
  tinNumber?: string;
  openingBalance?: number;
  status?: 'ACTIVE' | 'INACTIVE';
  notes?: string;
}

// --- ACTIONS ---

export async function getSuppliers({
  page = 1,
  limit = 10,
  search = '',
  status,
}: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}) {
  try {
    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { companyName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { supplierCode: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (status) {
      where.status = status;
    }

    const skip = (page - 1) * limit;

    const [suppliers, totalCount] = await Promise.all([
      prisma.supplier.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.supplier.count({ where }),
    ]);

    return {
      success: true,
      data: {
        suppliers,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page,
      },
    };
  } catch (error: any) {
    console.error('Failed to get suppliers:', error);
    return { success: false, error: error.message };
  }
}

export async function getSupplierById(id: string) {
  try {
    const supplier = await prisma.supplier.findUnique({
      where: { id },
      include: {
        _count: {
          select: { purchaseOrders: true, grns: true },
        },
      },
    });

    if (!supplier) throw new Error('Supplier not found');

    // Calculate total purchases (received POs)
    const totalPurchases = await prisma.purchaseOrder.aggregate({
      where: { supplierId: id, status: { in: ['RECEIVED', 'PARTIALLY_RECEIVED', 'CLOSED'] } },
      _sum: { grandTotal: true },
    });

    return { 
      success: true, 
      data: { 
        ...supplier,
        metrics: {
          totalPurchasesValue: totalPurchases._sum.grandTotal || 0,
        }
      } 
    };
  } catch (error: any) {
    console.error('Failed to get supplier:', error);
    return { success: false, error: error.message };
  }
}

export async function createSupplier(data: SupplierFormData) {
  try {
    // Generate code if not provided
    let finalCode = data.supplierCode;
    if (!finalCode) {
      const count = await prisma.supplier.count();
      finalCode = `SUP-${String(count + 1).padStart(4, '0')}`;
    }

    const { mobileNumber, whatsapp, ...prismaData } = data;

    const supplier = await prisma.supplier.create({
      data: {
        ...prismaData,
        supplierCode: finalCode,
        openingBalance: data.openingBalance || 0,
        status: data.status || 'ACTIVE',
      },
    });

    revalidatePath('/admin/suppliers');
    return { success: true, data: supplier };
  } catch (error: any) {
    console.error('Failed to create supplier:', error);
    if (error.code === 'P2002') {
      return { success: false, error: 'Supplier Code already exists.' };
    }
    return { success: false, error: error.message };
  }
}

export async function updateSupplier(id: string, data: SupplierFormData) {
  try {
    const { mobileNumber, whatsapp, ...prismaData } = data;

    const supplier = await prisma.supplier.update({
      where: { id },
      data: {
        ...prismaData,
      },
    });

    revalidatePath('/admin/suppliers');
    revalidatePath(`/admin/suppliers/${id}`);
    revalidatePath(`/admin/suppliers/edit/${id}`);
    return { success: true, data: supplier };
  } catch (error: any) {
    console.error('Failed to update supplier:', error);
    if (error.code === 'P2002') {
      return { success: false, error: 'Supplier Code already exists.' };
    }
    return { success: false, error: error.message };
  }
}

export async function deleteSupplier(id: string) {
  try {
    // Check if supplier has POs
    const pos = await prisma.purchaseOrder.count({ where: { supplierId: id } });
    if (pos > 0) {
      return { success: false, error: 'Cannot delete supplier with associated Purchase Orders. Please archive instead.' };
    }

    await prisma.supplier.delete({ where: { id } });

    revalidatePath('/admin/suppliers');
    return { success: true };
  } catch (error: any) {
    console.error('Failed to delete supplier:', error);
    return { success: false, error: error.message };
  }
}

export async function getSupplierOptions() {
  try {
    const suppliers = await prisma.supplier.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true, name: true, companyName: true, supplierCode: true },
      orderBy: { name: 'asc' }
    });
    return { success: true, data: suppliers };
  } catch (error: any) {
    console.error('Failed to get supplier options:', error);
    return { success: false, error: error.message };
  }
}
