import { prisma } from '@/lib/prisma';
import { Prisma, StockLedger } from '@prisma/client';


export type CreateStockLedgerParams = {
  referenceType: string;
  referenceId: string;
  warehouseId: string;
  productId: string;
  variantId?: string | null;
  inQty?: number;
  outQty?: number;
  unitCost?: number;
  remarks?: string;
  createdBy?: string;
  affectsGlobalStock?: boolean;
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
  tx?: Prisma.TransactionClient
): Promise<StockLedger> {
  if (!tx) return prisma.$transaction(client => createStockLedgerEntry(params, client), { isolationLevel: 'Serializable' });
  const db = tx;
  
  const inQty = params.inQty ?? 0;
  const outQty = params.outQty ?? 0;
  
  if (![inQty, outQty].every(q => Number.isSafeInteger(q) && q >= 0) || (inQty > 0) === (outQty > 0)) {
    throw new Error('A stock movement must contain one positive whole-number quantity.');
  }
  if (params.unitCost !== undefined && (!Number.isFinite(params.unitCost) || params.unitCost < 0)) throw new Error('Unit cost must be a non-negative number.');

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
      select: { stock: true, costPrice: true, productId: true }
    });
    if (!variant) throw new Error('Variant not found for Stock Ledger update');
    if (variant.productId !== params.productId) throw new Error('Variant does not belong to this product.');
    
    oldVariantStock = variant.stock;
    // For variable products, we might want to track MAC at the variant level
    // but the global costPrice is usually an average or range. Let's use Variant MAC.
    oldMAC = variant.costPrice || 0;
  }

  // 2. Calculate New Moving Average Cost (MAC)
  let newMAC = oldMAC;
  let transactionUnitCost = params.unitCost ?? oldMAC;

  if (inQty > 0 && params.unitCost !== undefined) {
    // Only inward movements change the Moving Average Cost
    const costStock = params.variantId ? oldVariantStock : oldGlobalStock;
    const oldTotalValue = costStock * oldMAC;
    const newInwardValue = inQty * params.unitCost;
    const newTotalStock = costStock + inQty;
    
    if (newTotalStock > 0) {
      newMAC = (oldTotalValue + newInwardValue) / newTotalStock;
    }
    transactionUnitCost = params.unitCost;
  }

  const totalValue = (inQty > 0 ? inQty : outQty) * transactionUnitCost;

  // 3. Determine Warehouse Opening/Closing Qty
  // Fetch the last ledger entry for this specific Warehouse + Product/Variant
  const warehouseLedger = await db.stockLedger.aggregate({
    where: {
      warehouseId: params.warehouseId,
      productId: params.productId,
      variantId: params.variantId || null
    },
    _sum: { inQty: true, outQty: true }
  });

  const warehouseOpeningQty = (warehouseLedger._sum.inQty ?? 0) - (warehouseLedger._sum.outQty ?? 0);
  const warehouseClosingQty = warehouseOpeningQty + inQty - outQty;

  if (warehouseClosingQty < 0) {
    throw new Error('Stock cannot drop below 0 in the specified warehouse.');
  }

  // 4. Create Immutable Ledger Entry
  const ledgerEntry = await db.stockLedger.create({
    data: {
      referenceType: params.referenceType,
      referenceId: params.referenceId,
      warehouse: { connect: { id: params.warehouseId } },
      product: { connect: { id: params.productId } },
      variant: params.variantId ? { connect: { id: params.variantId } } : undefined,
      inQty: inQty,
      outQty: outQty,
      balanceQty: warehouseClosingQty,
      unitCost: transactionUnitCost,
      totalValue: totalValue,
      note: params.createdBy ? `${params.remarks || ''} [Staff: ${params.createdBy}]` : params.remarks
    }
  });

  // 5. Update Product/Variant Global Cache
  if (params.affectsGlobalStock === false) return ledgerEntry;
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
