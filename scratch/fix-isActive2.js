const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../lib/actions/pos-actions.ts');
if (fs.existsSync(filePath)) {
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(/products:\s*\{\s*where:\s*\{\s*isActive:\s*true\s*\}\s*,\s*select:\s*\{\s*id:\s*true\s*\}\s*\}/g, "products: { where: { status: 'ACTIVE' }, select: { id: true } }");
  fs.writeFileSync(filePath, content);
}
console.log('Fixed getPOSCategories isActive');
