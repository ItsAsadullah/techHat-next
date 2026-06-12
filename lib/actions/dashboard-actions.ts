'use server';

import { prisma } from '@/lib/prisma';
import { unstable_cache } from 'next/cache';

const getDashboardStatsCached = unstable_cache(
  async () => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    const startOf7DaysAgo = new Date(now);
    startOf7DaysAgo.setDate(now.getDate() - 6);
    startOf7DaysAgo.setHours(0, 0, 0, 0);

    const [
      ordersStatsRaw,
      productStatsRaw,
      reviewStatsRaw,
      recentOrders,
      last7DaysSales,
      categorySales,
      topProducts,
    ] = await Promise.all([
      // Consolidated order stats
      prisma.$queryRaw<any[]>`
        SELECT 
          COUNT(*) as "totalOrders",
          SUM(grand_total) as "totalRevenue",
          SUM(CASE WHEN created_at >= ${startOfThisMonth} THEN grand_total ELSE 0 END) as "thisMonthRevenue",
          SUM(CASE WHEN created_at >= ${startOfLastMonth} AND created_at <= ${endOfLastMonth} THEN grand_total ELSE 0 END) as "lastMonthRevenue",
          SUM(CASE WHEN created_at >= ${startOfToday} THEN grand_total ELSE 0 END) as "todayRevenue",
          SUM(CASE WHEN created_at >= ${startOfThisMonth} THEN 1 ELSE 0 END) as "thisMonthOrders",
          SUM(CASE WHEN created_at >= ${startOfToday} THEN 1 ELSE 0 END) as "todayOrders",
          SUM(CASE WHEN is_pos = false AND payment_status = 'PENDING' THEN 1 ELSE 0 END) as "pendingOrders",
          SUM(CASE WHEN is_pos = true THEN paid_amount ELSE 0 END) as "totalPOSRevenue",
          SUM(CASE WHEN is_pos = true THEN due_amount ELSE 0 END) as "totalPOSDue"
        FROM orders
      `,
      
      // Consolidated product stats
      prisma.$queryRaw<any[]>`
        SELECT 
          COUNT(*) as "totalProducts",
          SUM(CASE WHEN stock <= 5 AND stock > 0 THEN 1 ELSE 0 END) as "lowStockProducts",
          SUM(CASE WHEN stock = 0 THEN 1 ELSE 0 END) as "outOfStockProducts"
        FROM products
        WHERE "isActive" = true
      `,
      
      // Consolidated review stats
      prisma.$queryRaw<any[]>`
        SELECT 
          COUNT(*) as "totalReviews",
          SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) as "pendingReviews"
        FROM reviews
      `,

      // Recent 10 orders
      prisma.order.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          orderNumber: true,
          customerName: true,
          grandTotal: true,
          paidAmount: true,
          dueAmount: true,
          paymentMethod: true,
          paymentStatus: true,
          posPaymentStatus: true,
          isPos: true,
          createdAt: true,
          items: { select: { productName: true, quantity: true }, take: 1 },
        },
      }),

      // Last 7 days daily grouped sales - optimized with raw SQL
      prisma.$queryRaw`
        SELECT 
          DATE("created_at") as "createdAt",
          SUM("grand_total")::integer as sales,
          COUNT(id)::integer as orders
        FROM "orders"
        WHERE "created_at" >= ${startOf7DaysAgo}
        GROUP BY DATE("created_at")
        ORDER BY DATE("created_at") ASC
      `,

      // Sales by category (top 6) - using Prisma include to avoid N+1
      (async () => {
        const items = await prisma.orderItem.groupBy({
          by: ['productId'],
          _sum: { total: true },
          orderBy: { _sum: { total: 'desc' } },
          take: 100, // Get top 100 then group by category
        });
        
        // Fetch product categories in one query
        const products = await prisma.product.findMany({
          where: { id: { in: items.map((i) => i.productId).filter(Boolean) as string[] } },
          select: { id: true, categoryId: true },
        });

        // Fetch categories in another single query
        const categories = await prisma.category.findMany({
          select: { id: true, name: true },
        });

        // Group by category
        const catMap: Record<string, number> = {};
        items.forEach((item) => {
          const prod = products.find((p) => p.id === item.productId);
          if (!prod) return;
          const cat = categories.find((c) => c.id === prod.categoryId);
          const catName = cat?.name || 'Other';
          catMap[catName] = (catMap[catName] || 0) + (item._sum.total || 0);
        });

        return Object.entries(catMap)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 6)
          .map(([name, value]) => ({ name, value: Math.round(value) }));
      })(),

      // Top 5 selling products
      prisma.orderItem.groupBy({
        by: ['productName'],
        _sum: { total: true, quantity: true },
        orderBy: { _sum: { total: 'desc' } },
        take: 5,
      }),
    ]);

    // Build last 7 days chart data
    const dailySalesMap: Record<string, { sales: number; orders: number }> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const key = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      dailySalesMap[key] = { sales: 0, orders: 0 };
    }
    
    (last7DaysSales as any[]).forEach((row: { createdAt: Date | string; sales?: number; orders?: number; _sum?: { grandTotal: number | null }; _count?: { id: number } }) => {
      const d = new Date(typeof row.createdAt === 'string' ? row.createdAt : row.createdAt);
      const key = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      if (dailySalesMap[key]) {
        // Handle both raw query and groupBy formats
        dailySalesMap[key].sales += (row.sales !== undefined ? row.sales : row._sum?.grandTotal) || 0;
        dailySalesMap[key].orders += (row.orders !== undefined ? row.orders : row._count?.id) || 0;
      }
    });
    
    const salesChartData = Object.entries(dailySalesMap).map(([name, v]) => ({
      name: name.split(',')[0], // "Mon", "Tue" etc
      sales: Math.round(v.sales),
      orders: v.orders,
    }));

    const os = ordersStatsRaw?.[0] || {};
    const ps = productStatsRaw?.[0] || {};
    const rs = reviewStatsRaw?.[0] || {};

    const thisMonthRev = Number(os.thisMonthRevenue || 0);
    const lastMonthRev = Number(os.lastMonthRevenue || 0);
    const revenueGrowth =
      lastMonthRev === 0 ? 100 : Math.round(((thisMonthRev - lastMonthRev) / lastMonthRev) * 100);

    return {
      stats: {
        totalRevenue: Number(os.totalRevenue || 0),
        thisMonthRevenue: thisMonthRev,
        lastMonthRevenue: lastMonthRev,
        revenueGrowth,
        todayRevenue: Number(os.todayRevenue || 0),
        totalOrders: Number(os.totalOrders || 0),
        thisMonthOrders: Number(os.thisMonthOrders || 0),
        pendingOrders: Number(os.pendingOrders || 0),
        todayOrders: Number(os.todayOrders || 0),
        totalPOSRevenue: Number(os.totalPOSRevenue || 0),
        totalPOSDue: Number(os.totalPOSDue || 0),
        totalProducts: Number(ps.totalProducts || 0),
        lowStockProducts: Number(ps.lowStockProducts || 0),
        outOfStockProducts: Number(ps.outOfStockProducts || 0),
        pendingReviews: Number(rs.pendingReviews || 0),
        totalReviews: Number(rs.totalReviews || 0),
      },
      salesChartData,
      categorySales,
      topProducts: topProducts.map((p: { productName: string; _sum: { total: number | null; quantity: number | null } }) => ({
        name: p.productName,
        qty: p._sum.quantity || 0,
        revenue: Math.round(p._sum.total || 0),
      })),
      recentOrders: recentOrders.map((o: typeof recentOrders[number]) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        customerName: o.customerName || 'Guest',
        firstItem: o.items[0]?.productName || '—',
        grandTotal: o.grandTotal,
        paidAmount: o.paidAmount,
        dueAmount: o.dueAmount,
        paymentMethod: o.paymentMethod,
        paymentStatus: o.paymentStatus,
        posPaymentStatus: o.posPaymentStatus,
        isPos: o.isPos,
        createdAt: o.createdAt,
      })),
    };
  },
  ['dashboard-stats'],
  {
    revalidate: 300,
    tags: ['dashboard-stats'],
  }
);

export async function getDashboardStats() {
  try {
    return await getDashboardStatsCached();
  } catch (error: any) {
    console.error('getDashboardStats error:', error);
    return {
      stats: { totalRevenue: 0, thisMonthRevenue: 0, lastMonthRevenue: 0, revenueGrowth: 0, todayRevenue: 0, totalOrders: 0, thisMonthOrders: 0, pendingOrders: 0, todayOrders: 0, totalPOSRevenue: 0, totalPOSDue: 0, totalProducts: 0, lowStockProducts: 0, outOfStockProducts: 0, pendingReviews: 0, totalReviews: 0 },
      salesChartData: [],
      categorySales: [],
      topProducts: [],
      recentOrders: [],
    };
  }
}
