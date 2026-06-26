'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { createStockLedgerEntry } from '@/lib/actions/stock-ledger-actions';
import { createExpense } from '@/lib/actions/expense-actions';
import { createJournalEntry } from '@/lib/actions/accounting-actions';

// ══════════════════════════════════════════════════════════════════════════════
//  WARRANTY MANAGEMENT — RETAIL STORE EDITION
//  Simple workflow: Receive → Send Supplier → Receive Back → Deliver → Close
// ══════════════════════════════════════════════════════════════════════════════

// ─── Warehouse Bootstrap ──────────────────────────────────────────────────────

const WAREHOUSE_DEFS = [
  { name: 'Main Warehouse',     code: 'MAIN_WH',    type: 'MAIN'    as const },
  { name: 'Warranty Store',     code: 'WAR_STORE',  type: 'STORE'   as const },
  { name: 'Supplier Transit',   code: 'SUPP_TRANS', type: 'TRANSIT' as const },
  { name: 'Damaged Stock',      code: 'DMG_STK',    type: 'DAMAGE'  as const },
];

export async function ensureWarrantyWarehouses(): Promise<Record<string, string>> {
  const map: Record<string, string> = {};
  for (const wh of WAREHOUSE_DEFS) {
    let existing = await prisma.warehouse.findFirst({ where: { code: wh.code } });
    if (!existing) existing = await prisma.warehouse.findFirst({ where: { name: wh.name } });
    if (!existing) {
      existing = await prisma.warehouse.create({
        data: { name: wh.name, code: wh.code, type: wh.type, isActive: true },
      });
    }
    map[wh.code] = existing.id;
  }
  return map;
}

// ─── Expense Category Bootstrap ───────────────────────────────────────────────

async function ensureWarrantyCourierCategory(): Promise<string> {
  let cat = await prisma.expenseCategory.findFirst({
    where: { OR: [{ slug: 'warranty-courier' }, { name: 'Warranty Courier' }] },
  });
  if (!cat) {
    cat = await prisma.expenseCategory.create({
      data: {
        name: 'Warranty Courier',
        slug: 'warranty-courier',
        icon: '📦',
        color: '#F59E0B',
        description: 'Courier costs related to warranty claim dispatches',
        isActive: true,
      },
    });
  }
  return cat.id;
}

// ─── Timeline Helper ──────────────────────────────────────────────────────────

async function appendTimeline(claimId: string, status: string, note: string, user = 'Staff') {
  const claim = await prisma.warrantyClaim.findUnique({
    where: { id: claimId },
    select: { timeline: true },
  });
  if (!claim) return;
  const existing = Array.isArray(claim.timeline) ? (claim.timeline as any[]) : [];
  await prisma.warrantyClaim.update({
    where: { id: claimId },
    data: {
      timeline: [
        ...existing,
        { status, note, date: new Date().toISOString(), user },
      ],
    },
  });
}

// ─── Stock Transfer Helper ─────────────────────────────────────────────────────

async function moveStock(params: {
  referenceType: string;
  referenceId: string;
  productId: string;
  variantId: string | null;
  fromWarehouseId: string;
  toWarehouseId: string;
  remarks: string;
}) {
  try {
    await createStockLedgerEntry({
      referenceType: params.referenceType,
      referenceId: params.referenceId,
      warehouseId: params.fromWarehouseId,
      productId: params.productId,
      variantId: params.variantId,
      inQty: 0,
      outQty: 1,
      unitCost: 0,
      remarks: params.remarks + ' (out)',
    });
    await createStockLedgerEntry({
      referenceType: params.referenceType,
      referenceId: params.referenceId,
      warehouseId: params.toWarehouseId,
      productId: params.productId,
      variantId: params.variantId,
      inQty: 1,
      outQty: 0,
      unitCost: 0,
      remarks: params.remarks + ' (in)',
    });
  } catch (err: any) {
    console.warn('[Warranty] Stock move warning:', err.message);
  }
}

// ══════════════════════════════════════════════════════════════════════════════
//  1. CREATE WARRANTY CLAIM
// ══════════════════════════════════════════════════════════════════════════════

export async function createWarrantyClaim(data: {
  orderId: string;
  productId: string;
  variantId?: string | null;
  serialNumber?: string | null;
  imei?: string | null;
  warrantyType: string;
  purchaseDate: Date;
  warrantyExpiry?: Date | null;
  issueCategory: string;
  issueDescription: string;
  accessoriesReceived: string[];
  accessoriesMissing: string[];
  condition: string;
  remarks?: string;
  customerChargeAmount?: number;
}) {
  try {
    const whs = await ensureWarrantyWarehouses();

    // Find the main warehouse — try to get stock out of it
    const mainWhId = whs['MAIN_WH'];
    const warStoreId = whs['WAR_STORE'];

    const count = await prisma.warrantyClaim.count();
    const claimNumber = `WC-${new Date().getFullYear()}-${String(count + 1).padStart(6, '0')}`;

    const timelineNote = data.customerChargeAmount && data.customerChargeAmount > 0 
      ? `Warranty claim registered. Product moved to Warranty Store. Condition: ${data.condition}. Customer paid service charge: ৳${data.customerChargeAmount}.`
      : `Warranty claim registered. Product moved to Warranty Store. Condition: ${data.condition}.`;

    const claim = await prisma.warrantyClaim.create({
      data: {
        claimNumber,
        orderId: data.orderId,
        productId: data.productId,
        variantId: data.variantId || null,
        serialNumber: data.serialNumber || null,
        imei: data.imei || null,
        warrantyType: data.warrantyType,
        purchaseDate: new Date(data.purchaseDate),
        warrantyExpiry: data.warrantyExpiry ? new Date(data.warrantyExpiry) : null,
        issueCategory: data.issueCategory,
        issueDescription: data.issueDescription,
        accessoriesReceived: data.accessoriesReceived,
        accessoriesMissing: data.accessoriesMissing,
        condition: data.condition,
        status: 'RECEIVED',
        technicianNotes: data.remarks || '',
        timeline: [
          {
            status: 'RECEIVED',
            note: timelineNote,
            date: new Date().toISOString(),
            user: 'Staff',
          },
        ],
      },
    });

    // Move stock: Main Warehouse → Warranty Store
    await moveStock({
      referenceType: 'WARRANTY_RECEIVE',
      referenceId: claim.id,
      productId: data.productId,
      variantId: data.variantId || null,
      fromWarehouseId: mainWhId,
      toWarehouseId: warStoreId,
      remarks: `Claim ${claimNumber} received into Warranty Store`,
    });

    // Handle Customer Payment Income
    if (data.customerChargeAmount && data.customerChargeAmount > 0) {
      try {
        let cashAcc = await prisma.chartOfAccount.findFirst({ where: { name: { contains: 'Cash', mode: 'insensitive' } } });
        if (!cashAcc) cashAcc = await prisma.chartOfAccount.create({ data: { code: '1000', name: 'Cash', type: 'ASSET' } });

        let incomeAcc = await prisma.chartOfAccount.findFirst({ where: { name: { contains: 'Service Income', mode: 'insensitive' } } });
        if (!incomeAcc) incomeAcc = await prisma.chartOfAccount.create({ data: { code: '4001', name: 'Service Income', type: 'REVENUE' } });

        await createJournalEntry({
          reference: claimNumber,
          date: new Date(),
          notes: `Warranty service charge from customer`,
          journalEntryItems: [
            { accountId: cashAcc.id, debit: data.customerChargeAmount, credit: 0, description: `Cash received for ${claimNumber}` },
            { accountId: incomeAcc.id, debit: 0, credit: data.customerChargeAmount, description: `Service charge for ${claimNumber}` }
          ]
        });
      } catch (accError) {
        console.warn('[Warranty] Failed to record income journal entry:', accError);
      }
    }

    revalidatePath('/admin/warranty');
    return { success: true, claim };
  } catch (error: any) {
    console.error('[createWarrantyClaim]', error);
    return { success: false, error: error.message };
  }
}

// ══════════════════════════════════════════════════════════════════════════════
//  2. GET ALL WARRANTY CLAIMS
// ══════════════════════════════════════════════════════════════════════════════

export async function getWarrantyClaims() {
  try {
    return await prisma.warrantyClaim.findMany({
      include: {
        product: { include: { brand: true } },
        variant: true,
        order: {
          select: {
            orderNumber: true,
            customerName: true,
            customerPhone: true,
            customerEmail: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  } catch (error) {
    console.error('[getWarrantyClaims]', error);
    return [];
  }
}

// ══════════════════════════════════════════════════════════════════════════════
//  3. GET DASHBOARD STATS
// ══════════════════════════════════════════════════════════════════════════════

export async function getWarrantyStats() {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      received, sentToSupplier, receivedFromSupplier,
      readyForCustomer, closed, cancelled,
      receivedToday,
    ] = await Promise.all([
      prisma.warrantyClaim.count({ where: { status: 'RECEIVED' } }),
      prisma.warrantyClaim.count({ where: { status: 'SENT_TO_SUPPLIER' } }),
      prisma.warrantyClaim.count({ where: { status: 'RECEIVED_FROM_SUPPLIER' } }),
      prisma.warrantyClaim.count({ where: { status: 'READY_FOR_CUSTOMER' } }),
      prisma.warrantyClaim.count({ where: { status: 'CLOSED' } }),
      prisma.warrantyClaim.count({ where: { status: 'CANCELLED' } }),
      prisma.warrantyClaim.count({ where: { createdAt: { gte: startOfToday }, status: 'RECEIVED' } }),
    ]);

    // Warranty courier expense totals
    const warrantyCat = await prisma.expenseCategory.findFirst({
      where: { OR: [{ slug: 'warranty-courier' }, { name: 'Warranty Courier' }] },
    });

    let todayExpense = 0;
    let monthExpense = 0;
    if (warrantyCat) {
      const [te, me] = await Promise.all([
        prisma.expense.aggregate({
          where: { categoryId: warrantyCat.id, date: { gte: startOfToday } },
          _sum: { amount: true },
        }),
        prisma.expense.aggregate({
          where: { categoryId: warrantyCat.id, date: { gte: startOfMonth } },
          _sum: { amount: true },
        }),
      ]);
      todayExpense = te._sum?.amount || 0;
      monthExpense = me._sum?.amount || 0;
    }

    return {
      received, sentToSupplier, receivedFromSupplier,
      readyForCustomer, closed, cancelled,
      receivedToday, todayExpense, monthExpense,
    };
  } catch (error) {
    console.error('[getWarrantyStats]', error);
    return {
      received: 0, sentToSupplier: 0, receivedFromSupplier: 0,
      readyForCustomer: 0, closed: 0, cancelled: 0,
      receivedToday: 0, todayExpense: 0, monthExpense: 0,
    };
  }
}

// ══════════════════════════════════════════════════════════════════════════════
//  4. SEND TO SUPPLIER
// ══════════════════════════════════════════════════════════════════════════════

export async function sendToSupplier(
  claimId: string,
  data: {
    supplierName: string;
    courierCompany: string;
    trackingNumber: string;
    dispatchDate: string;
    estimatedReturnDate: string;
    outgoingCourierCost: number;
    remarks?: string;
  }
) {
  try {
    const whs = await ensureWarrantyWarehouses();

    const claim = await prisma.warrantyClaim.update({
      where: { id: claimId },
      data: {
        status: 'SENT_TO_SUPPLIER',
        supplierWarranty: {
          supplierName: data.supplierName,
          courierCompany: data.courierCompany,
          trackingNumber: data.trackingNumber,
          dispatchDate: data.dispatchDate,
          estimatedReturnDate: data.estimatedReturnDate,
          outgoingCourierCost: data.outgoingCourierCost,
          remarks: data.remarks || '',
        },
      },
    });

    // Move stock: Warranty Store → Supplier Transit
    await moveStock({
      referenceType: 'WARRANTY_DISPATCH',
      referenceId: claimId,
      productId: claim.productId,
      variantId: claim.variantId,
      fromWarehouseId: whs['WAR_STORE'],
      toWarehouseId: whs['SUPP_TRANS'],
      remarks: `Dispatched to ${data.supplierName} via ${data.courierCompany} (${data.trackingNumber})`,
    });

    // Create expense entry for courier cost
    if (data.outgoingCourierCost > 0) {
      const catId = await ensureWarrantyCourierCategory();
      await createExpense({
        categoryId: catId,
        title: `Warranty Courier (Out) — ${claim.claimNumber}`,
        amount: data.outgoingCourierCost,
        date: data.dispatchDate,
        note: `Outgoing courier: ${data.courierCompany}, Tracking: ${data.trackingNumber}`,
        reference: claim.claimNumber,
        paymentMethod: 'CASH',
        paidTo: data.courierCompany,
      });
    }

    await appendTimeline(
      claimId,
      'SENT_TO_SUPPLIER',
      `Sent to ${data.supplierName} via ${data.courierCompany}. Tracking: ${data.trackingNumber}. Courier cost: ৳${data.outgoingCourierCost}. ${data.remarks || ''}`,
      'Staff'
    );

    revalidatePath('/admin/warranty');
    return { success: true };
  } catch (error: any) {
    console.error('[sendToSupplier]', error);
    return { success: false, error: error.message };
  }
}

// ══════════════════════════════════════════════════════════════════════════════
//  5. RECEIVE FROM SUPPLIER
// ══════════════════════════════════════════════════════════════════════════════

export async function receiveFromSupplier(
  claimId: string,
  data: {
    returnedDate: string;
    returnCourier: string;
    incomingCourierCost: number;
    condition: 'Repaired' | 'Replaced' | 'Rejected';
    remarks?: string;
  }
) {
  try {
    const whs = await ensureWarrantyWarehouses();

    const existing = await prisma.warrantyClaim.findUnique({
      where: { id: claimId },
      select: { supplierWarranty: true, claimNumber: true, productId: true, variantId: true },
    });
    if (!existing) return { success: false, error: 'Claim not found' };

    const supplierData = (existing.supplierWarranty as any) || {};

    const claim = await prisma.warrantyClaim.update({
      where: { id: claimId },
      data: {
        status: 'RECEIVED_FROM_SUPPLIER',
        supplierWarranty: {
          ...supplierData,
          returnedDate: data.returnedDate,
          returnCourier: data.returnCourier,
          incomingCourierCost: data.incomingCourierCost,
          returnCondition: data.condition,
          returnRemarks: data.remarks || '',
        },
      },
    });

    // Move stock: Supplier Transit → Warranty Store
    await moveStock({
      referenceType: 'WARRANTY_RETURN',
      referenceId: claimId,
      productId: claim.productId,
      variantId: claim.variantId,
      fromWarehouseId: whs['SUPP_TRANS'],
      toWarehouseId: whs['WAR_STORE'],
      remarks: `Received back from supplier. Condition: ${data.condition}`,
    });

    // Create expense entry for incoming courier cost
    if (data.incomingCourierCost > 0) {
      const catId = await ensureWarrantyCourierCategory();
      await createExpense({
        categoryId: catId,
        title: `Warranty Courier (In) — ${existing.claimNumber}`,
        amount: data.incomingCourierCost,
        date: data.returnedDate,
        note: `Return courier: ${data.returnCourier}. Condition: ${data.condition}`,
        reference: existing.claimNumber,
        paymentMethod: 'CASH',
        paidTo: data.returnCourier,
      });
    }

    await appendTimeline(
      claimId,
      'RECEIVED_FROM_SUPPLIER',
      `Received back from supplier. Condition: ${data.condition}. Return courier: ${data.returnCourier}. Cost: ৳${data.incomingCourierCost}. ${data.remarks || ''}`,
      'Staff'
    );

    revalidatePath('/admin/warranty');
    return { success: true };
  } catch (error: any) {
    console.error('[receiveFromSupplier]', error);
    return { success: false, error: error.message };
  }
}

// ══════════════════════════════════════════════════════════════════════════════
//  6. MARK READY FOR CUSTOMER
// ══════════════════════════════════════════════════════════════════════════════

export async function markReadyForCustomer(claimId: string, remarks?: string) {
  try {
    await prisma.warrantyClaim.update({
      where: { id: claimId },
      data: { status: 'READY_FOR_CUSTOMER' },
    });

    await appendTimeline(
      claimId,
      'READY_FOR_CUSTOMER',
      `Product is ready for customer pickup. ${remarks || ''}`,
      'Staff'
    );

    revalidatePath('/admin/warranty');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ══════════════════════════════════════════════════════════════════════════════
//  7. DELIVER TO CUSTOMER (CLOSE)
// ══════════════════════════════════════════════════════════════════════════════

export async function deliverToCustomer(
  claimId: string,
  data: {
    receiverName: string;
    receiverPhone: string;
    deliveryDate: string;
    remarks?: string;
  }
) {
  try {
    const whs = await ensureWarrantyWarehouses();

    const claim = await prisma.warrantyClaim.update({
      where: { id: claimId },
      data: {
        status: 'CLOSED',
        pickupDetails: {
          receiverName: data.receiverName,
          receiverPhone: data.receiverPhone,
          deliveryDate: data.deliveryDate,
          remarks: data.remarks || '',
          deliveredAt: new Date().toISOString(),
        },
      },
    });

    // Move stock: Warranty Store → out (customer possession)
    try {
      await createStockLedgerEntry({
        referenceType: 'WARRANTY_DELIVERY',
        referenceId: claimId,
        warehouseId: whs['WAR_STORE'],
        productId: claim.productId,
        variantId: claim.variantId,
        inQty: 0,
        outQty: 1,
        unitCost: 0,
        remarks: `Delivered back to customer ${data.receiverName}`,
      });
    } catch (err: any) {
      console.warn('[Warranty Delivery] Stock out warning:', err.message);
    }

    await appendTimeline(
      claimId,
      'CLOSED',
      `Product delivered to ${data.receiverName} (${data.receiverPhone}). Claim closed. ${data.remarks || ''}`,
      'Staff'
    );

    revalidatePath('/admin/warranty');
    return { success: true };
  } catch (error: any) {
    console.error('[deliverToCustomer]', error);
    return { success: false, error: error.message };
  }
}

// ══════════════════════════════════════════════════════════════════════════════
//  8. CANCEL CLAIM
// ══════════════════════════════════════════════════════════════════════════════

export async function cancelWarrantyClaim(claimId: string, reason: string) {
  try {
    const whs = await ensureWarrantyWarehouses();

    const claim = await prisma.warrantyClaim.update({
      where: { id: claimId },
      data: { status: 'CANCELLED' },
    });

    // Try to move stock back: Warranty Store → Main Warehouse
    await moveStock({
      referenceType: 'WARRANTY_CANCEL',
      referenceId: claimId,
      productId: claim.productId,
      variantId: claim.variantId,
      fromWarehouseId: whs['WAR_STORE'],
      toWarehouseId: whs['MAIN_WH'],
      remarks: `Claim cancelled — returning stock to Main Warehouse`,
    });

    await appendTimeline(claimId, 'CANCELLED', `Claim cancelled. Reason: ${reason}`, 'Manager');

    revalidatePath('/admin/warranty');
    return { success: true };
  } catch (error: any) {
    console.error('[cancelWarrantyClaim]', error);
    return { success: false, error: error.message };
  }
}
