import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ALLOWED_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
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

    // Find simple products with low stock
    const lowStockProducts = await prisma.product.findMany({
      where: { productVariantType: 'simple', isActive: true, stock: { lte: prisma.product.fields.minStock } },
      select: { name: true, stock: true },
    });
    
    // Find variants with low stock
    const lowStockVariants = await prisma.variant.findMany({
      where: { stock: { lte: prisma.variant.fields.minStock } },
      select: { name: true, stock: true, product: { select: { name: true } } },
    });

    if (lowStockProducts.length === 0 && lowStockVariants.length === 0) {
      return NextResponse.json({ success: true, message: 'No low stock items' });
    }

    let msg = `⚠️ <b>অটোমেটিক লো-স্টক এলার্ট:</b>\n\n`;
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
    }

    msg += `\n<i>দয়া করে স্টক আপডেট করুন।</i>`;

    await sendMessage(msg);

    return NextResponse.json({ success: true, message: 'Low stock alert sent' });
  } catch (error) {
    console.error('Low Stock Cron Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Error' }, { status: 500 });
  }
}
