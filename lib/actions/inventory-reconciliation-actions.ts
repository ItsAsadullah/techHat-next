'use server';

import { prisma } from '@/lib/prisma';
import { createStockLedgerEntry } from '@/lib/actions/stock-ledger-actions';
import {
  activeWarehouse,
  inventoryNumber,
  inventoryProduct,
  inventoryTransaction,
  refreshInventory,
  requireInventoryUser,
  syncInventoryReservations,
  transferAvailable,
  warehouseQuantity,
} from '@/lib/inventory/server';

export interface ReconciliationItemRow {
  key: string;
  productId: string;
  variantId: string | null;
  productName: string;
  variantName: string | null;
  sku: string;
  categoryName: string;
  warehouseId: string;
  warehouseName: string;
  warehouseCode: string;
  totalIn: number;
  totalOut: number;
  ledgerStock: number;
  globalLedgerStock: number;
  catalogStock: number;
  dbDrift: number;
  hasLedgerHistory: boolean;
  unitCost: number;
  sellingPrice: number;
  totalValue: number;
  minStock: number;
  lastMovementAt: string | null;
}

export interface ReconciliationSummary {
  totalItems: number;
  totalLedgerUnits: number;
  totalCatalogUnits: number;
  totalValuation: number;
  driftItemsCount: number;
  untrackedCatalogCount: number;
  lowStockCount: number;
  outOfStockCount: number;
}

export async function getInventoryReconciliationData(params?: {
  warehouseId?: string;
  search?: string;
  categoryId?: string;
}) {
  try {
    const selectedWarehouseId =
      params?.warehouseId && params.warehouseId !== 'ALL' ? params.warehouseId : undefined;
    const search = params?.search?.trim() || '';
    const categoryId =
      params?.categoryId && params.categoryId !== 'ALL' ? params.categoryId : undefined;

    const [rawWarehouses, categories, products, ledgerGroups] = await Promise.all([
      prisma.warehouse.findMany({
        where: { isActive: true },
        orderBy: [{ type: 'asc' }, { name: 'asc' }],
        select: { id: true, name: true, code: true, type: true },
      }),
      prisma.category.findMany({
        orderBy: { name: 'asc' },
        select: { id: true, name: true },
      }),
      prisma.product.findMany({
        where: {
          status: { in: ['ACTIVE', 'DRAFT'] },
          ...(categoryId ? { categoryId } : {}),
          ...(search
            ? {
                OR: [
                  { name: { contains: search, mode: 'insensitive' } },
                  { sku: { contains: search, mode: 'insensitive' } },
                  { variants: { some: { sku: { contains: search, mode: 'insensitive' } } } },
                  { variants: { some: { name: { contains: search, mode: 'insensitive' } } } },
                ],
              }
            : {}),
        },
        select: {
          id: true,
          name: true,
          sku: true,
          stock: true,
          minStock: true,
          costPrice: true,
          price: true,
          offerPrice: true,
          productVariantType: true,
          category: { select: { name: true } },
          variants: {
            orderBy: { name: 'asc' },
            select: {
              id: true,
              name: true,
              sku: true,
              stock: true,
              costPrice: true,
              price: true,
              offerPrice: true,
            },
          },
        },
        orderBy: { name: 'asc' },
      }),
      prisma.stockLedger.groupBy({
        by: ['warehouseId', 'productId', 'variantId'],
        _sum: {
          inQty: true,
          outQty: true,
        },
        _max: {
          createdAt: true,
        },
        _count: {
          id: true,
        },
      }),
    ]);

    const warehouses = rawWarehouses.map((w) => ({
      id: w.id,
      name: w.name,
      code: w.code,
      isDefault: w.type === 'MAIN',
    }));

    const defaultWarehouse = warehouses.find((w) => w.isDefault) || warehouses[0] || null;
    const warehouseMap = new Map(warehouses.map((w) => [w.id, w]));

    const globalLedgerMap = new Map<
      string,
      { totalIn: number; totalOut: number; count: number; lastAt: Date | null }
    >();
    const scopedLedgerMap = new Map<
      string,
      { totalIn: number; totalOut: number; count: number; lastAt: Date | null }
    >();

    for (const group of ledgerGroups) {
      const itemKey = `${group.productId}::${group.variantId || 'SIMPLE'}`;
      const inQty = group._sum.inQty ?? 0;
      const outQty = group._sum.outQty ?? 0;
      const count = group._count.id ?? 0;
      const maxDate = group._max.createdAt ?? null;

      const prevGlobal = globalLedgerMap.get(itemKey) || {
        totalIn: 0,
        totalOut: 0,
        count: 0,
        lastAt: null,
      };
      prevGlobal.totalIn += inQty;
      prevGlobal.totalOut += outQty;
      prevGlobal.count += count;
      if (maxDate && (!prevGlobal.lastAt || maxDate > prevGlobal.lastAt)) {
        prevGlobal.lastAt = maxDate;
      }
      globalLedgerMap.set(itemKey, prevGlobal);

      if (!selectedWarehouseId || group.warehouseId === selectedWarehouseId) {
        const prevScoped = scopedLedgerMap.get(itemKey) || {
          totalIn: 0,
          totalOut: 0,
          count: 0,
          lastAt: null,
        };
        prevScoped.totalIn += inQty;
        prevScoped.totalOut += outQty;
        prevScoped.count += count;
        if (maxDate && (!prevScoped.lastAt || maxDate > prevScoped.lastAt)) {
          prevScoped.lastAt = maxDate;
        }
        scopedLedgerMap.set(itemKey, prevScoped);
      }
    }

    const activeWarehouseObj = selectedWarehouseId
      ? warehouseMap.get(selectedWarehouseId)
      : null;

    const rows: ReconciliationItemRow[] = [];

    for (const product of products) {
      const categoryName = product.category?.name || 'Uncategorized';
      const minStock = product.minStock ?? 5;

      if (product.variants.length > 0) {
        for (const variant of product.variants) {
          const itemKey = `${product.id}::${variant.id}`;
          const globalStat = globalLedgerMap.get(itemKey);
          const scopedStat = scopedLedgerMap.get(itemKey);

          const totalIn = scopedStat?.totalIn ?? 0;
          const totalOut = scopedStat?.totalOut ?? 0;
          const ledgerStock = totalIn - totalOut;
          const globalLedgerStock = (globalStat?.totalIn ?? 0) - (globalStat?.totalOut ?? 0);
          const catalogStock = variant.stock ?? 0;
          const hasLedgerHistory = (globalStat?.count ?? 0) > 0;
          const dbDrift = catalogStock - globalLedgerStock;

          const unitCost = variant.costPrice ?? product.costPrice ?? 0;
          const sellingPrice =
            variant.offerPrice ?? variant.price ?? product.offerPrice ?? product.price ?? 0;

          rows.push({
            key: `${selectedWarehouseId || 'ALL'}::${itemKey}`,
            productId: product.id,
            variantId: variant.id,
            productName: product.name,
            variantName: variant.name,
            sku: variant.sku || product.sku || 'N/A',
            categoryName,
            warehouseId: selectedWarehouseId || defaultWarehouse?.id || 'ALL',
            warehouseName: activeWarehouseObj?.name || 'সকল ওয়্যারহাউস (সম্মিলিত)',
            warehouseCode: activeWarehouseObj?.code || 'ALL',
            totalIn,
            totalOut,
            ledgerStock,
            globalLedgerStock,
            catalogStock,
            dbDrift,
            hasLedgerHistory,
            unitCost,
            sellingPrice,
            totalValue: ledgerStock * unitCost,
            minStock,
            lastMovementAt: scopedStat?.lastAt ? scopedStat.lastAt.toISOString() : null,
          });
        }
      } else {
        const itemKey = `${product.id}::SIMPLE`;
        const globalStat = globalLedgerMap.get(itemKey);
        const scopedStat = scopedLedgerMap.get(itemKey);

        const totalIn = scopedStat?.totalIn ?? 0;
        const totalOut = scopedStat?.totalOut ?? 0;
        const ledgerStock = totalIn - totalOut;
        const globalLedgerStock = (globalStat?.totalIn ?? 0) - (globalStat?.totalOut ?? 0);
        const catalogStock = product.stock ?? 0;
        const hasLedgerHistory = (globalStat?.count ?? 0) > 0;
        const dbDrift = catalogStock - globalLedgerStock;

        const unitCost = product.costPrice ?? 0;
        const sellingPrice = product.offerPrice ?? product.price ?? 0;

        rows.push({
          key: `${selectedWarehouseId || 'ALL'}::${itemKey}`,
          productId: product.id,
          variantId: null,
          productName: product.name,
          variantName: null,
          sku: product.sku || 'N/A',
          categoryName,
          warehouseId: selectedWarehouseId || defaultWarehouse?.id || 'ALL',
          warehouseName: activeWarehouseObj?.name || 'সকল ওয়্যারহাউস (সম্মিলিত)',
          warehouseCode: activeWarehouseObj?.code || 'ALL',
          totalIn,
          totalOut,
          ledgerStock,
          globalLedgerStock,
          catalogStock,
          dbDrift,
          hasLedgerHistory,
          unitCost,
          sellingPrice,
          totalValue: ledgerStock * unitCost,
          minStock,
          lastMovementAt: scopedStat?.lastAt ? scopedStat.lastAt.toISOString() : null,
        });
      }
    }

    const summary: ReconciliationSummary = {
      totalItems: rows.length,
      totalLedgerUnits: rows.reduce((sum, r) => sum + r.ledgerStock, 0),
      totalCatalogUnits: rows.reduce((sum, r) => sum + r.catalogStock, 0),
      totalValuation: rows.reduce((sum, r) => sum + r.totalValue, 0),
      driftItemsCount: rows.filter((r) => r.dbDrift !== 0).length,
      untrackedCatalogCount: rows.filter((r) => !r.hasLedgerHistory && r.catalogStock > 0).length,
      lowStockCount: rows.filter((r) => r.ledgerStock > 0 && r.ledgerStock <= r.minStock).length,
      outOfStockCount: rows.filter((r) => r.ledgerStock <= 0).length,
    };

    return {
      success: true,
      warehouses,
      categories,
      defaultWarehouseId: defaultWarehouse?.id || '',
      rows,
      summary,
    };
  } catch (error: any) {
    console.error('Error in getInventoryReconciliationData:', error);
    return {
      success: false,
      error: error.message || 'ইনভেন্টরি হিসাব লোড করতে সমস্যা হয়েছে।',
      warehouses: [] as { id: string; name: string; code: string; isDefault: boolean }[],
      categories: [] as { id: string; name: string }[],
      defaultWarehouseId: '',
      rows: [] as ReconciliationItemRow[],
      summary: {
        totalItems: 0,
        totalLedgerUnits: 0,
        totalCatalogUnits: 0,
        totalValuation: 0,
        driftItemsCount: 0,
        untrackedCatalogCount: 0,
        lowStockCount: 0,
        outOfStockCount: 0,
      } as ReconciliationSummary,
    };
  }
}

export async function syncCatalogStockWithLedger(input: {
  mode: 'sync_from_ledger' | 'smart_reconcile';
  warehouseId?: string;
}): Promise<{
  success: boolean;
  error?: string;
  updatedCatalogCount?: number;
  initializedLedgerCount?: number;
}> {
  try {
    const userId = await requireInventoryUser();

    const result = await inventoryTransaction(async (tx) => {
      const targetWarehouse = input.warehouseId
        ? await activeWarehouse(tx, input.warehouseId)
        : await tx.warehouse.findFirst({
            where: { isActive: true },
            orderBy: [{ type: 'asc' }, { createdAt: 'asc' }],
          });

      if (!targetWarehouse) {
        throw new Error('কোনো সক্রিয় ওয়্যারহাউস পাওয়া যায়নি।');
      }

      const [products, ledgerGroups] = await Promise.all([
        tx.product.findMany({
          where: { status: { in: ['ACTIVE', 'DRAFT'] } },
          include: {
            variants: true,
          },
        }),
        tx.stockLedger.groupBy({
          by: ['productId', 'variantId'],
          _sum: { inQty: true, outQty: true },
          _count: { id: true },
        }),
      ]);

      const ledgerMap = new Map<string, { balance: number; count: number }>();
      for (const g of ledgerGroups) {
        const key = `${g.productId}::${g.variantId || 'SIMPLE'}`;
        ledgerMap.set(key, {
          balance: (g._sum.inQty ?? 0) - (g._sum.outQty ?? 0),
          count: g._count.id ?? 0,
        });
      }

      let updatedCatalogCount = 0;
      let initializedLedgerCount = 0;
      const refId = inventoryNumber('SYNC');

      for (const product of products) {
        if (product.variants.length > 0) {
          let productTotalStock = 0;

          for (const variant of product.variants) {
            const key = `${product.id}::${variant.id}`;
            const stat = ledgerMap.get(key) || { balance: 0, count: 0 };

            if (
              input.mode === 'smart_reconcile' &&
              stat.count === 0 &&
              variant.stock > 0
            ) {
              await createStockLedgerEntry(
                {
                  referenceType: 'OPENING_STOCK',
                  referenceId: refId,
                  warehouseId: targetWarehouse.id,
                  productId: product.id,
                  variantId: variant.id,
                  inQty: variant.stock,
                  unitCost: variant.costPrice ?? product.costPrice ?? 0,
                  remarks: 'ক্যাটালগ স্টক থেকে প্রারম্ভিক লেজার সমন্বয় (Auto Opening Sync)',
                  createdBy: userId,
                  affectsGlobalStock: false,
                },
                tx
              );
              productTotalStock += variant.stock;
              initializedLedgerCount++;
            } else {
              const targetStock = Math.max(0, stat.balance);
              if (variant.stock !== targetStock) {
                await tx.variant.update({
                  where: { id: variant.id },
                  data: { stock: targetStock },
                });
                updatedCatalogCount++;
              }
              productTotalStock += targetStock;
            }
          }

          if (product.stock !== productTotalStock) {
            await tx.product.update({
              where: { id: product.id },
              data: { stock: productTotalStock },
            });
            updatedCatalogCount++;
          }
        } else {
          const key = `${product.id}::SIMPLE`;
          const stat = ledgerMap.get(key) || { balance: 0, count: 0 };

          if (
            input.mode === 'smart_reconcile' &&
            stat.count === 0 &&
            product.stock > 0
          ) {
            await createStockLedgerEntry(
              {
                referenceType: 'OPENING_STOCK',
                referenceId: refId,
                warehouseId: targetWarehouse.id,
                productId: product.id,
                variantId: null,
                inQty: product.stock,
                unitCost: product.costPrice ?? 0,
                remarks: 'ক্যাটালগ স্টক থেকে প্রারম্ভিক লেজার সমন্বয় (Auto Opening Sync)',
                createdBy: userId,
                affectsGlobalStock: false,
              },
              tx
            );
            initializedLedgerCount++;
          } else {
            const targetStock = Math.max(0, stat.balance);
            if (product.stock !== targetStock) {
              await tx.product.update({
                where: { id: product.id },
                data: { stock: targetStock },
              });
              updatedCatalogCount++;
            }
          }
        }
      }

      return { updatedCatalogCount, initializedLedgerCount };
    });

    refreshInventory();
    return {
      success: true,
      ...result,
    };
  } catch (error: any) {
    console.error('Error in syncCatalogStockWithLedger:', error);
    return {
      success: false,
      error: error.message || 'ক্যাটালগ ও লেজার স্টক সমন্বয় করতে সমস্যা হয়েছে।',
    };
  }
}

export async function applyPhysicalCountReconciliation(input: {
  warehouseId: string;
  note?: string;
  items: {
    productId: string;
    variantId?: string | null;
    physicalQty: number;
  }[];
}): Promise<{
  success: boolean;
  error?: string;
  referenceNo?: string;
  adjustedCount?: number;
}> {
  try {
    const userId = await requireInventoryUser();
    if (!input.warehouseId || input.warehouseId === 'ALL') {
      throw new Error(
        'বাস্তব স্টক সমন্বয় (Adjustment) পোস্ট করার জন্য একটি নির্দিষ্ট ওয়্যারহাউস নির্বাচন করুন।'
      );
    }

    const cleanItems = input.items.filter(
      (i) => Number.isSafeInteger(i.physicalQty) && i.physicalQty >= 0
    );
    if (cleanItems.length === 0) {
      throw new Error('সমন্বয় করার জন্য অন্তত একটি পণ্যের বাস্তব স্টক সংখ্যা দিন।');
    }

    const result = await inventoryTransaction(async (tx) => {
      const warehouse = await activeWarehouse(tx, input.warehouseId);

      const adjustmentItemsData: {
        productId: string;
        variantId: string | null;
        systemQty: number;
        actualQty: number;
        quantity: number;
        unitCost: number;
      }[] = [];

      for (const item of cleanItems) {
        const productInfo = await inventoryProduct(tx, item.productId, item.variantId);
        const systemQty = await warehouseQuantity(
          tx,
          warehouse.id,
          item.productId,
          item.variantId
        );
        const difference = item.physicalQty - systemQty;

        if (difference === 0) continue;

        if (difference < 0) {
          const { available } = await transferAvailable(
            tx,
            warehouse.id,
            item.productId,
            item.variantId
          );
          if (Math.abs(difference) > available) {
            throw new Error(
              `${productInfo.name}-এর স্টক কমানো সম্ভব নয় কারণ শুধু ${available} ইউনিট ফ্রি আছে (বাকি স্টক অর্ডার বা ট্রান্সফারে রিজার্ভড)।`
            );
          }
        }

        adjustmentItemsData.push({
          productId: item.productId,
          variantId: item.variantId || null,
          systemQty,
          actualQty: item.physicalQty,
          quantity: difference,
          unitCost: productInfo.cost,
        });
      }

      if (adjustmentItemsData.length === 0) {
        throw new Error('প্রদত্ত বাস্তব স্টকের সাথে সিস্টেম স্টকের কোনো পার্থক্য (Variance) নেই।');
      }

      const adjustmentNumber = inventoryNumber('RECON');
      const adjustment = await tx.stockAdjustment.create({
        data: {
          adjustmentNumber,
          warehouseId: warehouse.id,
          reason: 'COUNT',
          status: 'APPROVED',
          note:
            input.note?.trim() ||
            'ইনভেন্টরি হিসাব মেলানো (Physical Stock Reconciliation & Audit)',
          approvedBy: userId,
          items: {
            create: adjustmentItemsData,
          },
        },
      });

      const affectedProducts = new Set<string>();
      for (const item of adjustmentItemsData) {
        await createStockLedgerEntry(
          {
            referenceType: 'ADJUSTMENT',
            referenceId: adjustment.id,
            warehouseId: warehouse.id,
            productId: item.productId,
            variantId: item.variantId,
            inQty: item.quantity > 0 ? item.quantity : 0,
            outQty: item.quantity < 0 ? Math.abs(item.quantity) : 0,
            unitCost: item.unitCost,
            remarks: `Physical Reconciliation (${adjustment.adjustmentNumber}): System ${item.systemQty} -> Physical ${item.actualQty}`,
            createdBy: userId,
          },
          tx
        );
        affectedProducts.add(item.productId);
      }

      for (const productId of affectedProducts) {
        await syncInventoryReservations(tx, productId);
      }

      return {
        referenceNo: adjustment.adjustmentNumber,
        adjustedCount: adjustmentItemsData.length,
      };
    });

    refreshInventory();
    return {
      success: true,
      ...result,
    };
  } catch (error: any) {
    console.error('Error in applyPhysicalCountReconciliation:', error);
    return {
      success: false,
      error: error.message || 'বাস্তব স্টক সমন্বয় করতে সমস্যা হয়েছে।',
    };
  }
}
