import { Client } from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function setupDatabase() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.error('❌ Error: DATABASE_URL is not defined in .env.local');
    console.error('👉 Please add your Supabase Connection String (Transaction Pooler or Direct) to .env.local');
    console.error('   Example: DATABASE_URL=postgresql://postgres.ref:password@aws-0-region.pooler.supabase.com:6543/postgres');
    process.exit(1);
  }

  const client = new Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false, // Required for Supabase in some environments
    },
  });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected.');

    const schemaPath = path.resolve(process.cwd(), '../supabase_schema.sql');
    if (!fs.existsSync(schemaPath)) {
      console.error(`❌ Error: Schema file not found at ${schemaPath}`);
      process.exit(1);
    }

    console.log(`📄 Reading schema from ${schemaPath}...`);
    const sql = fs.readFileSync(schemaPath, 'utf8');

    console.log('🚀 Executing SQL migration...');
    await client.query(sql);

    console.log('✨ Database setup completed successfully!');
  } catch (err) {
    console.error('❌ Error executing migration:', err);
  } finally {
    await client.end();
    console.log('🔌 Disconnected.');
  }
}

setupDatabase();
