const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 1. Read .env file for database connection
const envPath = path.join(__dirname, '../.env');
if (!fs.existsSync(envPath)) {
  console.error("❌ Error: .env file not found.");
  process.exit(1);
}

const envFile = fs.readFileSync(envPath, 'utf8');
const dbUrlMatch = envFile.match(/DIRECT_URL="([^"]+)"/);

if (!dbUrlMatch) {
  console.error("❌ Error: DIRECT_URL not found in .env file.");
  process.exit(1);
}

const dbUrl = dbUrlMatch[1];

// 2. Create backups folder if not exists
const backupDir = path.join(__dirname, '../backups');
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir);
}

// 3. Generate timestamped filename
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupFile = path.join(backupDir, `backup-${timestamp}.sql`);

console.log("⏳ Starting database backup. Please wait...");

try {
  // 4. Run supabase db dump command
  const command = `npx supabase db dump --db-url "${dbUrl}" -f "${backupFile}"`;
  execSync(command, { stdio: 'inherit' });
  
  console.log(`\n✅ Backup completed successfully!`);
  console.log(`📁 File saved at: ${backupFile}`);
} catch (error) {
  console.error(`\n❌ Backup failed:`, error.message);
}
