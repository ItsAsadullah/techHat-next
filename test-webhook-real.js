async function testWebhook() {
  const payload = {
    type: "INSERT",
    table: "orders",
    record: {
      id: "5e885c10-be67-4750-9800-1cbfe3ad245d", // The actual order ID from DB!
      order_number: "TH-2026-000020",
      customer_name: "বনলতা",
      customer_phone: "01765109262",
      shipping_address: "কাশিপুর, Khalishpur, Khulna",
      total_amount: 39,
      discount: 0,
      coupon_discount: 0,
      shipping_cost: 120,
      grand_total: 159,
      payment_method: "CASH",
      payment_status: "UNPAID",
      created_at: "2026-06-09T17:51:36.696Z",
      is_pos: false
    }
  };

  const res = await fetch("https://xkqzlwhkagsrqpmfuhzp.supabase.co/functions/v1/telegram-order-notification", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-webhook-secret": "techhat-wh-secret-2026"
    },
    body: JSON.stringify(payload)
  });

  console.log("Status:", res.status);
  console.log("Response:", await res.text());
}

testWebhook();
