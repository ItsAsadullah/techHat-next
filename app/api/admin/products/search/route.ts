import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q') || '';
  const filter = req.nextUrl.searchParams.get('filter') || 'all'; // in_stock | low_stock | out_of_stock | top_selling | recently_added
  const limit = Math.min(parseInt(req.nextUrl.searchParams.get('limit') || '30'), 100);
  const excludeId = req.nextUrl.searchParams.get('excludeId') || '';
  const mode = req.nextUrl.searchParams.get('mode') || 'default';

  try {
    if (mode === 'warranty') {
      const sanitized = q.trim();
      const whereClause: any = {
        order: {
          status: { in: ['DELIVERED', 'COMPLETED', 'CONFIRMED', 'PENDING', 'PROCESSING', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY'] },
        },
        product: {
          OR: [
            { trackWarranty: true },
            { warrantyMonths: { gt: 0 } }
          ]
        }
      };

      if (sanitized.length > 0) {
        // Fetch serial numbers matching q
        const matchingSerials = await prisma.productSerial.findMany({
          where: {
            serialNumber: { contains: sanitized, mode: 'insensitive' }
          },
          select: { orderId: true }
        });
        const serialOrderIds = matchingSerials.map(s => s.orderId).filter(Boolean) as string[];

        whereClause.OR = [
          { order: { orderNumber: { contains: sanitized, mode: 'insensitive' } } },
          { order: { customerName: { contains: sanitized, mode: 'insensitive' } } },
          { order: { customerPhone: { contains: sanitized, mode: 'insensitive' } } },
          { product: { name: { contains: sanitized, mode: 'insensitive' } } },
          { product: { sku: { contains: sanitized, mode: 'insensitive' } } },
          { product: { barcode: { contains: sanitized, mode: 'insensitive' } } },
          { product: { model: { contains: sanitized, mode: 'insensitive' } } },
          { product: { brand: { name: { contains: sanitized, mode: 'insensitive' } } } },
          { variant: { sku: { contains: sanitized, mode: 'insensitive' } } },
          { variant: { upc: { contains: sanitized, mode: 'insensitive' } } },
          { orderId: { in: serialOrderIds } }
        ];
      }

      const orderItems = await prisma.orderItem.findMany({
        where: whereClause,
        take: limit,
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          order: {
            include: {
              WarrantyClaim: {
                include: {
                  repairJob: true
                }
              }
            }
          },
          product: {
            include: {
              brand: true,
              category: true,
              productImages: {
                where: { isThumbnail: true },
                select: { url: true },
                take: 1,
              },
              WarrantyClaim: {
                include: {
                  repairJob: true
                }
              }
            }
          },
          variant: true
        }
      });

      // Fetch product serials for these order items to map them
      const orderIds = orderItems.map(i => i.orderId);
      const productIds = orderItems.map(i => i.productId);
      const productSerials = await prisma.productSerial.findMany({
        where: {
          orderId: { in: orderIds },
          productId: { in: productIds }
        },
        select: { orderId: true, productId: true, variantId: true, serialNumber: true }
      });

      const findSerial = (orderId: string, productId: string, variantId?: string | null) => {
        return productSerials.find(
          s => s.orderId === orderId && s.productId === productId && (variantId ? s.variantId === variantId : true)
        );
      };

      const mapped = orderItems.map((item) => {
        const serialObj = findSerial(item.orderId, item.productId, item.variantId);
        const serialNumber = serialObj?.serialNumber || null;
        const imei = null;

        // Find claims for this item
        const claim = item.product.WarrantyClaim.find(
          c => c.orderId === item.orderId && (item.variantId ? c.variantId === item.variantId : true)
        );

        const purchaseDate = item.order.createdAt;
        const warrantyMonths = item.product.warrantyMonths || 0;
        const expiryDate = new Date(purchaseDate);
        expiryDate.setMonth(expiryDate.getMonth() + warrantyMonths);
        const now = new Date();
        const remainingTime = expiryDate.getTime() - now.getTime();
        const remainingDays = Math.max(0, Math.ceil(remainingTime / (1000 * 60 * 60 * 24)));
        const isExpired = remainingDays <= 0;
        const isExpiringSoon = remainingDays > 0 && remainingDays <= 30;

        let warrantyStatus = 'active';
        let currentStatus = 'Warranty Active';
        if (isExpired) {
          warrantyStatus = 'expired';
          currentStatus = 'Expired';
        } else if (isExpiringSoon) {
          warrantyStatus = 'expiring_soon';
          currentStatus = 'Expiring Soon';
        }

        if (claim) {
          if (claim.status === 'CLOSED') {
            currentStatus = 'Collected';
          } else if (claim.status === 'READY_FOR_PICKUP') {
            currentStatus = 'Ready For Pickup';
          } else if (claim.status === 'REPAIR_IN_PROGRESS' || (claim.repairJob && claim.repairJob.status !== 'CLOSED' && claim.repairJob.status !== 'READY')) {
            currentStatus = 'Repair Running';
          } else {
            currentStatus = 'Already Claimed';
          }
        }

        const thumbUrl = item.variant?.image || item.product.productImages[0]?.url || item.product.images[0] || null;

        return {
          id: `${item.orderId}-${item.productId}-${item.variantId || 'base'}`,
          orderId: item.orderId,
          productId: item.productId,
          variantId: item.variantId,
          productName: item.productName,
          sku: item.variant?.sku || item.product.sku,
          barcode: item.variant?.upc || item.product.barcode,
          image: thumbUrl,
          customerName: item.order.customerName,
          customerPhone: item.order.customerPhone,
          customerEmail: item.order.customerEmail,
          invoiceNumber: item.order.orderNumber,
          purchaseDate,
          warrantyMonths,
          warrantyType: item.product.warrantyType || 'Service Warranty',
          serialNumber,
          imei,
          supplierId: item.product.defaultSupplierId,
          brandName: item.product.brand?.name || 'Generic',
          warrantyRemainingDays: remainingDays,
          warrantyStatus,
          claimStatus: claim?.status || null,
          currentStatus,
          claim,
        };
      });

      // Filters
      let filteredMapped = mapped;
      if (filter === 'warranty_active') {
        filteredMapped = mapped.filter(item => item.warrantyStatus === 'active' || item.warrantyStatus === 'expiring_soon');
      } else if (filter === 'expiring_soon') {
        filteredMapped = mapped.filter(item => item.warrantyStatus === 'expiring_soon');
      } else if (filter === 'ready_pickup') {
        filteredMapped = mapped.filter(item => item.claimStatus === 'READY_FOR_PICKUP');
      } else if (filter === 'repair_running') {
        filteredMapped = mapped.filter(item => item.currentStatus === 'Repair Running');
      } else if (filter === 'already_claimed') {
        filteredMapped = mapped.filter(item => item.claimStatus !== null);
      } else if (filter === 'my_claims') {
        filteredMapped = mapped.filter(item => item.claimStatus !== null && item.claimStatus !== 'CLOSED');
      }

      // Counts
      const counts = {
        all: mapped.length,
        warranty_active: mapped.filter(item => item.warrantyStatus === 'active' || item.warrantyStatus === 'expiring_soon').length,
        expiring_soon: mapped.filter(item => item.warrantyStatus === 'expiring_soon').length,
        recently_sold: mapped.length,
        ready_pickup: mapped.filter(item => item.claimStatus === 'READY_FOR_PICKUP').length,
        repair_running: mapped.filter(item => item.currentStatus === 'Repair Running').length,
        already_claimed: mapped.filter(item => item.claimStatus !== null).length,
        my_claims: mapped.filter(item => item.claimStatus !== null && item.claimStatus !== 'CLOSED').length,
      };

      return NextResponse.json({ products: filteredMapped, total: filteredMapped.length, counts });
    }

    const baseWhere: any = {
      status: 'ACTIVE',
    };

    if (excludeId) {
      baseWhere.id = { not: excludeId };
    }

    // Text search
    if (q.trim().length > 0) {
      const sanitized = q.trim().replace(/[\r\n]+/g, '');
      baseWhere.OR = [
        { name: { contains: sanitized, mode: 'insensitive' } },
        { sku: { contains: sanitized, mode: 'insensitive' } },
        { barcode: { contains: sanitized, mode: 'insensitive' } },
        { model: { contains: sanitized, mode: 'insensitive' } },
        { brand: { is: { name: { contains: sanitized, mode: 'insensitive' } } } },
        { category: { is: { name: { contains: sanitized, mode: 'insensitive' } } } },
        { variants: { some: { sku: { contains: sanitized, mode: 'insensitive' } } } },
        { variants: { some: { upc: { contains: sanitized, mode: 'insensitive' } } } },
      ];
    }

    // Ordering
    let orderBy: any = { soldCount: 'desc' };
    if (filter === 'recently_added') orderBy = { createdAt: 'desc' };
    if (filter === 'top_selling') orderBy = { soldCount: 'desc' };
    if (q.trim().length === 0 && filter === 'in_stock') orderBy = { soldCount: 'desc' };

    // Fetch counts in parallel
    const [allCount, inStockCount, lowStockCount, outOfStockCount] = await Promise.all([
      prisma.product.count({ where: baseWhere }),
      prisma.product.count({ where: { ...baseWhere, stock: { gt: 0 } } }),
      prisma.product.count({ where: { ...baseWhere, stock: { gt: 0, lte: 5 } } }),
      prisma.product.count({ where: { ...baseWhere, stock: { lte: 0 } } })
    ]);

    const counts = {
      all: allCount,
      in_stock: inStockCount,
      low_stock: lowStockCount,
      out_of_stock: outOfStockCount,
      top_selling: allCount,
      recently_added: allCount,
    };

    // Apply specific filter to baseWhere for fetching actual items
    if (filter === 'in_stock') baseWhere.stock = { gt: 0 };
    else if (filter === 'low_stock') baseWhere.stock = { gt: 0, lte: 5 };
    else if (filter === 'out_of_stock') baseWhere.stock = { lte: 0 };

    const products = await prisma.product.findMany({
      where: baseWhere,
      take: limit,
      orderBy,
      select: {
        id: true,
        name: true,
        sku: true,
        barcode: true,
        model: true,
        price: true,
        offerPrice: true,
        costPrice: true,
        stock: true,
        minStock: true,
        soldCount: true,
        warrantyMonths: true,
        warrantyType: true,
        brand: { select: { id: true, name: true } },
        category: { select: { id: true, name: true } },
        productImages: {
          where: { isThumbnail: true },
          select: { url: true },
          take: 1,
        },
        images: true,
        variants: {
          select: {
            id: true,
            name: true,
            sku: true,
            upc: true,
            price: true,
            offerPrice: true,
            costPrice: true,
            stock: true,
            image: true,
          },
        },
      },
    });

    // Score + sort when querying
    const mapped = products.map((p) => {
      const thumbUrl = p.productImages[0]?.url || p.images[0] || null;
      const threshold = p.minStock || 5;
      const stockStatus =
        p.stock <= 0 ? 'out_of_stock'
        : p.stock <= threshold ? 'low_stock'
        : 'in_stock';

      return {
        id: p.id,
        name: p.name,
        sku: p.sku,
        barcode: p.barcode,
        model: p.model,
        price: p.price,
        offerPrice: p.offerPrice,
        costPrice: p.costPrice,
        stock: p.stock,
        minStock: p.minStock,
        soldCount: p.soldCount,
        stockStatus,
        warrantyMonths: p.warrantyMonths,
        warrantyType: p.warrantyType,
        image: thumbUrl,
        brandId: p.brand?.id || null,
        brandName: p.brand?.name || null,
        categoryId: p.category?.id || null,
        categoryName: p.category?.name || null,
        variants: p.variants,
      };
    });

    // Client-side score sort when there's a search query
    if (q.trim().length > 0) {
      const query = q.trim().toLowerCase();
      const score = (p: (typeof mapped)[0]) => {
        let s = 0;
        const name = p.name.toLowerCase();
        const sku = p.sku?.toLowerCase() || '';
        const barcode = p.barcode?.toLowerCase() || '';
        const model = p.model?.toLowerCase() || '';
        if (model === query) s += 1200;
        else if (model.startsWith(query)) s += 600;
        else if (model.includes(query)) s += 120;
        if (sku === query || barcode === query) s += 1000;
        else if (sku.startsWith(query) || barcode.startsWith(query)) s += 500;
        else if (sku.includes(query) || barcode.includes(query)) s += 80;
        if (name === query) s += 800;
        else if (name.startsWith(query)) s += 400;
        else if (name.includes(query)) s += 60;
        for (const v of p.variants) {
          const vsku = v.sku?.toLowerCase() || '';
          const vupc = (v as any).upc?.toLowerCase() || '';
          if (vsku === query || vupc === query) s += 900;
          else if (vsku.startsWith(query) || vupc.startsWith(query)) s += 450;
          else if (vsku.includes(query) || vupc.includes(query)) s += 50;
        }
        return s;
      };
      mapped.sort((a, b) => score(b) - score(a));
    }

    return NextResponse.json({ products: mapped, total: mapped.length, counts });
  } catch (error: any) {
    console.error('[ProductSearch API]', error);
    return NextResponse.json({ products: [], total: 0, error: error.message }, { status: 500 });
  }
}
