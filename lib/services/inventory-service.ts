import { prisma } from '@/lib/prisma';

export interface StockInfo {
  physicalStock: number;
  reservedStock: number;
  availableStock: number;
}

export const InventoryService = {
  /**
   * Get available stock reading directly from the Product/Variant stock field.
   */
  async getAvailableStock(productId: string, variantId?: string | null, warehouseId?: string): Promise<StockInfo> {
    let physicalStock = 0;
    
    if (variantId) {
      const variant = await prisma.variant.findUnique({ where: { id: variantId }, select: { stock: true } });
      physicalStock = variant?.stock || 0;
    } else {
      const product = await prisma.product.findUnique({ where: { id: productId }, select: { stock: true } });
      physicalStock = product?.stock || 0;
    }

    // No reservation logic in the current schema
    const reservedStock = 0;
    const availableStock = Math.max(0, physicalStock - reservedStock);

    return { physicalStock, reservedStock, availableStock };
  },

  /**
   * Bulk calculate physical stock from Product/Variant models.
   * Returns a Map with a composite key: variantId ? `${productId}-${variantId}` : productId
   */
  async getBulkAvailableStock(items: { productId: string, variantId?: string | null }[], warehouseId?: string): Promise<Map<string, StockInfo>> {
    if (!items.length) return new Map();

    const productIds = Array.from(new Set(items.map(i => i.productId)));
    const variantIds = Array.from(new Set(items.filter(i => i.variantId).map(i => i.variantId as string)));
    
    const [products, variants] = await Promise.all([
      prisma.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, stock: true }
      }),
      variantIds.length > 0 ? prisma.variant.findMany({
        where: { id: { in: variantIds } },
        select: { id: true, productId: true, stock: true }
      }) : Promise.resolve([])
    ]);

    const productMap = new Map(products.map(p => [p.id, p.stock]));
    const variantMap = new Map(variants.map(v => [`${v.productId}-${v.id}`, v.stock]));

    const resultMap = new Map<string, StockInfo>();

    for (const item of items) {
      const key = item.variantId ? `${item.productId}-${item.variantId}` : item.productId;
      const physicalStock = item.variantId ? (variantMap.get(key) || 0) : (productMap.get(item.productId) || 0);
      
      const reservedStock = 0;
      const availableStock = Math.max(0, physicalStock - reservedStock);

      resultMap.set(key, { physicalStock, reservedStock, availableStock });
    }

    return resultMap;
  }
};
