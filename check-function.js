const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();
  const res = await client.query("SELECT prosrc FROM pg_proc WHERE proname = 'log_order_status_change'");
  console.log(res.rows[0].prosrc);
  await client.end();
}

run();
