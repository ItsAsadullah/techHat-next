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
    where.date = {};
    if (dateFrom) (where.date as any).gte = new Date(dateFrom);
    if (dateTo) (where.date as any).lte = new Date(dateTo + 'T23:59:59.999Z');
  }
  if (warehouseId) where.warehouseId = warehouseId;
  if (productId) where.productId = productId;
  if (referenceType) where.referenceType = referenceType as any;

  if (search) {
    where.OR = [
      { note: { contains: search, mode: 'insensitive' } },
      { referenceId: { contains: search, mode: 'insensitive' } },
      { product: { name: { contains: search, mode: 'insensitive' } } },
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
        product: { select: { id: true, name: true, sku: true } },
        productVariant: { select: { id: true, name: true, sku: true } },
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
    orderBy: { date: 'desc' },
    take: limit,
    include: {
      warehouse: { select: { name: true } },
    },
  });
}

// Export to CSV: returns raw data for streaming
export async function exportLedgerCSV(filter: LedgerFilter = {}) {
  const { entries } = await getStockLedger({ ...filter, limit: 10000, page: 1 });

  const headers = [
    'Date', 'Warehouse', 'Reference Type', 'Reference ID',
    'Product', 'SKU', 'Variant', 'Opening Qty', 'In Qty', 'Out Qty',
    'Closing Qty', 'Unit Cost', 'Total Value', 'Remarks'
  ];

  const rows = entries.map((e) => [
    new Date(e.date).toLocaleDateString('en-BD'),
    e.warehouseId,
    e.referenceType,
    e.referenceId,
    e.product.name,
    e.product.sku || '',
    e.productVariant?.name || '',
    e.openingQty,
    e.inQty,
    e.outQty,
    e.balanceQty,
    e.unitCost.toFixed(2),
    e.totalValue.toFixed(2),
    e.remarks || '',
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
  ].join('\n');

  return { success: true, csv: csvContent };
}
