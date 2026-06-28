'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { createStockLedgerEntry } from '@/lib/actions/stock-ledger-actions';

// ─── Automate Warehouse Creation ──────────────────────────────────────────────

export async function ensureAfterSalesWarehouses() {
  const warehouses = [
    { name: 'Main Warehouse', code: 'MAIN_WH', type: 'MAIN' as const },
    { name: 'Warranty Collection', code: 'WAR_COLL', type: 'STORE' as const },
    { name: 'Inspection Warehouse', code: 'INSP_WH', type: 'INSPECTION' as const },
    { name: 'Service Center', code: 'SRV_CTR', type: 'SERVICE_CENTER' as const },
    { name: 'Supplier Warranty', code: 'SUPP_WAR', type: 'TRANSIT' as const },
    { name: 'Replacement Stock', code: 'REP_STK', type: 'STORE' as const },
    { name: 'Damaged Stock', code: 'DMG_STK', type: 'DAMAGE' as const },
  ];

  const map: Record<string, string> = {};

  for (const wh of warehouses) {
    let existing = await prisma.warehouse.findFirst({
      where: { code: wh.code },
    });
    if (!existing) {
      existing = await prisma.warehouse.findFirst({
        where: { name: wh.name },
      });
    }
    if (!existing) {
      existing = await prisma.warehouse.create({
        data: {
          name: wh.name,
          code: wh.code,
          type: wh.type,
          isActive: true,
        },
      });
    }
    map[wh.code] = existing.id;
  }

  return map;
}

// Helper to append a timeline log
async function appendTimeline(claimId: string, status: string, note: string, user = 'Staff') {
  const claim = await prisma.warrantyClaim.findUnique({
    where: { id: claimId },
    select: { timeline: true },
  });
  if (!claim) return;

  const currentTimeline = Array.isArray(claim.timeline) ? (claim.timeline as any[]) : [];
  const entry = {
    status,
    note,
    date: new Date().toISOString(),
    user,
  };

  await prisma.warrantyClaim.update({
    where: { id: claimId },
    data: {
      timeline: [...currentTimeline, entry],
    },
  });
}

// ─── Phase 1: Claims Management ────────────────────────────────────────────────

export async function createWarrantyClaim(data: {
  orderId: string;
  productId: string;
  variantId?: string | null;
  serialNumber?: string | null;
  imei?: string | null;
  warrantyType: string;
  purchaseDate: Date;
  warrantyExpiry?: Date | null;
  issueCategory?: string;
  issueDescription: string;
  accessoriesReceived?: string[];
  accessoriesMissing?: string[];
  condition?: string;
  images?: string[];
  videos?: string[];
  attachments?: string[];
  technicianNotes?: string;
}) {
  try {
    const whs = await ensureAfterSalesWarehouses();
    const count = await prisma.warrantyClaim.count();
    const claimNumber = `WC-2026-${String(count + 1).padStart(6, '0')}`;

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
        issueCategory: data.issueCategory || 'General Issue',
        issueDescription: data.issueDescription,
        accessoriesReceived: data.accessoriesReceived || [],
        accessoriesMissing: data.accessoriesMissing || [],
        condition: data.condition || 'Good',
        status: 'RECEIVED',
        images: data.images || [],
        videos: data.videos || [],
        attachments: data.attachments || [],
        technicianNotes: data.technicianNotes || '',
        timeline: [
          {
            status: 'RECEIVED',
            note: 'Warranty Claim registered. Product entered Inspection Warehouse.',
            date: new Date().toISOString(),
            user: 'Staff',
          },
        ],
      },
    });

    // Move stock to Inspection Warehouse
    try {
      await createStockLedgerEntry({
        referenceType: 'WARRANTY_CLAIM',
        referenceId: claim.id,
        warehouseId: whs['INSP_WH'],
        productId: data.productId,
        variantId: data.variantId || null,
        inQty: 1,
        outQty: 0,
        unitCost: 0,
        remarks: `Received claim ${claimNumber} in Inspection Warehouse`,
      });
    } catch (stockErr: any) {
      console.warn('Stock ledger entry ignored or failed:', stockErr.message);
    }

    revalidatePath('/admin/warranty');
    return { success: true, claim };
  } catch (error: any) {
    console.error('Create claim error:', error);
    return { success: false, error: error.message };
  }
}

export async function getWarrantyClaims() {
  try {
    return await prisma.warrantyClaim.findMany({
      include: {
        product: { include: { brand: true } },
        variant: true,
        order: { select: { orderNumber: true, customerName: true, customerPhone: true, customerEmail: true, user: true } },
        repairJob: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  } catch (error) {
    console.error('Fetch claims error:', error);
    return [];
  }
}

export async function updateClaimStatus(
  claimId: string,
  status: string,
  note: string,
  decision?: string
) {
  try {
    const claim = await prisma.warrantyClaim.update({
      where: { id: claimId },
      data: {
        status,
        ...(decision ? { decision } : {}),
      },
    });

    await appendTimeline(claimId, status, note);

    // Automatic Service Job Generation on APPROVED with REPAIR decision
    if (status === 'APPROVED' && decision === 'REPAIR') {
      const existingJob = await prisma.repairJob.findUnique({ where: { claimId } });
      if (!existingJob) {
        const whs = await ensureAfterSalesWarehouses();
        const jobCount = await prisma.repairJob.count();
        const jobCardNumber = `SRV-2026-${String(jobCount + 1).padStart(6, '0')}`;

        await prisma.repairJob.create({
          data: {
            claimId,
            jobCardNumber,
            status: 'RECEIVED',
            priority: 'MEDIUM',
            repairType: 'HARDWARE',
          },
        });

        // Stock movement: move out of Inspection Warehouse, in to Service Center
        try {
          await createStockLedgerEntry({
            referenceType: 'REPAIR_START',
            referenceId: claimId,
            warehouseId: whs['INSP_WH'],
            productId: claim.productId,
            variantId: claim.variantId || null,
            inQty: 0,
            outQty: 1,
            remarks: `Transferring claim ${claim.claimNumber} to Service Center`,
          });
          await createStockLedgerEntry({
            referenceType: 'REPAIR_START',
            referenceId: claimId,
            warehouseId: whs['SRV_CTR'],
            productId: claim.productId,
            variantId: claim.variantId || null,
            inQty: 1,
            outQty: 0,
            unitCost: 0,
            remarks: `Defective unit received in Service Center`,
          });
        } catch (stockErr: any) {
          console.warn('Repair job stock ledger transfer failed:', stockErr.message);
        }

        await appendTimeline(claimId, 'REPAIR_JOB_CREATED', `Service Job Card ${jobCardNumber} created.`);
      }
    }

    revalidatePath('/admin/warranty');
    return { success: true, claim };
  } catch (error: any) {
    console.error('Update claim status error:', error);
    return { success: false, error: error.message };
  }
}

// ─── Phase 2: Repairs & Service Center ────────────────────────────────────────

export async function updateRepairJob(
  jobId: string,
  data: {
    status?: string;
    priority?: string;
    repairType?: string;
    expectedCompletion?: Date | null;
    notes?: string;
    cost?: number;
    assignedTo?: string;
    partsUsed?: any;
  }
) {
  try {
    const job = await prisma.repairJob.update({
      where: { id: jobId },
      data: {
        ...data,
        expectedCompletion: data.expectedCompletion ? new Date(data.expectedCompletion) : undefined,
      },
      include: { claim: true },
    });

    if (data.status) {
      // Sync Claim status
      let claimStatus = 'REPAIR_IN_PROGRESS';
      if (data.status === 'DIAGNOSING') claimStatus = 'UNDER_INSPECTION';
      if (data.status === 'WAITING_PARTS') claimStatus = 'WAITING_PARTS';
      if (data.status === 'REPAIRING') claimStatus = 'REPAIR_IN_PROGRESS';
      if (data.status === 'READY') claimStatus = 'QUALITY_TESTING';

      await prisma.warrantyClaim.update({
        where: { id: job.claimId },
        data: { status: claimStatus },
      });

      await appendTimeline(
        job.claimId,
        claimStatus,
        `Service Job status updated to ${data.status}. Note: ${data.notes || 'None'}`
      );
    }

    revalidatePath('/admin/warranty');
    return { success: true, job };
  } catch (error: any) {
    console.error('Update repair job error:', error);
    return { success: false, error: error.message };
  }
}

export async function submitQCReport(
  jobId: string,
  status: 'PASS' | 'FAIL' | 'REWORK',
  notes: string,
  inspector: string
) {
  try {
    const whs = await ensureAfterSalesWarehouses();
    const job = await prisma.repairJob.update({
      where: { id: jobId },
      data: {
        qcStatus: status,
        qcNotes: notes,
        qcInspector: inspector,
        status: status === 'PASS' ? 'READY' : 'REPAIRING',
      },
      include: { claim: true },
    });

    const claimStatus = status === 'PASS' ? 'READY_FOR_PICKUP' : 'REPAIR_IN_PROGRESS';
    await prisma.warrantyClaim.update({
      where: { id: job.claimId },
      data: { status: claimStatus },
    });

    await appendTimeline(
      job.claimId,
      claimStatus,
      `Quality Control Check: ${status}. Inspector: ${inspector}. Notes: ${notes}`
    );

    // If passed, move unit to Warranty Collection Warehouse
    if (status === 'PASS') {
      try {
        await createStockLedgerEntry({
          referenceType: 'QC_PASS',
          referenceId: job.claimId,
          warehouseId: whs['SRV_CTR'],
          productId: job.claim.productId,
          variantId: job.claim.variantId || null,
          inQty: 0,
          outQty: 1,
          remarks: `QC Passed, transferring from Service Center`,
        });
        await createStockLedgerEntry({
          referenceType: 'QC_PASS',
          referenceId: job.claimId,
          warehouseId: whs['WAR_COLL'],
          productId: job.claim.productId,
          variantId: job.claim.variantId || null,
          inQty: 1,
          outQty: 0,
          unitCost: 0,
          remarks: `QC Passed, item ready at Warranty Collection`,
        });
      } catch (stockErr: any) {
        console.warn('QC stock ledger transfer failed:', stockErr.message);
      }
    }

    revalidatePath('/admin/warranty');
    return { success: true, job };
  } catch (error: any) {
    console.error('QC submission error:', error);
    return { success: false, error: error.message };
  }
}

// ─── Phase 3: Supplier Warranty ───────────────────────────────────────────────

export async function dispatchToSupplier(
  claimId: string,
  data: {
    courierCompany: string;
    trackingNumber: string;
    expectedReturn: Date;
    supplierNotes: string;
  }
) {
  try {
    const whs = await ensureAfterSalesWarehouses();
    const claim = await prisma.warrantyClaim.update({
      where: { id: claimId },
      data: {
        status: 'SENT_TO_SUPPLIER',
        supplierWarranty: {
          status: 'SENT',
          courierCompany: data.courierCompany,
          trackingNumber: data.trackingNumber,
          dispatchDate: new Date().toISOString(),
          expectedReturn: new Date(data.expectedReturn).toISOString(),
          supplierNotes: data.supplierNotes,
        },
      },
    });

    // Move out of Service Center, in to Supplier Warranty Transit Warehouse
    try {
      await createStockLedgerEntry({
        referenceType: 'SUPPLIER_DISPATCH',
        referenceId: claimId,
        warehouseId: whs['SRV_CTR'],
        productId: claim.productId,
        variantId: claim.variantId || null,
        inQty: 0,
        outQty: 1,
        remarks: `Dispatched to Supplier. Tracking: ${data.trackingNumber}`,
      });
      await createStockLedgerEntry({
        referenceType: 'SUPPLIER_DISPATCH',
        referenceId: claimId,
        warehouseId: whs['SUPP_WAR'],
        productId: claim.productId,
        variantId: claim.variantId || null,
        inQty: 1,
        outQty: 0,
        unitCost: 0,
        remarks: `Sent to Supplier Transit Stock`,
      });
    } catch (stockErr: any) {
      console.warn('Supplier dispatch stock transfer failed:', stockErr.message);
    }

    await appendTimeline(
      claimId,
      'SENT_TO_SUPPLIER',
      `Product dispatched to Supplier via ${data.courierCompany} (Tracking: ${data.trackingNumber})`
    );

    revalidatePath('/admin/warranty');
    return { success: true, claim };
  } catch (error: any) {
    console.error('Dispatch to supplier error:', error);
    return { success: false, error: error.message };
  }
}

export async function receiveFromSupplier(
  claimId: string,
  data: {
    status: 'Returned' | 'Replacement Approved' | 'Rejected';
    notes: string;
  }
) {
  try {
    const whs = await ensureAfterSalesWarehouses();
    const current = await prisma.warrantyClaim.findUnique({
      where: { id: claimId },
      select: { supplierWarranty: true },
    });

    const supplierObj = current?.supplierWarranty ? (current.supplierWarranty as any) : {};
    const updatedSupplier = {
      ...supplierObj,
      status: data.status,
      receivedBackDate: new Date().toISOString(),
      notes: data.notes,
    };

    const nextStatus = data.status === 'Replacement Approved' ? 'READY_FOR_PICKUP' : 'PENDING_INSPECTION';

    const claim = await prisma.warrantyClaim.update({
      where: { id: claimId },
      data: {
        status: nextStatus,
        supplierWarranty: updatedSupplier,
      },
    });

    // Move out of Supplier Warranty, to Inspection WH (or Replacement Stock / Collection)
    try {
      await createStockLedgerEntry({
        referenceType: 'SUPPLIER_RETURN',
        referenceId: claimId,
        warehouseId: whs['SUPP_WAR'],
        productId: claim.productId,
        variantId: claim.variantId || null,
        inQty: 0,
        outQty: 1,
        remarks: `Returned from Supplier. Resolution: ${data.status}`,
      });

      const destWh = nextStatus === 'READY_FOR_PICKUP' ? whs['WAR_COLL'] : whs['INSP_WH'];
      await createStockLedgerEntry({
        referenceType: 'SUPPLIER_RETURN',
        referenceId: claimId,
        warehouseId: destWh,
        productId: claim.productId,
        variantId: claim.variantId || null,
        inQty: 1,
        outQty: 0,
        unitCost: 0,
        remarks: `Supplier Return item entered ${nextStatus === 'READY_FOR_PICKUP' ? 'Warranty Collection' : 'Inspection Warehouse'}`,
      });
    } catch (stockErr: any) {
      console.warn('Supplier return stock ledger transfer failed:', stockErr.message);
    }

    await appendTimeline(
      claimId,
      nextStatus,
      `Received back from supplier. Status: ${data.status}. Response Notes: ${data.notes}`
    );

    revalidatePath('/admin/warranty');
    return { success: true, claim };
  } catch (error: any) {
    console.error('Receive from supplier error:', error);
    return { success: false, error: error.message };
  }
}

// ─── Phase 4: Product Exchange Calculator ─────────────────────────────────────

export async function processExchangeReplacement(
  claimId: string,
  data: {
    originalPrice: number;
    currentValue: number;
    depreciation: number;
    warrantyCoverage: number;
    replacementProductId: string;
    replacementVariantId?: string | null;
    replacementPrice: number;
    difference: number;
    whoPays: 'CUSTOMER' | 'STORE' | 'SUPPLIER';
    reason: string;
  }
) {
  try {
    const whs = await ensureAfterSalesWarehouses();

    const claim = await prisma.warrantyClaim.update({
      where: { id: claimId },
      data: {
        status: 'REPLACED',
        decision: 'REPLACE',
        exchangeDetails: {
          originalPrice: data.originalPrice,
          currentValue: data.currentValue,
          depreciation: data.depreciation,
          warrantyCoverage: data.warrantyCoverage,
          replacementProductId: data.replacementProductId,
          replacementVariantId: data.replacementVariantId || null,
          replacementPrice: data.replacementPrice,
          difference: data.difference,
          whoPays: data.whoPays,
          reason: data.reason,
        },
      },
    });

    // Move old item to Damaged Warehouse
    try {
      await createStockLedgerEntry({
        referenceType: 'EXCHANGE_OLD_OUT',
        referenceId: claimId,
        warehouseId: whs['INSP_WH'],
        productId: claim.productId,
        variantId: claim.variantId || null,
        inQty: 0,
        outQty: 1,
        remarks: `Defective unit moved out of Inspection WH`,
      });
      await createStockLedgerEntry({
        referenceType: 'EXCHANGE_OLD_OUT',
        referenceId: claimId,
        warehouseId: whs['DMG_STK'],
        productId: claim.productId,
        variantId: claim.variantId || null,
        inQty: 1,
        outQty: 0,
        unitCost: 0,
        remarks: `Defective unit stored in Damaged Stock`,
      });
    } catch (stockErr: any) {
      console.warn('Exchange old unit transfer failed:', stockErr.message);
    }

    // Move new item out of Replacement Stock Warehouse
    try {
      await createStockLedgerEntry({
        referenceType: 'EXCHANGE_NEW_DELIVERY',
        referenceId: claimId,
        warehouseId: whs['REP_STK'],
        productId: data.replacementProductId,
        variantId: data.replacementVariantId || null,
        inQty: 0,
        outQty: 1,
        remarks: `Issued replacement unit from Replacement Stock`,
      });
    } catch (stockErr: any) {
      // Fallback: Try Main Warehouse
      try {
        await createStockLedgerEntry({
          referenceType: 'EXCHANGE_NEW_DELIVERY',
          referenceId: claimId,
          warehouseId: whs['MAIN_WH'],
          productId: data.replacementProductId,
          variantId: data.replacementVariantId || null,
          inQty: 0,
          outQty: 1,
          remarks: `Issued replacement unit from Main Warehouse`,
        });
      } catch (mainErr: any) {
        console.warn('Replacement unit stock ledger out failed completely:', mainErr.message);
      }
    }

    await appendTimeline(
      claimId,
      'REPLACED',
      `Exchanged for Replacement unit. Calculator details: Delta ৳${data.difference.toLocaleString()} paid by ${data.whoPays}.`
    );

    revalidatePath('/admin/warranty');
    return { success: true, claim };
  } catch (error: any) {
    console.error('Process exchange error:', error);
    return { success: false, error: error.message };
  }
}

// ─── Phase 5: Customer Pickup & OTP ───────────────────────────────────────────

export async function generatePickupOTP(claimId: string) {
  try {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const claim = await prisma.warrantyClaim.findUnique({
      where: { id: claimId },
      select: { pickupDetails: true },
    });

    const currentDetails = claim?.pickupDetails ? (claim.pickupDetails as any) : {};
    await prisma.warrantyClaim.update({
      where: { id: claimId },
      data: {
        pickupDetails: {
          ...currentDetails,
          otp,
          otpGeneratedAt: new Date().toISOString(),
        },
      },
    });

    // TODO: Send OTP via SMS/Telegram integration (do NOT log OTP to console in production)
    // e.g. await sendSMS(customerPhone, `Your TechHat pickup OTP is: ${otp}`)

    await appendTimeline(claimId, 'WAITING_CUSTOMER_APPROVAL', `Delivery OTP generated & sent to customer.`);

    return { success: true, otp }; // Return for admin visibility in testing
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function processPickupClosure(
  claimId: string,
  data: {
    otp: string;
    signature: string;
    photoProof?: string;
  }
) {
  try {
    const whs = await ensureAfterSalesWarehouses();
    const claim = await prisma.warrantyClaim.findUnique({
      where: { id: claimId },
    });
    if (!claim) return { success: false, error: 'Claim not found' };

    const pickupObj = claim.pickupDetails ? (claim.pickupDetails as any) : {};
    if (pickupObj.otp !== data.otp) {
      return { success: false, error: 'Invalid OTP' };
    }

    const updated = await prisma.warrantyClaim.update({
      where: { id: claimId },
      data: {
        status: 'CLOSED',
        pickupDetails: {
          ...pickupObj,
          signature: data.signature,
          photoProof: data.photoProof || null,
          deliveredAt: new Date().toISOString(),
          verified: true,
        },
      },
    });

    // Move out of Warranty Collection (Customer took possession)
    try {
      await createStockLedgerEntry({
        referenceType: 'WARRANTY_DELIVERY',
        referenceId: claimId,
        warehouseId: whs['WAR_COLL'],
        productId: claim.productId,
        variantId: claim.variantId || null,
        inQty: 0,
        outQty: 1,
        remarks: `Delivered unit back to customer`,
      });
    } catch (stockErr: any) {
      console.warn('Final pickup stock ledger delivery failed:', stockErr.message);
    }

    await appendTimeline(
      claimId,
      'CLOSED',
      `Product collected by customer. OTP verified, signature captured. Claim Ticket Closed.`
    );

    revalidatePath('/admin/warranty');
    return { success: true, claim: updated };
  } catch (error: any) {
    console.error('Pickup process closure error:', error);
    return { success: false, error: error.message };
  }
}
