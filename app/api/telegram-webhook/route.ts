import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { startOfDay, endOfDay, startOfMonth } from 'date-fns';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ALLOWED_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

// Exclude these statuses when calculating successful sales
const EXCLUDED_STATUSES = ['CANCELLED', 'RETURNED', 'FAILED'];

async function sendMessage(text: string) {
  if (!TELEGRAM_BOT_TOKEN || !ALLOWED_CHAT_ID) return;
  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: ALLOWED_CHAT_ID,
        text,
        parse_mode: 'HTML',
      }),
    });
  } catch (error) {
    console.error('Error sending Telegram message:', error);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const message = body.message;

    // Security: Only respond if the chat.id matches the allowed private group
    if (!message || !message.chat || String(message.chat.id) !== String(ALLOWED_CHAT_ID)) {
      return NextResponse.json({ success: true, message: 'Ignored: Unauthorized chat' });
    }

    if (!message.text) {
      return NextResponse.json({ success: true });
    }

    // Normalize command (e.g. "/today@bot_username" -> "/today")
    const text = message.text.trim().split('@')[0];
    
    const today = new Date();
    const todayStart = startOfDay(today);
    const todayEnd = endOfDay(today);
    const monthStart = startOfMonth(today);

    let reply = '';

    switch (text.toLowerCase()) {
      // 1. Today's Sales
      case '/today':
      case 'আজকের সেল': {
        const todayOrders = await prisma.order.aggregate({
          where: {
            createdAt: { gte: todayStart, lte: todayEnd },
            status: { notIn: ['CANCELLED', 'RETURNED', 'FAILED'] as any[] },
          },
          _sum: { grandTotal: true },
          _count: { id: true },
        });
        const total = todayOrders._sum.grandTotal || 0;
        const count = todayOrders._count.id || 0;
        reply = `📊 <b>আজকের মোট সেল:</b>\n💰 ৳${total.toLocaleString()}\n📦 মোট অর্ডার: ${count} টি`;
        break;
      }

      // 2. All-Time Total Sales
      case '/total':
      case 'মোট জের': {
        const totalOrders = await prisma.order.aggregate({
          where: {
            status: { notIn: ['CANCELLED', 'RETURNED', 'FAILED'] as any[] },
          },
          _sum: { grandTotal: true },
          _count: { id: true },
        });
        const total = totalOrders._sum.grandTotal || 0;
        const count = totalOrders._count.id || 0;
        reply = `🏆 <b>সর্বমোট সেল (All-Time):</b>\n💰 ৳${total.toLocaleString()}\n📦 মোট অর্ডার: ${count} টি`;
        break;
      }

      // 3. Pending Orders
      case '/pending':
      case 'পেন্ডিং অর্ডার': {
        const pendingOrders = await prisma.order.aggregate({
          where: { status: 'PENDING' },
          _sum: { grandTotal: true },
          _count: { id: true },
        });
        const total = pendingOrders._sum.grandTotal || 0;
        const count = pendingOrders._count.id || 0;
        reply = `⏳ <b>বর্তমান পেন্ডিং অর্ডার:</b>\n💰 মূল্য: ৳${total.toLocaleString()}\n📦 পেন্ডিং: ${count} টি অর্ডার`;
        break;
      }

      // 4. Completed Orders
      case '/completed':
      case 'কমপ্লিট অর্ডার': {
        const completedOrders = await prisma.order.aggregate({
          where: { status: 'COMPLETED' },
          _sum: { grandTotal: true },
          _count: { id: true },
        });
        const total = completedOrders._sum.grandTotal || 0;
        const count = completedOrders._count.id || 0;
        reply = `✅ <b>মোট কমপ্লিট অর্ডার:</b>\n💰 মূল্য: ৳${total.toLocaleString()}\n📦 ডেলিভারড: ${count} টি অর্ডার`;
        break;
      }

      // 5. POS Sales (Today)
      case '/pos':
      case 'আজকের পস সেল': {
        const posOrders = await prisma.order.aggregate({
          where: {
            isPos: true,
            createdAt: { gte: todayStart, lte: todayEnd },
            status: { notIn: ['CANCELLED', 'RETURNED', 'FAILED'] as any[] },
          },
          _sum: { grandTotal: true },
          _count: { id: true },
        });
        const total = posOrders._sum.grandTotal || 0;
        const count = posOrders._count.id || 0;
        reply = `🏪 <b>আজকের অফলাইন (POS) সেল:</b>\n💰 ৳${total.toLocaleString()}\n📦 মোট বিক্রি: ${count} টি`;
        break;
      }

      // 6. Low Stock Alert
      case '/stock':
      case 'স্টক লিস্ট': {
        // Find simple products with low stock
        const lowStockProducts = await prisma.product.findMany({
          where: { productVariantType: 'simple', isActive: true, stock: { lte: prisma.product.fields.minStock } },
          select: { name: true, stock: true },
          take: 15,
        });
        // Find variants with low stock
        const lowStockVariants = await prisma.variant.findMany({
          where: { stock: { lte: prisma.variant.fields.minStock } },
          select: { name: true, stock: true, product: { select: { name: true } } },
          take: 15,
        });

        let msg = `⚠️ <b>লো-স্টক এলার্ট:</b>\n\n`;
        let found = false;

        if (lowStockProducts.length > 0) {
          msg += `<b>Products:</b>\n`;
          lowStockProducts.forEach(p => msg += `• ${p.name} - (স্টক: ${p.stock})\n`);
          found = true;
        }
        if (lowStockVariants.length > 0) {
          if (found) msg += `\n`;
          msg += `<b>Variants:</b>\n`;
          lowStockVariants.forEach(v => msg += `• ${v.product.name} (${v.name}) - (স্টক: ${v.stock})\n`);
          found = true;
        }

        if (!found) {
          msg = `✅ <b>লো-স্টক:</b> কোনো প্রোডাক্টের স্টক বর্তমানে লো নেই।`;
        } else if (lowStockProducts.length === 15 || lowStockVariants.length === 15) {
          msg += `\n<i>(আরও প্রোডাক্ট থাকতে পারে, ড্যাশবোর্ড চেক করুন)</i>`;
        }
        
        reply = msg;
        break;
      }

      // 7. Today's Profit
      case '/profit':
      case 'আজকের লাভ': {
        const todayOrders = await prisma.order.findMany({
          where: {
            createdAt: { gte: todayStart, lte: todayEnd },
            status: { notIn: ['CANCELLED', 'RETURNED', 'FAILED'] as any[] },
          },
          include: { items: true },
        });

        // We need product and variant cost prices
        const productIds = todayOrders.flatMap(o => o.items.map(i => i.productId));
        const variantIds = todayOrders.flatMap(o => o.items.map(i => i.variantId).filter(Boolean)) as string[];

        const products = await prisma.product.findMany({ where: { id: { in: productIds } }, select: { id: true, costPrice: true }});
        const variants = await prisma.variant.findMany({ where: { id: { in: variantIds } }, select: { id: true, costPrice: true }});

        const productMap = new Map(products.map(p => [p.id, p.costPrice]));
        const variantMap = new Map(variants.map(v => [v.id, v.costPrice]));

        let totalRevenue = 0;
        let totalCost = 0;

        for (const order of todayOrders) {
          // Add the grandTotal instead of item totals to account for discounts/shipping
          totalRevenue += order.grandTotal;
          for (const item of order.items) {
            const costPrice = item.variantId ? (variantMap.get(item.variantId) || 0) : (productMap.get(item.productId) || 0);
            totalCost += costPrice * item.quantity;
          }
        }

        const profit = totalRevenue - totalCost;
        reply = `📈 <b>আজকের লাভ/ক্ষতি:</b>\n💰 রেভিনিউ: ৳${totalRevenue.toLocaleString()}\n📉 কেনা দাম: ৳${totalCost.toLocaleString()}\n💵 <b>নিট লাভ: ৳${profit.toLocaleString()}</b>`;
        break;
      }

      // 8. Today's Expenses
      case '/expense':
      case 'আজকের খরচ': {
        const expenses = await prisma.expense.findMany({
          where: { date: { gte: todayStart, lte: todayEnd } },
        });
        
        const totalExpense = expenses.reduce((sum, exp) => sum + exp.amount, 0);
        let msg = `💸 <b>আজকের খরচ: ৳${totalExpense.toLocaleString()}</b>\n\n`;
        
        if (expenses.length > 0) {
          expenses.forEach((e, idx) => {
            msg += `${idx + 1}. ${e.title} - ৳${e.amount.toLocaleString()}\n`;
          });
        } else {
          msg += `আজ কোনো খরচ এন্ট্রি করা হয়নি।`;
        }
        
        reply = msg;
        break;
      }

      // 9. Total Dues
      case '/due':
      case 'বকেয়া': {
        const dueOrders = await prisma.order.aggregate({
          where: { dueAmount: { gt: 0 } },
          _sum: { dueAmount: true },
          _count: { id: true },
        });
        const totalDue = dueOrders._sum.dueAmount || 0;
        const count = dueOrders._count.id || 0;
        reply = `📒 <b>সর্বমোট বকেয়া (Due):</b>\n💰 ৳${totalDue.toLocaleString()}\n👥 কাস্টমার/অর্ডার: ${count} টি`;
        break;
      }

      // 10. Top Selling Products
      case '/top':
      case 'টপ প্রোডাক্ট': {
        const topItems = await prisma.orderItem.groupBy({
          by: ['productName'],
          where: {
            order: {
              createdAt: { gte: todayStart, lte: todayEnd },
              status: { notIn: ['CANCELLED', 'RETURNED', 'FAILED'] as any[] },
            }
          },
          _sum: { quantity: true },
          orderBy: { _sum: { quantity: 'desc' } },
          take: 3,
        });

        if (topItems.length > 0) {
          reply = `🔥 <b>আজকের টপ সেলিং প্রোডাক্ট:</b>\n\n`;
          topItems.forEach((item, idx) => {
            const emoji = idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉';
            reply += `${emoji} ${item.productName} - (সেল: ${item._sum.quantity} টি)\n`;
          });
        } else {
          reply = `আজ কোনো প্রোডাক্ট সেল হয়নি।`;
        }
        break;
      }

      // 11. Cancelled/Returned
      case '/return':
      case 'ক্যান্সেল অর্ডার': {
        const cancelled = await prisma.order.aggregate({
          where: {
            updatedAt: { gte: todayStart, lte: todayEnd },
            status: { in: ['CANCELLED', 'RETURNED', 'FAILED'] as any[] },
          },
          _sum: { grandTotal: true },
          _count: { id: true },
        });
        const total = cancelled._sum.grandTotal || 0;
        const count = cancelled._count.id || 0;
        reply = `🚫 <b>আজকের ক্যান্সেল/রিটার্ন অর্ডার:</b>\n💰 মূল্য: ৳${total.toLocaleString()}\n📦 অর্ডার: ${count} টি`;
        break;
      }

      // 12. This Month Sales
      case '/month':
      case 'চলতি মাসের হিসাব': {
        // Aggregate Sales
        const monthOrders = await prisma.order.aggregate({
          where: {
            createdAt: { gte: monthStart, lte: todayEnd },
            status: { notIn: ['CANCELLED', 'RETURNED', 'FAILED'] as any[] },
          },
          _sum: { grandTotal: true },
          _count: { id: true },
        });

        const totalSales = monthOrders._sum.grandTotal || 0;
        const orderCount = monthOrders._count.id || 0;

        reply = `📅 <b>চলতি মাসের হিসাব (১ তারিখ থেকে):</b>\n💰 মোট সেল: ৳${totalSales.toLocaleString()}\n📦 মোট অর্ডার: ${orderCount} টি`;
        break;
      }

      // 13. Online vs Offline Compare
      case '/compare':
      case 'অনলাইন বনাম অফলাইন': {
        const posOrders = await prisma.order.aggregate({
          where: { isPos: true, createdAt: { gte: todayStart, lte: todayEnd }, status: { notIn: ['CANCELLED', 'RETURNED', 'FAILED'] as any[] } },
          _sum: { grandTotal: true }
        });
        const onlineOrders = await prisma.order.aggregate({
          where: { isPos: false, createdAt: { gte: todayStart, lte: todayEnd }, status: { notIn: ['CANCELLED', 'RETURNED', 'FAILED'] as any[] } },
          _sum: { grandTotal: true }
        });

        const posSales = posOrders._sum.grandTotal || 0;
        const onlineSales = onlineOrders._sum.grandTotal || 0;
        const total = posSales + onlineSales;

        let posPer = 0;
        let onlinePer = 0;
        if (total > 0) {
          posPer = Math.round((posSales / total) * 100);
          onlinePer = Math.round((onlineSales / total) * 100);
        }

        reply = `⚖️ <b>আজকের অনলাইন vs অফলাইন সেল:</b>\n\n`;
        reply += `🌐 <b>অনলাইন (ওয়েবসাইট):</b> ৳${onlineSales.toLocaleString()} (${onlinePer}%)\n`;
        reply += `🏪 <b>অফলাইন (POS):</b> ৳${posSales.toLocaleString()} (${posPer}%)`;
        break;
      }

      default:
        // Ignore unrecognized commands without replying
        break;
    }

    if (reply) {
      await sendMessage(reply);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Error' }, { status: 500 });
  }
}
