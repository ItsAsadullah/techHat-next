// supabase/functions/telegram-order-notification/index.ts
// TechHat.shop — Telegram notification with product names & images.

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ─── Types ────────────────────────────────────────────────────────────────────

interface WebhookPayload {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  schema: string;
  record: OrderRecord | null;
  old_record: OrderRecord | null;
}

interface OrderRecord {
  id: string;
  order_number: string;
  user_id: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  shipping_address: string | null;
  division: string | null;
  district: string | null;
  upazila: string | null;
  order_note: string | null;
  grand_total: number;
  total_amount: number;
  discount: number;
  coupon_code: string | null;
  coupon_discount: number;
  shipping_cost: number;
  payment_method: string;
  payment_status: string;
  transaction_id: string | null;
  mobile_provider: string | null;
  status: string;
  is_pos: boolean;
  created_at: string;
}

interface OrderItem {
  id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total: number;
  variants: { name: string; image: string | null } | null;
  products: {
    name: string;
    product_images: { url: string; is_thumbnail: boolean }[];
  } | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CASH:          "💵 Cash on Delivery",
  CARD:          "💳 Card",
  MOBILE_BANKING:"📱 Mobile Banking",
  ONLINE:        "🔗 Online Payment",
  MIXED:         "🔀 Mixed",
};

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  UNPAID:        "❌ অপরিশোধিত",
  PENDING:       "⏳ Pending",
  PAID:          "✅ পরিশোধিত",
  FAILED:        "🚫 Failed",
  PARTIALLY_PAID:"⚠️ আংশিক পরিশোধিত",
};

function formatBDT(amount: number): string {
  return `৳${amount.toLocaleString("en-BD")}`;
}

function getItemImageUrl(item: OrderItem): string | null {
  // Priority: variant image → product thumbnail → first product image
  if (item.variants?.image) return item.variants.image;
  const imgs = item.products?.product_images ?? [];
  const thumb = imgs.find((i) => i.is_thumbnail);
  return thumb?.url ?? imgs[0]?.url ?? null;
}

function formatItemsSection(items: OrderItem[]): string {
  if (!items.length) return "";
  const lines = items.map((item, idx) => {
    const variantPart = item.variants?.name ? ` <i>(${item.variants.name})</i>` : "";
    return `  ${idx + 1}. <b>${item.product_name}</b>${variantPart}\n     ${item.quantity} × ${formatBDT(item.unit_price)} = <b>${formatBDT(item.total)}</b>`;
  });
  return lines.join("\n");
}

function formatOrderMessage(order: OrderRecord, items: OrderItem[]): string {
  const orderType = order.is_pos ? "🏪 POS অর্ডার" : "🌐 ওয়েবসাইট অর্ডার";

  const address = [order.shipping_address, order.upazila, order.district, order.division]
    .filter(Boolean)
    .join(", ") || "N/A";

  const createdAt = new Date(order.created_at).toLocaleString("en-BD", {
    timeZone: "Asia/Dhaka",
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

  const emailLine = order.customer_email ? `📧 <b>ইমেইল:</b> ${order.customer_email}\n` : "";
  const discountLine = order.discount > 0 || order.coupon_discount > 0
    ? `\n🎟️ <b>ছাড়:</b> -${formatBDT(order.discount || order.coupon_discount)}${order.coupon_code ? ` (${order.coupon_code})` : ""}`
    : "";
  const shippingLine = order.shipping_cost > 0
    ? `\n🚚 <b>ডেলিভারি চার্জ:</b> ${formatBDT(order.shipping_cost)}`
    : "\n🚚 <b>ডেলিভারি চার্জ:</b> বিনামূল্যে 🎉";
  const trxLine = order.transaction_id ? `🔑 <b>ট্রানজেকশন ID:</b> <code>${order.transaction_id}</code>\n` : "";
  const mobileProviderLine = order.payment_method === "MOBILE_BANKING" && order.mobile_provider
    ? `📲 <b>প্রোভাইডার:</b> ${order.mobile_provider}\n`
    : "";
  const noteLine = order.order_note ? `\n\n📝 <b>কাস্টমার নোট:</b>\n<i>${order.order_note}</i>` : "";

  const itemsSection = items.length > 0
    ? `\n━━━━━━━━━━━━━━━━━━━━━━\n🛍️ <b>অর্ডার করা পণ্য (${items.length}টি)</b>\n${formatItemsSection(items)}`
    : "";

  return `
🛒 <b>Tech Hat এ নতুন অর্ডার এসেছে!</b>
<b>${orderType}</b>
━━━━━━━━━━━━━━━━━━━━━━

📦 <b>অর্ডার নম্বর:</b> <code>${order.order_number}</code>
📅 <b>তারিখ ও সময়:</b> ${createdAt}

━━━━━━━━━━━━━━━━━━━━━━
👤 <b>কাস্টমার তথ্য</b>
👨 <b>নাম:</b> ${order.customer_name || "N/A"}
📞 <b>ফোন:</b> <a href="tel:${order.customer_phone}">${order.customer_phone || "N/A"}</a>
${emailLine}📍 <b>ঠিকানা:</b> ${address}${itemsSection}

━━━━━━━━━━━━━━━━━━━━━━
💰 <b>পেমেন্ট বিবরণ</b>
💳 <b>পদ্ধতি:</b> ${PAYMENT_METHOD_LABELS[order.payment_method] || order.payment_method}
${mobileProviderLine}${trxLine}🟡 <b>স্ট্যাটাস:</b> ${PAYMENT_STATUS_LABELS[order.payment_status] || order.payment_status}

━━━━━━━━━━━━━━━━━━━━━━
🧾 <b>অর্ডার সারসংক্ষেপ</b>
🧮 <b>সাবটোটাল:</b> ${formatBDT(order.total_amount)}${discountLine}${shippingLine}
💸 <b>সর্বমোট:</b> <b>${formatBDT(order.grand_total)}</b>${noteLine}

━━━━━━━━━━━━━━━━━━━━━━
🔗 <a href="https://techhat.shop/admin/orders/${order.id}">👉 Admin Panel এ দেখুন</a>
`.trim();
}

// ─── Main Handler ─────────────────────────────────────────────────────────────

serve(async (req: Request) => {
  try {
    const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");
    const TELEGRAM_CHAT_ID   = Deno.env.get("TELEGRAM_CHAT_ID");
    const WEBHOOK_SECRET     = Deno.env.get("WEBHOOK_SECRET");
    // These are auto-injected by Supabase into every Edge Function
    const SUPABASE_URL              = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("MY_SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
      console.error("❌ Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID");
      return new Response("Missing required environment variables", { status: 500 });
    }

    // Verify webhook secret
    if (WEBHOOK_SECRET) {
      const incomingSecret = req.headers.get("x-webhook-secret");
      if (incomingSecret !== WEBHOOK_SECRET) {
        return new Response("Unauthorized", { status: 401 });
      }
    }

    // Parse payload
    const payload: WebhookPayload = await req.json();
    console.log(`📩 Received: type=${payload.type}, table=${payload.table}`);

    if (payload.type !== "INSERT" || !payload.record) {
      return new Response(JSON.stringify({ skipped: true }), { status: 200 });
    }

    const order = payload.record;

    // Skip notification for POS orders
    if (order.is_pos) {
      console.log(`⏭️ Skipping POS order: ${order.order_number}`);
      return new Response(JSON.stringify({ skipped: true, reason: 'POS order' }), { status: 200 });
    }

    // ── Fetch order items — wait 2s for transaction to fully commit ───────────
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Small delay to ensure order_items are committed to DB after the order row
    await new Promise((r) => setTimeout(r, 2000));

    // Step 1: Get order items (product_name is stored directly in order_items)
    const { data: rawItems, error: itemsError } = await supabase
      .from("order_items")
      .select("id, product_name, quantity, unit_price, total, variant_id, product_id")
      .eq("order_id", order.id);

    if (itemsError) {
      console.error("⚠️ Could not fetch order items:", itemsError.message);
    }

    const baseItems = rawItems ?? [];
    console.log(`📦 Found ${baseItems.length} items for order ${order.order_number}`);

    // Step 2: For images — get first product's thumbnail image
    let firstImageUrl: string | null = null;
    if (baseItems.length > 0) {
      const firstItem = baseItems[0];

      // Try variant image first
      if (firstItem.variant_id) {
        const { data: variant } = await supabase
          .from("variants")
          .select("image")
          .eq("id", firstItem.variant_id)
          .single();
        if (variant?.image) firstImageUrl = variant.image;
      }

      // If no variant image, try product thumbnail
      if (!firstImageUrl && firstItem.product_id) {
        const { data: img } = await supabase
          .from("product_images")
          .select("url")
          .eq("product_id", firstItem.product_id)
          .eq("is_thumbnail", true)
          .limit(1)
          .maybeSingle();
        if (img?.url) firstImageUrl = img.url;

        // Fallback: any image for this product
        if (!firstImageUrl) {
          const { data: anyImg } = await supabase
            .from("product_images")
            .select("url")
            .eq("product_id", firstItem.product_id)
            .limit(1)
            .maybeSingle();
          if (anyImg?.url) firstImageUrl = anyImg.url;
        }
      }
    }

    // Map to OrderItem shape for message formatting
    const orderItems: OrderItem[] = baseItems.map((item: any) => ({
      id: item.id,
      product_name: item.product_name,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total: item.total,
      variants: null,  // not needed for message text
      products: null,  // not needed for message text
    }));

    // ── Build Telegram message ───────────────────────────────────────────────
    const message = formatOrderMessage(order, orderItems);
    const telegramApiBase = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

    // `firstImageUrl` was already found via database query above.

    let telegramResult: any;

    if (firstImageUrl) {
      // Send photo with the message as caption (Telegram caption max = 1024 chars)
      let caption = message;
      let sendSeparateText = false;

      if (message.length > 1024) {
        caption = `🛒 <b>Tech Hat এ নতুন অর্ডার এসেছে!</b>\n📦 <b>অর্ডার নম্বর:</b> <code>${order.order_number}</code>\n\n<i>অর্ডারের বিস্তারিত তথ্য নিচের মেসেজে দেওয়া হলো...</i>`;
        sendSeparateText = true;
      }

      const photoRes = await fetch(`${telegramApiBase}/sendPhoto`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          photo: firstImageUrl,
          caption,
          parse_mode: "HTML",
        }),
      });

      telegramResult = await photoRes.json();

      // If message was too long, send the full text as a follow-up
      if (photoRes.ok && sendSeparateText) {
        await fetch(`${telegramApiBase}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: TELEGRAM_CHAT_ID,
            text: message,
            parse_mode: "HTML",
            disable_web_page_preview: true,
          }),
        });
      }

      if (!photoRes.ok) {
        // Photo URL might be invalid — fall back to text-only message
        console.warn("⚠️ sendPhoto failed, falling back to text:", telegramResult);
        const fallbackRes = await fetch(`${telegramApiBase}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: TELEGRAM_CHAT_ID,
            text: message,
            parse_mode: "HTML",
            disable_web_page_preview: true,
          }),
        });
        telegramResult = await fallbackRes.json();
        if (!fallbackRes.ok) {
          console.error("❌ Telegram sendMessage also failed:", telegramResult);
          return new Response(JSON.stringify({ success: false, telegram_error: telegramResult }), { status: 500 });
        }
      }
    } else {
      // No image — send plain text message
      const msgRes = await fetch(`${telegramApiBase}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: message,
          parse_mode: "HTML",
          disable_web_page_preview: true,
        }),
      });

      telegramResult = await msgRes.json();
      if (!msgRes.ok) {
        console.error("❌ Telegram API error:", telegramResult);
        return new Response(JSON.stringify({ success: false, telegram_error: telegramResult }), { status: 500 });
      }
    }

    console.log(`✅ Notification sent for order: ${order.order_number} (image: ${firstImageUrl ? "yes" : "no"})`);

    return new Response(
      JSON.stringify({ success: true, order_number: order.order_number, items_count: baseItems.length, items_error: itemsError }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("💥 Unhandled error:", error);
    return new Response(
      JSON.stringify({ success: false, error: String(error) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
