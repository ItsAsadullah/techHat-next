const fs = require('fs');
const path = require('path');

const files = [
  'lib/actions/pos-actions.ts',
  'lib/actions/order-actions.ts',
  'lib/actions/homepage-actions.ts',
  'lib/actions/category-page-actions.ts',
  'lib/actions/dashboard-actions.ts',
  'app/admin/products/page.tsx',
];

for (const file of files) {
  const filePath = path.join(__dirname, '..', file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Manual replacements based on manual review:
    if (file === 'lib/actions/pos-actions.ts') {
      content = content.replace(/isActive:\s*true,/g, "status: 'ACTIVE',");
    }
    if (file === 'lib/actions/order-actions.ts') {
      content = content.replace(/where: \{ id: \{ in: productIds \}, isActive: true \}/g, "where: { id: { in: productIds }, status: 'ACTIVE' }");
      content = content.replace(/isActive:\s*true/g, "status: true");
      content = content.replace(/!product.isActive/g, "product.status !== 'ACTIVE'");
    }
    if (file === 'lib/actions/category-page-actions.ts') {
      // In category-page-actions, we query Product, not Category usually, or both.
      // Wait, let's leave category-page-actions and homepage-actions unchanged for Category/Banner.
      // But if it queries products, we need status: 'ACTIVE'.
      content = content.replace(/where: \{ slug, isActive: true \},/g, "where: { slug, status: 'ACTIVE' },"); // if it's product
      content = content.replace(/where: \{ isActive: true \},/g, "where: { status: 'ACTIVE' },");
    }
    if (file === 'lib/actions/homepage-actions.ts') {
      // only replace where we specifically query Product.
      // I'll be safer and just replace the known ones:
      content = content.replace(/where: \{\s*isActive: true\s*\}/g, "where: { status: 'ACTIVE' }");
    }

    fs.writeFileSync(filePath, content);
  }
}
console.log('Fixed isActive -> status');
