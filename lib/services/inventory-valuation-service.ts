import { prisma } from '@/lib/prisma';
import { InventoryService } from './inventory-service';

export interface ValuationReport {
  totalValue: number;
  warehouseValues: Record<string, number>;
  categoryValues: Record<string, number>;
  brandValues: Record<string, number>;
  items: ValuationItem[];
}

export interface ValuationItem {
  productId: string;
  variantId: string | null;
  name: string;
  sku: string | null;
  stock: number;
  unitCost: number; // Moving Average Cost
  totalValue: number;
  warehouseId?: string;
  categoryName?: string;
  brandName?: string;
}

export class InventoryValuationService {
  /**
   * Computes the total inventory value using Moving Average Cost (MAC).
   * Note: This fetches physical stock and multiplies by the current MAC (which is roughly equivalent to last known cost in our current simplified schema or average cost from inward stock ledgers).
   */
  static async getValuationReport(): Promise<ValuationReport> {
    const report: ValuationReport = {
      totalValue: 0,
      warehouseValues: {},
      categoryValues: {},
      brandValues: {},
      items: []
    };

    // 1. Get all products and variants
    const products = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        sku: true,
        costPrice: true,
        category: { select: { name: true } },
        brand: { select: { name: true } },
        variants: {
          select: {
            id: true,
            name: true,
            sku: true,
            costPrice: true
          }
        }
      }
    });

    // 2. Fetch bulk available stock (physical stock per warehouse is also needed to split by warehouse, but currently we just get overall stock)
    // To get per-warehouse value, we should query StockLedger.
    // We will compute physical stock directly from StockLedger group-by
    const stockStats = await prisma.stockLedger.groupBy({
      by: ['productId', 'variantId', 'warehouseId'],
      _sum: { inQty: true, outQty: true },
      // Optional: Average unit cost logic could be computed here, but Prisma groupBy doesn't easily compute weighted averages.
    });

    // Build a cost map
    const costMap = new Map<string, number>();
    for (const p of products) {
      costMap.set(`${p.id}-null`, p.costPrice || 0);
      for (const v of p.variants) {
        costMap.set(`${p.id}-${v.id}`, v.costPrice || 0);
      }
    }

    // Build product metadata map
    const productMeta = new Map<string, any>();
    for (const p of products) {
      productMeta.set(p.id, p);
    }

    for (const stat of stockStats) {
      const inQty = stat._sum.inQty || 0;
      const outQty = stat._sum.outQty || 0;
      const currentStock = inQty - outQty;

      if (currentStock <= 0) continue;

      const pMeta = productMeta.get(stat.productId);
      if (!pMeta) continue;

      const variantId = stat.variantId || 'null';
      const unitCost = costMap.get(`${stat.productId}-${variantId}`) || 0;
      const totalValue = currentStock * unitCost;

      let variantName = '';
      let sku = pMeta.sku;
      if (stat.variantId) {
        const vMeta = pMeta.variants.find((v: any) => v.id === stat.variantId);
        if (vMeta) {
          variantName = ` - ${vMeta.name}`;
          sku = vMeta.sku || sku;
        }
      }

      const categoryName = pMeta.category?.name || 'Uncategorized';
      const brandName = pMeta.brand?.name || 'No Brand';

      const item: ValuationItem = {
        productId: stat.productId,
        variantId: stat.variantId,
        name: pMeta.name + variantName,
        sku,
        stock: currentStock,
        unitCost,
        totalValue,
        warehouseId: stat.warehouseId,
        categoryName,
        brandName
      };

      report.items.push(item);
      report.totalValue += totalValue;

      if (stat.warehouseId) {
        report.warehouseValues[stat.warehouseId] = (report.warehouseValues[stat.warehouseId] || 0) + totalValue;
      }
      report.categoryValues[categoryName] = (report.categoryValues[categoryName] || 0) + totalValue;
      report.brandValues[brandName] = (report.brandValues[brandName] || 0) + totalValue;
    }

    return report;
  }
}
