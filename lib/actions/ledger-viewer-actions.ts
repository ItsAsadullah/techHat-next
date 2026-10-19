'use server';

import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export type LedgerFilter = {
  page?: number;
  limit?: number;
  dateFrom?: string;
  dateTo?: string;
  warehouseId?: string;
  productId?: string;
  referenceType?: string;
  search?: string;
};

export async function getStockLedger(filter: LedgerFilter = {}) {
  const {
    page = 1,
    limit = 50,
    dateFrom,
    dateTo,
    warehouseId,
    productId,
    referenceType,
    search,
  } = filter;

  const where: Prisma.StockLedgerWhereInput = {};

  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) (where.createdAt as any).gte = new Date(dateFrom);
    if (dateTo) (where.createdAt as any).lte = new Date(dateTo + 'T23:59:59.999Z');
  }
  if (warehouseId) where.warehouseId = warehouseId;
  if (productId) where.productId = productId;
  if (referenceType) where.referenceType = referenceType as any;

  if (search && search.trim()) {
    const { buildProductSearchOR } = await import('@/lib/utils/product-search');
    where.OR = [
      { note: { contains: search, mode: 'insensitive' } },
      { referenceId: { contains: search, mode: 'insensitive' } },
      { product: { OR: buildProductSearchOR(search) } },
    ];
  }

  const skip = (page - 1) * limit;

  const [entries, total] = await Promise.all([
    prisma.stockLedger.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        warehouse: { select: { id: true, name: true, code: true } },
        product: { select: { id: true, name: true, sku: true, model: true } },
        variant: { select: { id: true, name: true, sku: true } },
      },
    }),
    prisma.stockLedger.count({ where }),
  ]);

  // Summary aggregations for the filtered period
  const summary = await prisma.stockLedger.aggregate({
    where,
    _sum: {
      inQty: true,
      outQty: true,
      totalValue: true,
    },
    _count: true,
  });

  return {
    success: true,
    entries,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
    summary: {
      totalIn: summary._sum.inQty || 0,
      totalOut: summary._sum.outQty || 0,
      totalValue: summary._sum.totalValue || 0,
      totalEntries: summary._count,
    },
  };
}

export async function getLedgerFilterOptions() {
  const [warehouses, products] = await Promise.all([
    prisma.warehouse.findMany({ where: { isActive: true },
      select: { id: true, name: true, code: true },
      orderBy: { name: 'asc' },
    }),
    prisma.product.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true, name: true, sku: true },
      orderBy: { name: 'asc' },
      take: 500,
    }),
  ]);

  return { warehouses, products };
}

export async function getLedgerForProduct(productId: string, variantId: string, limit = 20) {
  const where: Prisma.StockLedgerWhereInput = { productId };
  if (variantId) where.variantId = variantId;

  return prisma.stockLedger.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      warehouse: { select: { name: true } },
    },
  });
}

// Export to CSV: returns raw data for streaming (with UTF-8 BOM for Excel Bangla/BDT support)
export async function exportLedgerCSV(filter: LedgerFilter = {}) {
  const { entries, summary } = await getStockLedger({ ...filter, limit: 10000, page: 1 });

  const headers = [
    'Date & Time',
    'Warehouse Name',
    'Warehouse Code',
    'Transaction Type',
    'Reference / Note',
    'Product Name',
    'Variant',
    'SKU',
    'Opening Qty',
    'Stock In (+)',
    'Stock Out (-)',
    'Running Balance',
    'Unit Cost (BDT)',
    'Total Value (BDT)',
  ];

  const rows = entries.map((e) => {
    const openingQty = e.balanceQty - e.inQty + e.outQty;
    return [
      new Date(e.createdAt).toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      e.warehouse?.name || '',
      e.warehouse?.code || '',
      e.referenceType,
      e.note || e.referenceId || '',
      e.product.name,
      e.variant?.name || '',
      e.variant?.sku || e.product.sku || '',
      openingQty,
      e.inQty,
      e.outQty,
      e.balanceQty,
      e.unitCost.toFixed(2),
      e.totalValue.toFixed(2),
    ];
  });

  // Add summary footer row
  rows.push([
    'TOTAL SUMMARY',
    '',
    '',
    `${summary.totalEntries} Transactions`,
    '',
    '',
    '',
    '',
    '',
    summary.totalIn,
    summary.totalOut,
    summary.totalIn - summary.totalOut,
    '',
    summary.totalValue.toFixed(2),
  ]);

  const csvContent =
    '\uFEFF' +
    [
      headers.join(','),
      ...rows.map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

  return { success: true, csv: csvContent };
}

export async function getLedgerPDFReportData(filter: LedgerFilter = {}) {
  const { entries, summary } = await getStockLedger({ ...filter, limit: 5000, page: 1 });

  // Build product-wise reconciliation summary from the ledger entries (chronological order)
  const chronological = [...entries].reverse();
  const reconciliationMap = new Map<
    string,
    {
      key: string;
      productId: string;
      variantId: string | null;
      productName: string;
      variantName: string | null;
      sku: string;
      warehouseCode: string;
      warehouseName: string;
      openingStock: number;
      totalIn: number;
      totalOut: number;
      closingStock: number;
      unitCost: number;
      totalValue: number;
      txCount: number;
    }
  >();

  for (const e of chronological) {
    const key = `${e.warehouse.id}_${e.product.id}_${e.variant?.id || 'base'}`;
    const existing = reconciliationMap.get(key);
    const entryOpening = e.balanceQty - e.inQty + e.outQty;

    if (!existing) {
      reconciliationMap.set(key, {
        key,
        productId: e.product.id,
        variantId: e.variant?.id || null,
        productName: e.product.name,
        variantName: e.variant?.name || null,
        sku: e.variant?.sku || e.product.sku || 'N/A',
        warehouseCode: e.warehouse.code,
        warehouseName: e.warehouse.name,
        openingStock: entryOpening,
        totalIn: e.inQty,
        totalOut: e.outQty,
        closingStock: e.balanceQty,
        unitCost: e.unitCost,
        totalValue: e.balanceQty * e.unitCost,
        txCount: 1,
      });
    } else {
      existing.totalIn += e.inQty;
      existing.totalOut += e.outQty;
      existing.closingStock = e.balanceQty;
      if (e.unitCost > 0) {
        existing.unitCost = e.unitCost;
      }
      existing.totalValue = existing.closingStock * existing.unitCost;
      existing.txCount += 1;
    }
  }

  const reconciliationItems = Array.from(reconciliationMap.values()).sort((a, b) =>
    a.productName.localeCompare(b.productName)
  );

  return {
    success: true,
    entries,
    summary,
    reconciliationItems,
  };
}

