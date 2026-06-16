const fs = require('fs');
const path = require('path');

const productFiles = [
  'lib/actions/product-stock-actions.ts',
  'lib/actions/product-json-actions.ts',
  'lib/actions/product-history-actions.ts',
  'lib/actions/product-enterprise-actions.ts',
  'lib/actions/product-actions.ts'
];

for (const file of productFiles) {
  const filePath = path.join(__dirname, '..', file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace "status: true" with "isActive: true" inside select blocks
    content = content.replace(/\bstatus:\s*true/g, 'isActive: true');
    
    // Replace "status: isActive ? 'ACTIVE' : 'DRAFT'" with "isActive"
    content = content.replace(/status:\s*isActive\s*\?\s*'ACTIVE'\s*:\s*'DRAFT'/g, 'isActive');
    
    // Replace "where.status = 'ACTIVE'" with "where.isActive = true"
    content = content.replace(/where\.status\s*=\s*'ACTIVE'/g, 'where.isActive = true');
    
    // Replace "where.status = 'DRAFT'" with "where.isActive = false"
    content = content.replace(/where\.status\s*=\s*'DRAFT'/g, 'where.isActive = false');
    
    fs.writeFileSync(filePath, content);
    console.log('Fixed', file);
  }
}
