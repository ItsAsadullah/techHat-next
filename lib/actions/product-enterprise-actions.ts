'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath, revalidateTag } from 'next/cache';
import { ProductLifecycleStatus } from '@prisma/client';

// ─── Status helpers ───
// isActive mapping removed as status is now the source of truth


/**
 * Generate a unique SKU using a DB-level sequence.
 * Format: TH-{CategoryShortCode}-{Model}-{6-digit-padded-counter}
 * Example: TH-ROU-F3-000042
 */
export async function generateSKU(
  categoryId?: string,
  model?: string
): Promise<{ success: boolean; sku?: string; error?: string }> {
  try {
    let catCode = 'GEN';
    
    if (categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: categoryId },
        select: { shortCode: true, name: true }
      });
      if (category) {
        if (category.shortCode) {
          catCode = category.shortCode.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
        } else {
          catCode = category.name.replace(/[^a-zA-Z0-9]/g, '').substring(0, 3).toUpperCase();
        }
      }
    }

    const cleanModel = model ? model.replace(/[^a-zA-Z0-9-]/g, '').toUpperCase() : '';
    
    // Build prefix
    const prefixParts = ['TH', catCode];
    if (cleanModel) prefixParts.push(cleanModel);
    
    const prefix = prefixParts.join('-');

    const count = await prisma.product.count();
    const paddedNum = String(count + 1).padStart(6, '0');
    const sku = `${prefix}-${paddedNum}`;

    return { success: true, sku };
  } catch (error: any) {
    console.error('generateSKU error:', error);
    return { success: false, error: error?.message || 'Failed to generate SKU' };
  }
}

/**
 * Generate a standard EAN-13 barcode.
 * Uses a fixed country/company prefix (e.g., 890 for local or custom) 
 * + timestamp-based 8 digits + 1 check digit.
 * Ensures it passes EAN-13 validation.
 */
export async function generateBarcode(): Promise<{ success: boolean; barcode?: string; error?: string }> {
  try {
    // We need 12 digits before the check digit.
    // Let's use 200 (internal use) + 9 random/sequential digits.
    // For simplicity, we'll use 200 + Date.now().toString().slice(-9)
    const prefix = '200';
    const timestampPart = Date.now().toString().slice(-9);
    const twelveDigits = prefix + timestampPart;

    let sum = 0;
    for (let i = 0; i < 12; i++) {
      const digit = parseInt(twelveDigits[i], 10);
      sum += (i % 2 === 0) ? digit : digit * 3;
    }
    const checkDigit = (10 - (sum % 10)) % 10;
    
    const barcode = twelveDigits + checkDigit;

    // Check for uniqueness in DB
    const existing = await prisma.product.findFirst({
      where: { barcode }
    });

    if (existing) {
      // Very rare collision, just retry (recursive)
      return generateBarcode();
    }

    return { success: true, barcode };
  } catch (error: any) {
    console.error('generateBarcode error:', error);
    return { success: false, error: error?.message || 'Failed to generate barcode' };
  }
}

/**
 * Update a product's lifecycle status.
 * Automatically derives isActive from the new status.
 * Writes an audit log entry.
 */
export async function updateProductStatus(
  id: string,
  newStatus: ProductLifecycleStatus,
  changedBy?: string,
  note?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const current = await prisma.product.findUnique({
      where: { id },
      select: { status: true, name: true, slug: true },
    });

    if (!current) return { success: false, error: 'Product not found' };


    await prisma.$transaction([
      prisma.product.update({
        where: { id },
        data: {
          status: newStatus,
        },
      }),
      prisma.productAuditLog.create({
        data: {
          productId: id,
          action: 'status_changed',
          changedBy: changedBy || 'admin',
          changedFields: {
            status: { from: current.status, to: newStatus },
          },
          note: note || `Status changed to ${newStatus}`,
        },
      }),
    ]);

    revalidatePath('/admin/products');
    revalidatePath(`/admin/products/${id}`);
    
    // Revalidate storefront caches
    if (current.slug) {
      revalidatePath(`/products/${current.slug}`);
    }
    revalidatePath('/products');

    return { success: true };
  } catch (error: any) {
    console.error('updateProductStatus error:', error);
    return { success: false, error: error?.message || 'Failed to update status' };
  }
}

/**
 * Get audit history for a product.
 */
export async function getProductHistory(productId: string) {
  try {
    const logs = await prisma.productAuditLog.findMany({
      where: { productId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return { success: true, logs };
  } catch (error: any) {
    console.error('getProductHistory error:', error);
    return { success: false, logs: [], error: error?.message };
  }
}

/**
 * Write an audit log entry for a product.
 */
export async function writeProductAuditLog(
  productId: string,
  action: string,
  changedBy: string,
  changedFields?: Record<string, { from: any; to: any }>,
  note?: string
) {
  try {
    await prisma.productAuditLog.create({
      data: {
        productId,
        action,
        changedBy,
        changedFields: changedFields ? (changedFields as any) : undefined,
        note,
      },
    });
  } catch (e) {
    // Non-blocking — audit log failure should not break the main flow
    console.error('writeProductAuditLog error:', e);
  }
}

/**
 * Get product inventory snapshot (reads from existing stock fields).
 * This is a read-only abstraction layer over current stock data.
 * In future: replace with calls to a dedicated Inventory Module.
 */
export async function getProductInventorySnapshot(productId: string) {
  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: {
        stock: true,
        minStock: true,
        reorderPoint: true,
        safetyStock: true,
        variants: {
          select: {
            id: true,
            name: true,
            sku: true,
            stock: true,
            minStock: true,
          },
        },
      },
    });

    if (!product) return null;

    // Dynamically calculate reserved, incoming, and damaged stock
    const { getReservedStock, getIncomingStock, getDamagedStock } = await import('./reservation-actions');
    const [resReserved, resIncoming, resDamaged] = await Promise.all([
      getReservedStock(productId),
      getIncomingStock(productId),
      getDamagedStock(productId)
    ]);

    const reservedStock = resReserved.data || 0;
    const incomingStock = resIncoming.data || 0;
    const damagedStock = resDamaged.data || 0;

    const totalStock = product.stock;
    const availableStock = Math.max(0, totalStock - reservedStock);

    const isLowStock = availableStock > 0 && availableStock <= (product.minStock ?? 5);
    const isOutOfStock = availableStock <= 0;

    return {
      totalStock, // Physical Stock
      reservedStock,
      availableStock,
      incomingStock,
      damagedStock,
      isLowStock,
      isOutOfStock,
      minStock: product.minStock,
      reorderPoint: product.reorderPoint,
      safetyStock: product.safetyStock,
      variants: product.variants,
    };
  } catch (error: any) {
    console.error('getProductInventorySnapshot error:', error);
    return null;
  }
}

/**
 * Get supplier information for a product.
 */
export async function getProductSuppliers(productId: string) {
  try {
    const suppliers = await prisma.supplierProduct.findMany({
      where: { productId },
      orderBy: [{ price: 'desc' }, { createdAt: 'asc' }],
    });
    return { success: true, suppliers };
  } catch (error: any) {
    return { success: false, suppliers: [], error: error?.message };
  }
}

/**
 * Get full chronological timeline for a product (Audit Logs + Stock Ledger).
 */
export async function getProductFullTimeline(productId: string) {
  try {
    const audits = await prisma.productAuditLog.findMany({
      where: { productId },
      orderBy: { createdAt: 'desc' },
      take: 100
    });

    const ledgers = await prisma.stockLedger.findMany({
      where: { productId },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: { warehouse: { select: { name: true } } }
    });

    // We can also fetch StockHistory (deprecated but still holds old data)
    const history = await prisma.stockHistory.findMany({
      where: { productId },
      orderBy: { createdAt: 'desc' },
      take: 100
    });

    const events: any[] = [];

    audits.forEach(a => {
      events.push({
        id: a.id,
        date: a.createdAt,
        type: 'AUDIT',
        action: a.action,
        user: a.changedBy || 'System',
        description: a.note || `Product ${a.action}`,
        details: a.changedFields
      });
    });

    ledgers.forEach(l => {
      let desc = `Stock Ledger Update in ${l.warehouse?.name || 'Unknown'}`;
      let qtyChange = l.inQty > 0 ? `+${l.inQty}` : `-${l.outQty}`;
      if (l.inQty === 0 && l.outQty === 0) qtyChange = '0';
      
      events.push({
        id: l.id,
        date: l.createdAt,
        type: 'STOCK_LEDGER',
        action: l.referenceType,
        user: 'System',
        description: desc,
        details: { referenceId: l.referenceId, qtyChange, closing: l.balanceQty }
      });
    });

    history.forEach(h => {
      events.push({
        id: h.id,
        date: h.createdAt,
        type: 'LEGACY_STOCK',
        action: h.action,
        user: h.createdBy || h.source || 'System',
        description: h.reason || h.note || 'Legacy Stock Adjustment',
        details: { qty: h.quantity, newStock: h.newStock }
      });
    });

    events.sort((a, b) => b.date.getTime() - a.date.getTime());

    return { success: true, events };
  } catch (error: any) {
    console.error('getProductFullTimeline error:', error);
    return { success: false, events: [], error: error.message };
  }
}
