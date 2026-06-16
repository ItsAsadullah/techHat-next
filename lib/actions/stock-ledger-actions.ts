import { prisma } from '@/lib/prisma';
import { StockLedgerRefType } from '@prisma/client';

export type CreateStockLedgerParams = {
  referenceType: StockLedgerRefType;
  referenceId: string;
  warehouseId: string;
  productId: string;
  variantId?: string | null;
  inQty?: number;
  outQty?: number;
  unitCost?: number;
  remarks?: string;
  createdBy?: string;
};

/**
 * The Core Engine for Inventory Tracking.
 * Creates an immutable Stock Ledger entry, calculates Moving Average Cost,
 * and updates global Product/Variant cached stock & cost.
 * 
 * Should ideally be run inside a transaction.
 */
export async function createStockLedgerEntry(
  params: CreateStockLedgerParams,
  tx?: any // Prisma.TransactionClient
) {
  const db = tx || prisma;
  
  const inQty = params.inQty || 0;
  const outQty = params.outQty || 0;
  
  if (inQty === 0 && outQty === 0) {
    throw new Error('StockLedger entry must have either inQty or outQty > 0');
  }

  // 1. Fetch current Product & Variant to get the old Moving Average Cost and Global Stock
  const product = await db.product.findUnique({
    where: { id: params.productId },
    select: { stock: true, costPrice: true, productVariantType: true }
  });

  if (!product) throw new Error('Product not found for Stock Ledger update');

  let oldGlobalStock = product.stock;
  let oldMAC = product.costPrice || 0;
  let oldVariantStock = 0;

  if (params.variantId) {
    const variant = await db.variant.findUnique({
      where: { id: params.variantId },
      select: { stock: true, costPrice: true }
    });
    if (!variant) throw new Error('Variant not found for Stock Ledger update');
    
    oldVariantStock = variant.stock;
    // For variable products, we might want to track MAC at the variant level
    // but the global costPrice is usually an average or range. Let's use Variant MAC.
    oldMAC = variant.costPrice || 0;
  }

  // 2. Calculate New Moving Average Cost (MAC)
  let newMAC = oldMAC;
  let transactionUnitCost = params.unitCost || oldMAC;

  if (inQty > 0 && params.unitCost !== undefined) {
    // Only inward movements change the Moving Average Cost
    const oldTotalValue = oldGlobalStock * oldMAC;
    const newInwardValue = inQty * params.unitCost;
    const newTotalStock = oldGlobalStock + inQty;
    
    if (newTotalStock > 0) {
      newMAC = (oldTotalValue + newInwardValue) / newTotalStock;
    }
    transactionUnitCost = params.unitCost;
  }

  const totalValue = (inQty > 0 ? inQty : outQty) * transactionUnitCost;

  // 3. Determine Warehouse Opening/Closing Qty
  // Fetch the last ledger entry for this specific Warehouse + Product/Variant
  const lastLedger = await db.stockLedger.findFirst({
    where: {
      warehouseId: params.warehouseId,
      productId: params.productId,
      variantId: params.variantId || null
    },
    orderBy: { createdAt: 'desc' }
  });

  const warehouseOpeningQty = lastLedger ? lastLedger.closingQty : 0;
  const warehouseClosingQty = warehouseOpeningQty + inQty - outQty;

  if (warehouseClosingQty < 0) {
    throw new Error('Stock cannot drop below 0 in the specified warehouse.');
  }

  // 4. Create Immutable Ledger Entry
  const ledgerEntry = await db.stockLedger.create({
    data: {
      date: new Date(),
      referenceType: params.referenceType,
      referenceId: params.referenceId,
      warehouseId: params.warehouseId,
      productId: params.productId,
      variantId: params.variantId || null,
      openingQty: warehouseOpeningQty,
      inQty: inQty,
      outQty: outQty,
      closingQty: warehouseClosingQty,
      unitCost: transactionUnitCost,
      totalValue: totalValue,
      remarks: params.remarks,
      createdBy: params.createdBy
    }
  });

  // 5. Update Product/Variant Global Cache
  const globalStockDelta = inQty - outQty;

  if (params.variantId) {
    await db.variant.update({
      where: { id: params.variantId },
      data: {
        stock: { increment: globalStockDelta },
        costPrice: newMAC,
        lastPurchaseCost: inQty > 0 ? transactionUnitCost : undefined
      }
    });

    if (product.productVariantType === 'variable') {
      await db.product.update({
        where: { id: params.productId },
        data: {
          stock: { increment: globalStockDelta }
          // Global MAC for variable products can be skipped or averaged
        }
      });
    }
  } else {
    await db.product.update({
      where: { id: params.productId },
      data: {
        stock: { increment: globalStockDelta },
        costPrice: newMAC,
        lastPurchaseCost: inQty > 0 ? transactionUnitCost : undefined
      }
    });
  }

  return ledgerEntry;
}
