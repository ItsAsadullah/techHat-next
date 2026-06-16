'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { InventoryService } from '@/lib/services/inventory-service';

// --- TYPES ---
export interface POItemInput {
  productId: string;
  variantId?: string;
  quantity: number;
  unitCost: number;
  discount?: number;
  tax?: number;
  subtotal: number;
}

export interface PurchaseOrderFormData {
  supplierId: string;
  warehouseId?: string;
  expectedDeliveryDate?: Date;
  totalAmount: number;
  discount: number;
  tax: number;
  shippingCost: number;
  otherCost: number;
  grandTotal: number;
  note?: string;
  items: POItemInput[];
}

// --- ACTIONS ---

export async function getPurchaseOrders({
  page = 1,
  limit = 10,
  search = '',
  status,
  supplierId,
}: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  supplierId?: string;
}) {
  try {
    const where: any = {};
    if (search) {
      where.poNumber = { contains: search, mode: 'insensitive' };
    }
    if (status) {
      where.status = status;
    }
    if (supplierId) {
      where.supplierId = supplierId;
    }

    const skip = (page - 1) * limit;

    const [pos, totalCount] = await Promise.all([
      prisma.purchaseOrder.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: 'desc' },
        include: {
          supplier: { select: { name: true, companyName: true } },
          warehouse: { select: { name: true } },
          _count: { select: { items: true } }
        }
      }),
      prisma.purchaseOrder.count({ where }),
    ]);

    return {
      success: true,
      data: {
        pos,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page,
      },
    };
  } catch (error: any) {
    console.error('Failed to get POs:', error);
    return { success: false, error: error.message };
  }
}

export async function getPurchaseOrderById(id: string) {
  try {
    const po = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        supplier: true,
        warehouse: true,
        items: {
          include: {
            product: { select: { id: true, name: true, sku: true, stock: true } },
            productVariant: { select: { id: true, name: true, sku: true, stock: true } }
          }
        },
        grns: {
          orderBy: { receivedDate: 'desc' },
          select: { id: true, grnNumber: true, receivedDate: true, status: true }
        }
      },
    });

    if (!po) throw new Error('Purchase Order not found');

    return { success: true, data: po };
  } catch (error: any) {
    console.error('Failed to get PO:', error);
    return { success: false, error: error.message };
  }
}

export async function searchProductsForPO(query: string) {
  try {
    const products = await prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { sku: { contains: query, mode: 'insensitive' } },
        ]
      },
      take: 10,
      select: {
        id: true,
        name: true,
        sku: true,
        costPrice: true,
        variants: {
          select: {
            id: true,
            name: true,
            sku: true,
            costPrice: true,
          }
        }
      }
    });

    const stockQueries = [];
    for (const p of products) {
      stockQueries.push({ productId: p.id, variantId: null });
      for (const v of p.variants) {
        stockQueries.push({ productId: p.id, variantId: v.id });
      }
    }
    const stockMap = await InventoryService.getBulkAvailableStock(stockQueries);

    const mappedProducts = products.map((p) => ({
      ...p,
      stock: stockMap.get(p.id)?.availableStock || 0,
      variations: p.variants.map((v) => ({
        ...v,
        stock: stockMap.get(`${p.id}-${v.id}`)?.availableStock || 0,
      })),
    }));

    return { success: true, data: mappedProducts };
  } catch (error: any) {
    console.error('Failed to search products:', error);
    return { success: false, error: error.message };
  }
}

export async function getApprovedPOs() {
  try {
    const pos = await prisma.purchaseOrder.findMany({
      where: { status: { in: ['APPROVED', 'PARTIALLY_RECEIVED'] } },
      select: { id: true, poNumber: true, supplierId: true, warehouseId: true, supplier: { select: { name: true } } },
      orderBy: { date: 'desc' }
    });
    return { success: true, data: pos };
  } catch (error: any) {
    console.error('Failed to get approved POs:', error);
    return { success: false, error: error.message };
  }
}

export async function createPurchaseOrder(data: PurchaseOrderFormData) {
  try {
    // SERVER-SIDE VALIDATION (Rule #9)
    let calculatedSubtotal = 0;
    for (const item of data.items) {
      const itemSubtotal = (item.quantity * item.unitCost) + (item.tax || 0) - (item.discount || 0);
      if (Math.abs(item.subtotal - itemSubtotal) > 0.01) {
        throw new Error(`Item subtotal mismatch. Expected ${itemSubtotal}, got ${item.subtotal}`);
      }
      calculatedSubtotal += itemSubtotal;
    }
    const expectedGrandTotal = calculatedSubtotal + data.shippingCost + data.otherCost - data.discount + data.tax;
    if (Math.abs(data.grandTotal - expectedGrandTotal) > 0.01) {
      throw new Error(`Grand total mismatch. Expected ${expectedGrandTotal}, got ${data.grandTotal}`);
    }

    // Generate PO Number
    const count = await prisma.purchaseOrder.count();
    const poNumber = `PO-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(count + 1).padStart(4, '0')}`;

    const po = await prisma.purchaseOrder.create({
      data: {
        poNumber,
        supplierId: data.supplierId,
        warehouseId: data.warehouseId || null,
        expectedDeliveryDate: data.expectedDeliveryDate,
        totalAmount: data.totalAmount,
        discount: data.discount,
        tax: data.tax,
        shippingCost: data.shippingCost,
        otherCost: data.otherCost,
        grandTotal: data.grandTotal,
        note: data.note,
        status: 'DRAFT',
        items: {
          create: data.items.map(item => ({
            productId: item.productId,
            variantId: item.variantId || null,
            quantity: item.quantity,
            unitCost: item.unitCost,
            discount: item.discount || 0,
            tax: item.tax || 0,
            subtotal: item.subtotal,
          }))
        }
      },
    });

    revalidatePath('/admin/purchases');
    return { success: true, data: po };
  } catch (error: any) {
    console.error('Failed to create PO:', error);
    return { success: false, error: error.message };
  }
}

export async function updatePurchaseOrder(id: string, data: PurchaseOrderFormData) {
  try {
    const existing = await prisma.purchaseOrder.findUnique({ where: { id } });
    if (!existing) throw new Error('PO not found');
    if (existing.status !== 'DRAFT') throw new Error('Only DRAFT POs can be edited');

    // Delete existing items
    await prisma.purchaseOrderItem.deleteMany({ where: { purchaseOrderId: id } });

    // Update PO and recreate items
    const po = await prisma.purchaseOrder.update({
      where: { id },
      data: {
        supplierId: data.supplierId,
        warehouseId: data.warehouseId || null,
        expectedDeliveryDate: data.expectedDeliveryDate,
        totalAmount: data.totalAmount,
        discount: data.discount,
        tax: data.tax,
        shippingCost: data.shippingCost,
        otherCost: data.otherCost,
        grandTotal: data.grandTotal,
        note: data.note,
        items: {
          create: data.items.map(item => ({
            productId: item.productId,
            variantId: item.variantId || null,
            quantity: item.quantity,
            unitCost: item.unitCost,
            discount: item.discount || 0,
            tax: item.tax || 0,
            subtotal: item.subtotal,
          }))
        }
      },
    });

    revalidatePath('/admin/purchases');
    revalidatePath(`/admin/purchases/${id}`);
    revalidatePath(`/admin/purchases/edit/${id}`);
    return { success: true, data: po };
  } catch (error: any) {
    console.error('Failed to update PO:', error);
    return { success: false, error: error.message };
  }
}

export async function updatePurchaseOrderStatus(id: string, newStatus: 'SUBMITTED' | 'APPROVED' | 'CANCELLED') {
  try {
    const po = await prisma.purchaseOrder.update({
      where: { id },
      data: { status: newStatus },
    });

    revalidatePath('/admin/purchases');
    revalidatePath(`/admin/purchases/${id}`);
    return { success: true, data: po };
  } catch (error: any) {
    console.error(`Failed to ${newStatus.toLowerCase()} PO:`, error);
    return { success: false, error: error.message };
  }
}
