'use server';

import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { createStockLedgerEntry } from '@/lib/actions/stock-ledger-actions';
import { AccountingEngine } from '@/lib/services/accounting-engine';

export interface GRNItemInput {
  productId: string;
  variantId?: string;
  receivedQty: number;
  rejectedQty: number;
  acceptedQty: number;
  unitCost: number; // Required — cost at time of receipt from PO
  
  // Advanced Tracking
  batchNumber?: string;
  mfgDate?: Date;
  expiryDate?: Date;
  serials?: string[];
  
  imei?: string;
  serialNumber?: string;
}

export interface GRNFormData {
  purchaseOrderId: string;
  supplierId: string;
  warehouseId: string;
  note?: string;
  items: GRNItemInput[];
}

export async function getGRNs({
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
      where.grnNumber = { contains: search, mode: 'insensitive' };
    }
    if (status) {
      where.status = status;
    }

    const skip = (page - 1) * limit;

    const [grns, totalCount] = await Promise.all([
      prisma.goodsReceiveNote.findMany({
        where,
        skip,
        take: limit,
        orderBy: { receivedDate: 'desc' },
        include: {
          supplier: { select: { name: true } },
          warehouse: { select: { name: true } },
          purchaseOrder: { select: { poNumber: true } },
          _count: { select: { items: true } }
        }
      }),
      prisma.goodsReceiveNote.count({ where }),
    ]);

    return {
      success: true,
      data: {
        grns,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page,
      },
    };
  } catch (error: any) {
    console.error('Failed to get GRNs:', error);
    return { success: false, error: error.message };
  }
}

export async function getGRNById(id: string) {
  try {
    const grn = await prisma.goodsReceiveNote.findUnique({
      where: { id },
      include: {
        supplier: true,
        warehouse: true,
        purchaseOrder: true,
        items: {
          include: {
            product: { select: { id: true, name: true, sku: true, stock: true } },
            variant: { select: { id: true, name: true, sku: true, stock: true } }
          }
        }
      },
    });

    if (!grn) throw new Error('GRN not found');

    return { success: true, data: grn };
  } catch (error: any) {
    console.error('Failed to get GRN:', error);
    return { success: false, error: error.message };
  }
}

export async function createGRN(data: GRNFormData) {
  try {
    return await prisma.$transaction(async (tx) => {
      // 1. Generate GRN Number
      const count = await tx.goodsReceiveNote.count();
      const grnNumber = `GRN-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(count + 1).padStart(4, '0')}`;

      // 2. Create GRN Draft — store unitCost on each item at creation time
      const grn = await tx.goodsReceiveNote.create({
        data: {
          grnNumber,
          purchaseOrderId: data.purchaseOrderId,
          supplierId: data.supplierId,
          warehouseId: data.warehouseId,
          note: data.note,
          status: 'DRAFT',
          items: {
            create: data.items.map(item => ({
              product: { connect: { id: item.productId } },
              variant: item.variantId ? { connect: { id: item.variantId } } : undefined,
              receivedQty: item.receivedQty,
              rejectedQty: item.rejectedQty,
              acceptedQty: item.acceptedQty,
              unitCost: item.unitCost, // Stored for accurate MAC calculation at submit time
              
              batchNumber: item.batchNumber,
              mfgDate: item.mfgDate,
              expiryDate: item.expiryDate,
              serials: item.serials || Prisma.JsonNull,
              imei: item.imei,
              serialNumber: item.serialNumber,
            }))
          }
        },
      });

      return { success: true, data: grn };
    });
  } catch (error: any) {
    console.error('Failed to create GRN:', error);
    return { success: false, error: error.message };
  }
}

export async function submitGRN(grnId: string) {
  try {
    return await prisma.$transaction(async (tx) => {
      const grn = await tx.goodsReceiveNote.findUnique({
        where: { id: grnId },
        include: {
          items: { include: { product: true } },
          purchaseOrder: { include: { items: true } }
        }
      });

      if (!grn) throw new Error('GRN not found');
      if (grn.status !== 'DRAFT') throw new Error('Only DRAFT GRN can be submitted');

      // Update GRN Status
      const updatedGrn = await tx.goodsReceiveNote.update({
        where: { id: grnId },
        data: { status: 'RECEIVED' }
      });

      let totalInventoryValue = 0;

      // --- LANDED COST ENGINE ---
      // 1. Calculate Total Base Value of the Purchase Order
      let poTotalBaseValue = 0;
      for (const pi of grn.purchaseOrder.items) {
        const netUnitCost = pi.unitCost - (pi.discount || 0); // discount is per-unit
        poTotalBaseValue += (pi.quantity * netUnitCost);
      }

      // 2. Calculate Total Global Extra Costs (Shipping + Other - Global Discount)
      const globalExtraCost = (grn.purchaseOrder.shippingCost || 0) + (grn.purchaseOrder.otherCost || 0) - (grn.purchaseOrder.discount || 0);

      // 3. Calculate Landed Cost Multiplier
      // If base value is 0 (e.g., all free items), fallback to 1 to prevent division by zero
      const landedCostMultiplier = poTotalBaseValue > 0 ? (poTotalBaseValue + globalExtraCost) / poTotalBaseValue : 1;

      // Process each GRN Item using the canonical Stock Ledger Engine
      for (const item of grn.items) {
        if (item.acceptedQty <= 0) continue;

        // Find matching PO Item to get exact discount/unit cost
        const poItem = grn.purchaseOrder.items.find(
          pi => pi.productId === item.productId &&
            (pi.variantId ?? null) === (item.variantId ?? null)
        );

        // 4. Calculate Net Unit Cost for this specific item
        const netUnitCost = poItem ? (poItem.unitCost - (poItem.discount || 0)) : ((item as any).unitCost || 0);

        // 5. Apply Landed Cost Multiplier to get the final exact cost per piece
        const landedUnitCost = netUnitCost * landedCostMultiplier;

        totalInventoryValue += (item.acceptedQty * landedUnitCost);

        // Update PO Item Received Qty for PO status tracking
        if (poItem) {
          await tx.purchaseOrderItem.update({
            where: { id: poItem.id },
            data: { receivedQty: poItem.receivedQty + item.acceptedQty }
          });
        }

        // Use canonical engine — calculates Moving Average Cost, updates Product/Variant
        // cache stock, and creates the immutable ledger entry atomically.
        await createStockLedgerEntry(
          {
            referenceType: 'GRN',
            referenceId: grn.id,
            warehouseId: grn.warehouseId,
            productId: item.productId,
            variantId: item.variantId || null,
            inQty: item.acceptedQty,
            outQty: 0,
            unitCost: landedUnitCost,
            remarks: `GRN ${grn.grnNumber} received against PO ${grn.purchaseOrder.poNumber} (Landed Cost)`,
          },
          tx
        );
        
        // Advanced Inventory Tracking Processing
        if (item.product.trackSerials && item.serials) {
          const serialsArray = typeof item.serials === 'string' ? JSON.parse(item.serials) : item.serials;
          if (Array.isArray(serialsArray) && serialsArray.length > 0) {
            let warrantyEndDate = null;
            if (item.product.trackWarranty && item.product.warrantyMonths) {
              const d = new Date();
              d.setMonth(d.getMonth() + item.product.warrantyMonths);
              warrantyEndDate = d;
            }
            
            const serialRecords = serialsArray.map((s: string) => ({
              productId: item.productId,
              variantId: item.variantId || null,
              serialNumber: s,
              status: 'AVAILABLE' as any,
              warrantyEndDate,
              grnItemId: item.id
            }));
            
            await tx.productSerial.createMany({ 
              data: serialRecords, 
              skipDuplicates: true 
            });
          }
        }
        
        if (item.product.trackBatch && item.batchNumber) {
          // Prisma syntax for composite unique requires the exact model shape or we can just findFirst and update/create manually to be safe with nullable fields.
          const existingBatch = await tx.productBatch.findFirst({
            where: {
              productId: item.productId,
              variantId: item.variantId || null,
              batchNumber: item.batchNumber
            }
          });
          
          if (existingBatch) {
            await tx.productBatch.update({
              where: { id: existingBatch.id },
              data: { stock: { increment: item.acceptedQty } }
            });
          } else {
            await tx.productBatch.create({
              data: {
                productId: item.productId,
                variantId: item.variantId || null,
                batchNumber: item.batchNumber,
                manufacturingDate: item.mfgDate,
                expiryDate: item.expiryDate,
                stock: item.acceptedQty
              }
            });
          }
        }
      }

      // Update PO Status
      const allPoItems = await tx.purchaseOrderItem.findMany({
        where: { purchaseOrderId: grn.purchaseOrderId }
      });
      const allReceived = allPoItems.every(pi => pi.receivedQty >= pi.quantity);
      await tx.purchaseOrder.update({
        where: { id: grn.purchaseOrderId },
        data: { status: allReceived ? 'RECEIVED' : 'PARTIALLY_RECEIVED' }
      });

      // Accounting Automation
      await AccountingEngine.postGoodsReceipt(tx, {
        grnNumber: grn.grnNumber,
        inventoryValue: totalInventoryValue,
        date: new Date()
      });

      revalidatePath('/admin/purchases/grn');
      revalidatePath('/admin/inventory');

      return { success: true, data: updatedGrn };
    }, { timeout: 30000 });
  } catch (error: any) {
    console.error('Failed to submit GRN:', error);
    return { success: false, error: error.message };
  }
}
