/**
 * deploy-telegram-function.mjs
 * Run: node deploy-telegram-function.mjs YOUR_SUPABASE_ACCESS_TOKEN
 *
 * Get your access token from:
 * https://supabase.com/dashboard/account/tokens
 */

import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const PROJECT_REF = "xkqzlwhkagsrqpmfuhzp";
const ACCESS_TOKEN = process.argv[2];

if (!ACCESS_TOKEN) {
  console.error("❌ Usage: node deploy-telegram-function.mjs YOUR_ACCESS_TOKEN");
  console.error("\n📌 Get your token from: https://supabase.com/dashboard/account/tokens");
  process.exit(1);
}

const BASE_URL = `https://api.supabase.com/v1/projects/${PROJECT_REF}`;
const HEADERS = {
  Authorization: `Bearer ${ACCESS_TOKEN}`,
  "Content-Type": "application/json",
};

const SECRETS = [
  { name: "TELEGRAM_BOT_TOKEN", value: "8859496339:AAH0PoyLma1bIa1gwzhI2Cnn8K_jPLJnP6E" },
  { name: "TELEGRAM_CHAT_ID",   value: "-1003737853126" },
  { name: "WEBHOOK_SECRET",     value: "techhat-wh-secret-2026" },
  { name: "MY_SUPABASE_SERVICE_ROLE_KEY", value: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrcXpsd2hrYWdzcnFwbWZ1aHpwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDMzMzE2MSwiZXhwIjoyMDg1OTA5MTYxfQ.7tCmTyaTe8t-5ifnfSbIhE0nMe9bqZBhlibQ3Rf9USw" }
];

async function setSecrets() {
  console.log("🔐 Setting Supabase Edge Function secrets...");
  const res = await fetch(`${BASE_URL}/secrets`, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify(SECRETS),
  });
  // Supabase returns 204 No Content on success — do NOT parse body
  if (res.status === 204 || res.ok) {
    console.log("✅ Secrets set successfully!");
    return true;
  }
  // Only parse body on error
  const text = await res.text();
  console.error("❌ Failed to set secrets:", res.status, text);
  return false;
}

async function deployFunction() {
  console.log("\n🚀 Deploying Edge Function via Supabase CLI...");

  const { execSync } = await import("child_process");
  try {
    execSync(
      `npx supabase functions deploy telegram-order-notification --no-verify-jwt --project-ref ${PROJECT_REF}`,
      {
        cwd: process.cwd(),
        env: { ...process.env, SUPABASE_ACCESS_TOKEN: ACCESS_TOKEN },
        stdio: "inherit",
      }
    );
    console.log("✅ Function deployed successfully!");
    return true;
  } catch (err) {
    console.error("❌ CLI deploy failed:", err.message);
    return false;
  }
}

async function testFunction() {
  console.log("\n🧪 Testing the Edge Function...");
  const testPayload = {
    type: "INSERT",
    table: "orders",
    schema: "public",
    record: {
      id: "test-" + Date.now(),
      order_number: "TH-2026-TEST01",
      customer_name: "Test Customer",
      customer_phone: "01712345678",
      customer_email: null,
      shipping_address: "House 10, Road 5, Block A",
      division: "Dhaka",
      district: "Dhaka",
      upazila: "Uttara",
      grand_total: 1500,
      total_amount: 1440,
      discount: 0,
      coupon_code: null,
      coupon_discount: 0,
      shipping_cost: 60,
      payment_method: "CASH",
      payment_status: "UNPAID",
      transaction_id: null,
      mobile_provider: null,
      status: "PENDING",
      order_note: "দ্রুত ডেলিভারি দিন",
      is_pos: false,
      created_at: new Date().toISOString(),
    },
    old_record: null,
  };

  const res = await fetch(
    `https://${PROJECT_REF}.supabase.co/functions/v1/telegram-order-notification`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-webhook-secret": "techhat-wh-secret-2026",
      },
      body: JSON.stringify(testPayload),
    }
  );
  const data = await res.json();
  if (!res.ok || !data.success) {
    console.error("❌ Test failed:", data);
    return false;
  }
  console.log(`✅ Test passed! Order ${data.order_number} notification sent to Telegram.`);
  return true;
}

async function main() {
  console.log("═══════════════════════════════════════════════");
  console.log("  TechHat.shop — Telegram Notification Deploy  ");
  console.log("═══════════════════════════════════════════════\n");

  const secretsOk = await setSecrets();
  if (!secretsOk) process.exit(1);

  const deployOk = await deployFunction();
  if (!deployOk) process.exit(1);

  // Wait a moment for the function to be ready
  console.log("\n⏳ Waiting 5 seconds for function to be ready...");
  await new Promise((r) => setTimeout(r, 5000));

  await testFunction();

  console.log("\n═══════════════════════════════════════════════");
  console.log("✅ ALL DONE!");
  console.log(`\n📋 Next Step: Create the Database Webhook`);
  console.log(`   Dashboard → Database → Webhooks → New Webhook`);
  console.log(`   Table: orders | Event: INSERT`);
  console.log(`   URL: https://${PROJECT_REF}.supabase.co/functions/v1/telegram-order-notification`);
  console.log(`   Header: x-webhook-secret = techhat-wh-secret-2026`);
  console.log("═══════════════════════════════════════════════\n");
}

main().catch(console.error);
