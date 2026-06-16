const fs = require('fs');
const path = require('path');

const productFiles = [
  'lib/actions/product-stock-actions.ts',
  'lib/actions/product-json-actions.ts',
  'lib/actions/product-history-actions.ts',
  'lib/actions/product-enterprise-actions.ts',
  'lib/actions/product-actions.ts',
  'lib/actions/report-actions.ts'
];

for (const file of productFiles) {
  const filePath = path.join(__dirname, '..', file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Reverse what fix-status.js did
    content = content.replace(/\bisActive:\s*true/g, 'status: true');
    content = content.replace(/where\.isActive\s*=\s*true/g, "where.status = 'ACTIVE'");
    content = content.replace(/where\.isActive\s*=\s*false/g, "where.status = 'DRAFT'");
    
    // Also, if report-actions.ts has where: { status: 'ACTIVE' }, it's already using status, so that's fine.
    
    fs.writeFileSync(filePath, content);
    console.log('Reverted', file);
  }
}
