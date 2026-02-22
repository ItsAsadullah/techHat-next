'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export interface ProcessReturnInput {
  orderId: string;
  items: {
    productId: string;
    variantId?: string | null;
    quantity: number;
    unitPrice: number;
  }[];
  reason: string;
  note?: string;
  processedBy?: string;
}

export async function processReturn(input: ProcessReturnInput) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: input.orderId },
      include: { items: true },
    });

    if (!order) {
      return { success: false, error: 'Order not found' };
    }

    if (!order.isPos) {
      return { success: false, error: 'Only POS orders can be returned' };
    }

    // Calculate refund amount
    const refundAmount = input.items.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0
    );

    // Generate return number
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const count = await prisma.return.count({
      where: {
        createdAt: {
          gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
        },
      },
    });
    const returnNumber = `RET-${dateStr}-${String(count + 1).padStart(4, '0')}`;

    const result = await prisma.$transaction(async (tx) => {
      // Create return record
      const returnRecord = await tx.return.create({
        data: {
          returnNumber,
          orderId: input.orderId,
          reason: input.reason,
          status: 'PENDING',
          refundAmount,
          processedBy: input.processedBy || null,
          note: input.note || null,
        },
      });

      // Create return items and restore stock
      for (const item of input.items) {
        await tx.returnItem.create({
          data: {
            returnId: returnRecord.id,
            productId: item.productId,
            variantId: item.variantId || null,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.unitPrice * item.quantity,
          },
        });

        // Restore stock
        if (item.variantId) {
          const variant = await tx.variant.findUnique({
            where: { id: item.variantId },
            select: { stock: true },
          });

          await tx.variant.update({
            where: { id: item.variantId },
            data: { stock: { increment: item.quantity } },
          });

          // Update parent product stock
          const allVariants = await tx.variant.findMany({
            where: { productId: item.productId },
            select: { stock: true },
          });
          const totalStock = allVariants.reduce((sum, v) => sum + v.stock, 0) + item.quantity;
          
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: totalStock },
          });
        } else {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          });
        }

        // Log stock movement
        await tx.stockHistory.create({
          data: {
            productId: item.productId,
            variantId: item.variantId || null,
            action: 'ADD',
            quantity: item.quantity,
            previousStock: 0, // We'd need to fetch this for accuracy
            newStock: 0, // We'd need to fetch this for accuracy
            reason: 'Product Return',
            note: `Return: ${returnNumber}`,
            source: 'POS_RETURN',
          },
        });
      }

      return returnRecord;
    });

    revalidatePath('/admin/pos');
    revalidatePath('/admin/pos/returns');

    return {
      success: true,
      returnNumber: result.returnNumber,
      returnId: result.id,
    };
  } catch (error: any) {
    console.error('Process return error:', error);
    return {
      success: false,
      error: error.message || 'Failed to process return',
    };
  }
}

export async function approveReturn(returnId: string) {
  try {
    await prisma.return.update({
      where: { id: returnId },
      data: { status: 'APPROVED' },
    });

    revalidatePath('/admin/pos/returns');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function completeReturn(returnId: string) {
  try {
    await prisma.return.update({
      where: { id: returnId },
      data: { status: 'COMPLETED' },
    });

    revalidatePath('/admin/pos/returns');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function rejectReturn(returnId: string, note?: string) {
  try {
    await prisma.return.update({
      where: { id: returnId },
      data: { 
        status: 'REJECTED',
        note: note || null,
      },
    });

    revalidatePath('/admin/pos/returns');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getReturns(status?: string) {
  try {
    const where = status ? { status: status as any } : {};
    
    return await prisma.return.findMany({
      where,
      include: {
        order: {
          select: {
            orderNumber: true,
            customerName: true,
            customerPhone: true,
          },
        },
        items: {
          include: {
            product: { select: { name: true } },
            variant: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  } catch (error) {
    console.error('Get returns error:', error);
    return [];
  }
}

export async function searchOrderForReturn(orderNumber: string) {
  try {
    const order = await prisma.order.findFirst({
      where: {
        orderNumber,
        isPos: true,
        paymentStatus: 'PAID',
      },
      include: {
        items: {
          include: {
            product: {
              select: { name: true },
            },
            variant: {
              select: { name: true, image: true },
            },
          },
        },
      },
    });

    return order;
  } catch (error) {
    console.error('Search order error:', error);
    return null;
  }
}
