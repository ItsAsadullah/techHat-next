const fs = require('fs');
const path = require('path');

const filesToUpdate = [
  'app/admin/purchases/page.tsx',
  'app/admin/suppliers/page.tsx',
  'app/admin/accounting/general-ledger/page.tsx',
  'app/admin/inventory/adjustments/page.tsx',
  'app/admin/inventory/grn/page.tsx',
  'app/admin/inventory/warehouses/page.tsx',
];

for (const file of filesToUpdate) {
  const filePath = path.join(__dirname, '..', file);
  if (!fs.existsSync(filePath)) continue;
  let content = fs.readFileSync(filePath, 'utf8');

  // Change searchParams type to Promise<{ ... }>
  content = content.replace(
    /searchParams:\s*{\s*([^}]+)\s*}/,
    'searchParams: Promise<{ $1 }>'
  );

  // For General Ledger (which doesn't destructure but uses type directly)
  if (file.includes('general-ledger')) {
    content = content.replace(
      /export default async function GeneralLedgerPage\(\{ searchParams \}: \{ searchParams: \{ ([^}]+) \} \}\) \{/g,
      `export default async function GeneralLedgerPage({ searchParams }: { searchParams: Promise<{ $1 }> }) {
  const resolvedParams = await searchParams;`
    );
    // replace searchParams.X with resolvedParams.X
    content = content.replace(/searchParams\.account/g, 'resolvedParams.account');
    content = content.replace(/searchParams\.from/g, 'resolvedParams.from');
    content = content.replace(/searchParams\.to/g, 'resolvedParams.to');
  } else {
    // Other pages already destructure, e.g. searchParams.q
    // Inject await
    content = content.replace(
      /(const [a-zA-Z0-9_]+ = )searchParams\.([a-zA-Z0-9_]+)/g,
      '$1(await searchParams).$2'
    );
    
    // There might be multiple occurrences per line, so we do it differently if there's an issue.
    // Actually, replacing `searchParams.` with `(await searchParams).` is safer
    content = content.replace(/searchParams\./g, '(await searchParams).');
  }

  // Deduplicate double await if any
  content = content.replace(/\(await \(await searchParams\)\)/g, '(await searchParams)');

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Fixed searchParams in ${file}`);
}

// Fix Reviews API route
const reviewsApi = path.join(__dirname, '..', 'app/api/admin/reviews/route.ts');
if (fs.existsSync(reviewsApi)) {
  let content = fs.readFileSync(reviewsApi, 'utf8');
  content = content.replace(/requireAdmin/g, 'requireStaff');
  fs.writeFileSync(reviewsApi, content, 'utf8');
  console.log('Fixed Reviews API route role');
}

// Fix Image warning in pos-client.tsx
const posClient = path.join(__dirname, '..', 'app/admin/pos/pos-client.tsx');
if (fs.existsSync(posClient)) {
  let content = fs.readFileSync(posClient, 'utf8');
  content = content.replace(
    /className="h-5 sm:h-6 w-auto object-contain drop-shadow-sm"/g,
    `style={{ width: 'auto' }} className="h-5 sm:h-6 object-contain drop-shadow-sm"`
  );
  fs.writeFileSync(posClient, content, 'utf8');
  console.log('Fixed pos-client.tsx Image warning');
}
