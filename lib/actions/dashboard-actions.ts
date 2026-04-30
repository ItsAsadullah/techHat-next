'use server';

import { prisma } from '@/lib/prisma';

// Simple in-memory cache for dashboard stats (expires every 60 seconds)
let cachedStats: any = null;
let cacheTimestamp = 0;
const CACHE_DURATION_MS = 60 * 1000; // 60 seconds

export async function getDashboardStats() {
  const now = Date.now();
  
  // Return cached stats if still valid
  if (cachedStats && (now - cacheTimestamp < CACHE_DURATION_MS)) {
    return cachedStats;
  }

  try {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
  const startOf7DaysAgo = new Date(now);
  startOf7DaysAgo.setDate(now.getDate() - 6);
  startOf7DaysAgo.setHours(0, 0, 0, 0);

  const [
    // Revenue / Sales
    totalRevenue,
    thisMonthRevenue,
    lastMonthRevenue,
    todayRevenue,

    // Orders
    totalOrders,
    thisMonthOrders,
    pendingOrders,
    todayOrders,

    // POS specific
    totalPOSRevenue,
    totalPOSDue,

    // Products
    totalProducts,
    lowStockProducts,
    outOfStockProducts,

    // Reviews
    pendingReviews,
    totalReviews,

    // Recent POS orders
    recentOrders,

    // Last 7 days daily sales
    last7DaysSales,

    // Category sales
    categorySales,

    // Top products
    topProducts,
  ] = await Promise.all([
    // Total revenue (all orders)
    prisma.order.aggregate({ _sum: { grandTotal: true } }),
    // This month revenue
    prisma.order.aggregate({
      _sum: { grandTotal: true },
      where: { createdAt: { gte: startOfThisMonth } },
    }),
    // Last month revenue
    prisma.order.aggregate({
      _sum: { grandTotal: true },
      where: { createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } },
    }),
    // Today revenue
    prisma.order.aggregate({
      _sum: { grandTotal: true },
      where: { createdAt: { gte: startOfToday } },
    }),

    // Total orders
    prisma.order.count(),
    // This month orders
    prisma.order.count({ where: { createdAt: { gte: startOfThisMonth } } }),
    // Pending orders
    prisma.order.count({ where: { isPos: false, paymentStatus: 'PENDING' } }),
    // Today orders
    prisma.order.count({ where: { createdAt: { gte: startOfToday } } }),

    // Total POS revenue (paid)
    prisma.order.aggregate({
      _sum: { paidAmount: true },
      where: { isPos: true },
    }),
    // Total POS due
    prisma.order.aggregate({
      _sum: { dueAmount: true },
      where: { isPos: true },
    }),

    // Total active products
    prisma.product.count({ where: { isActive: true } }),
    // Low stock products
    prisma.product.count({
      where: {
        isActive: true,
        stock: { gt: 0 },
        // Use a raw query or bypass strict type checking where Prisma is lagging
        AND: [{ stock: { lte: prisma.product.fields.minStock as any as number } }],
      },
    }).catch(() =>
      // fallback: count where stock <= 5
      prisma.product.count({ where: { isActive: true, stock: { lte: 5, gt: 0 } } })
    ),
    // Out of stock
    prisma.product.count({ where: { isActive: true, stock: 0 } }),

    // Pending reviews
    prisma.review.count({ where: { status: 'PENDING' } }),
    // Total reviews
    prisma.review.count(),

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

    // Sales by category (top 6) - optimized with JOIN instead of N+1
    prisma.$queryRaw`
      SELECT 
        c.name,
        SUM(oi.total)::integer as value
      FROM "order_items" oi
      JOIN "products" p ON oi."product_id" = p.id
      JOIN "categories" c ON p."category_id" = c.id
      GROUP BY c.id, c.name
      ORDER BY value DESC
      LIMIT 6
    `.then((rows: any[]) => {
      return rows.map(row => ({
        name: row.name,
        value: row.value || 0,
      }));
    }),

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

  const thisMonthRev = thisMonthRevenue._sum.grandTotal || 0;
  const lastMonthRev = lastMonthRevenue._sum.grandTotal || 0;
  const revenueGrowth =
    lastMonthRev === 0 ? 100 : Math.round(((thisMonthRev - lastMonthRev) / lastMonthRev) * 100);

  const result = {
    stats: {
      totalRevenue: totalRevenue._sum.grandTotal || 0,
      thisMonthRevenue: thisMonthRev,
      lastMonthRevenue: lastMonthRev,
      revenueGrowth,
      todayRevenue: todayRevenue._sum.grandTotal || 0,
      totalOrders,
      thisMonthOrders,
      pendingOrders,
      todayOrders,
      totalPOSRevenue: totalPOSRevenue._sum.paidAmount || 0,
      totalPOSDue: totalPOSDue._sum.dueAmount || 0,
      totalProducts,
      lowStockProducts,
      outOfStockProducts,
      pendingReviews,
      totalReviews,
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
  } catch (error: any) {
    console.error('getDashboardStats error:', error);
    // Return cached stats even if error (graceful fallback)
    if (cachedStats) return cachedStats;
    
    return {
      stats: { totalRevenue: 0, thisMonthRevenue: 0, lastMonthRevenue: 0, revenueGrowth: 0, todayRevenue: 0, totalOrders: 0, thisMonthOrders: 0, pendingOrders: 0, todayOrders: 0, totalPOSRevenue: 0, totalPOSDue: 0, totalProducts: 0, lowStockProducts: 0, outOfStockProducts: 0, pendingReviews: 0, totalReviews: 0 },
      salesChartData: [],
      categorySales: [],
      topProducts: [],
      recentOrders: [],
    };
  }
}
