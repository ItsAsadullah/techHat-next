const fs = require('fs');
const file = 'd:/TechHat website/techhat-next/lib/actions/order-actions.ts';
let content = fs.readFileSync(file, 'utf8');

const regex = /export async function getOrderStats\(\) \{[\s\S]*?^  \} catch \(error\) \{/m;
const replacement = `export async function getOrderStats() {
  try {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const [statusCounts, revenueResult, todayOrdersResult, todayRevenueResult] = await Promise.all([
      db.order.groupBy({ by: ['status'], where: { isPos: false }, _count: true }),
      db.order.aggregate({ where: { isPos: false, status: { notIn: ['CANCELLED', 'FAILED', 'REFUNDED'] } }, _sum: { grandTotal: true } }),
      db.order.count({ where: { isPos: false, createdAt: { gte: today } } }),
      db.order.aggregate({ where: { isPos: false, status: { notIn: ['CANCELLED', 'FAILED'] }, createdAt: { gte: today } }, _sum: { grandTotal: true } })
    ]);

    let totalOrders = 0, pendingOrders = 0, confirmedOrders = 0, processingOrders = 0, shippedOrders = 0, deliveredOrders = 0, cancelledOrders = 0;
    for (const group of statusCounts) {
      const count = group._count;
      totalOrders += count;
      if (group.status === 'PENDING') pendingOrders += count;
      else if (group.status === 'CONFIRMED') confirmedOrders += count;
      else if (group.status === 'PROCESSING') processingOrders += count;
      else if (['SHIPPED', 'OUT_FOR_DELIVERY'].includes(group.status)) shippedOrders += count;
      else if (['DELIVERED', 'COMPLETED'].includes(group.status)) deliveredOrders += count;
      else if (group.status === 'CANCELLED') cancelledOrders += count;
    }

    return {
      success: true,
      stats: { totalOrders, pendingOrders, confirmedOrders, processingOrders, shippedOrders, deliveredOrders, cancelledOrders, totalRevenue: revenueResult?._sum?.grandTotal || 0, todayOrders: todayOrdersResult, todayRevenue: todayRevenueResult?._sum?.grandTotal || 0 },
    };
  } catch (error) {`;

if (regex.test(content)) {
  content = content.replace(regex, replacement);
  fs.writeFileSync(file, content);
  console.log('Successfully updated getOrderStats');
} else {
  console.log('Regex did not match');
}
