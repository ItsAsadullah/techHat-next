const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'lib/actions/pos-actions.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Replace `variants: {` with `items: {` in the interface
content = content.replace(
  "variants: {",
  "items: {"
);

// Replace `variants: p.variants,` with `items: p.variants,` in the mapper
content = content.replace(
  "variants: p.variants,",
  "items: p.variants,"
);

// We also need to fix `for (const v of p.variants) {` in getScore function if it exists.
// Wait, getScore uses `for (const v of p.items) {` already according to pos-product-grid.tsx
// Let's check pos-actions.ts getScore
content = content.replace(
  "for (const v of p.variants) {",
  "for (const v of p.items) {"
);

// One more place: in searchPOSProducts where.OR logic
content = content.replace(
  "{ variants: { some: { sku: { contains: q, mode: 'insensitive' } } } },",
  "{ variants: { some: { sku: { contains: q, mode: 'insensitive' } } } },"
); // Actually that's prisma level so variants is correct!

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed POSProduct interface and mapper to use items instead of variants.');
