async function testWebhook() {
  const payload = {
    type: "INSERT",
    table: "orders",
    record: {
      id: "test-order-123",
      order_number: "TH-2026-TEST",
      customer_name: "Test User",
      customer_phone: "01711111111",
      shipping_address: "Dhaka",
      total_amount: 500,
      discount: 0,
      coupon_discount: 0,
      shipping_cost: 60,
      grand_total: 560,
      payment_method: "CASH",
      payment_status: "PENDING",
      created_at: new Date().toISOString(),
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

  const text = await res.text();
  console.log("Status:", res.status);
  console.log("Response:", text);
}

testWebhook();
