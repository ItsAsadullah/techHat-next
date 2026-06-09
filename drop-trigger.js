const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();
  await client.query("DROP TRIGGER IF EXISTS trg_order_status_log ON public.orders;");
  console.log('Trigger dropped');
  await client.query("DROP FUNCTION IF EXISTS log_order_status_change();");
  console.log('Function dropped');
  await client.end();
}

run();
