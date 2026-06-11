import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { startOfDay, endOfDay } from 'date-fns';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ALLOWED_CHAT_ID = process.env.TELEGRAM_ALLOWED_CHAT_ID;
const CRON_SECRET = process.env.CRON_SECRET;

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

export async function GET(req: Request) {
  try {
    // Basic auth check
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return new Response('Unauthorized', { status: 401 });
    }

    const today = new Date();
    const todayStart = startOfDay(today);
    const todayEnd = endOfDay(today);

    // 1. Total Sales & Count
    const todayOrders = await prisma.order.aggregate({
      where: {
        createdAt: { gte: todayStart, lte: todayEnd },
        status: { notIn: ['CANCELLED', 'RETURNED', 'FAILED'] as any[] },
      },
      _sum: { grandTotal: true },
      _count: { id: true },
    });
    const totalSales = todayOrders._sum.grandTotal || 0;
    const totalCount = todayOrders._count.id || 0;

    // 2. Online vs POS
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

    // 3. Profit Calculation
    const ordersForProfit = await prisma.order.findMany({
      where: {
        createdAt: { gte: todayStart, lte: todayEnd },
        status: { notIn: ['CANCELLED', 'RETURNED', 'FAILED'] as any[] },
      },
      include: { items: true },
    });

    const productIds = ordersForProfit.flatMap(o => o.items.map(i => i.productId));
    const variantIds = ordersForProfit.flatMap(o => o.items.map(i => i.variantId).filter(Boolean)) as string[];

    const products = await prisma.product.findMany({ where: { id: { in: productIds } }, select: { id: true, costPrice: true }});
    const variants = await prisma.variant.findMany({ where: { id: { in: variantIds } }, select: { id: true, costPrice: true }});

    const productMap = new Map(products.map(p => [p.id, p.costPrice]));
    const variantMap = new Map(variants.map(v => [v.id, v.costPrice]));

    let totalRevenue = 0;
    let totalCost = 0;

    for (const order of ordersForProfit) {
      totalRevenue += order.grandTotal;
      for (const item of order.items) {
        const costPrice = item.variantId ? (variantMap.get(item.variantId) || 0) : (productMap.get(item.productId) || 0);
        totalCost += costPrice * item.quantity;
      }
    }
    const profit = totalRevenue - totalCost;

    // 4. Expenses
    const expenses = await prisma.expense.aggregate({
      where: { date: { gte: todayStart, lte: todayEnd } },
      _sum: { amount: true },
    });
    const totalExpense = expenses._sum.amount || 0;

    // 5. Returns
    const cancelled = await prisma.order.aggregate({
      where: {
        updatedAt: { gte: todayStart, lte: todayEnd },
        status: { in: ['CANCELLED', 'RETURNED', 'FAILED'] as any[] },
      },
      _sum: { grandTotal: true },
      _count: { id: true },
    });
    const returnTotal = cancelled._sum.grandTotal || 0;
    const returnCount = cancelled._count.id || 0;

    const netIncome = profit - totalExpense;

    let msg = `📊 <b>সারাদিনের সামারি (Daily Report):</b>\n\n`;
    msg += `💰 <b>মোট সেল:</b> ৳${totalSales.toLocaleString()} (${totalCount} টি)\n`;
    msg += `   ├ 🌐 অনলাইন: ৳${onlineSales.toLocaleString()}\n`;
    msg += `   └ 🏪 অফলাইন (POS): ৳${posSales.toLocaleString()}\n\n`;
    
    msg += `📈 <b>গ্রস লাভ:</b> ৳${profit.toLocaleString()}\n`;
    msg += `💸 <b>মোট খরচ:</b> ৳${totalExpense.toLocaleString()}\n`;
    msg += `💵 <b>আজকের নিট আয়: ৳${netIncome.toLocaleString()}</b>\n\n`;
    
    msg += `🚫 <b>রিটার্ন/ক্যান্সেল:</b> ৳${returnTotal.toLocaleString()} (${returnCount} টি)\n\n`;
    msg += `<i>"Hard work beats talent when talent doesn't work hard."</i> 💪`;

    await sendMessage(msg);

    return NextResponse.json({ success: true, message: 'Daily summary sent' });
  } catch (error) {
    console.error('Daily Summary Cron Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Error' }, { status: 500 });
  }
}
