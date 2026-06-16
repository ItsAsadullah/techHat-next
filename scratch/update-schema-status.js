const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '../prisma/schema.prisma');
let schema = fs.readFileSync(schemaPath, 'utf8');

// 1. Add ProductLifecycleStatus enum if not exists
if (!schema.includes('enum ProductLifecycleStatus')) {
  schema += `\n\nenum ProductLifecycleStatus {\n  DRAFT\n  ACTIVE\n  ARCHIVED\n  DISCONTINUED\n}\n`;
}

// 2. Replace isActive Boolean @default(true) with status ProductLifecycleStatus @default(ACTIVE) inside Product model
// We only want to replace it inside model Product.
const productModelRegex = /(model Product \{[\s\S]*?)isActive(\s+Boolean\s+@default\(true\))([\s\S]*?\})/;
schema = schema.replace(productModelRegex, `$1status ProductLifecycleStatus @default(ACTIVE)$3`);

// Also change @@index([isActive]) to @@index([status]) in Product if they exist
const productModelRegex2 = /model Product \{[\s\S]*?\}/;
const productModelMatch = schema.match(productModelRegex2);
if (productModelMatch) {
  let productModelStr = productModelMatch[0];
  productModelStr = productModelStr.replace(/@@index\(\[categoryId, isActive\]\)/g, '@@index([categoryId, status])');
  productModelStr = productModelStr.replace(/@@index\(\[isActive, isFlashSale\]\)/g, '@@index([status, isFlashSale])');
  productModelStr = productModelStr.replace(/@@index\(\[isActive, isBestSeller\]\)/g, '@@index([status, isBestSeller])');
  productModelStr = productModelStr.replace(/@@index\(\[isActive, isFeatured\]\)/g, '@@index([status, isFeatured])');
  productModelStr = productModelStr.replace(/@@index\(\[isActive, soldCount\]\)/g, '@@index([status, soldCount])');
  productModelStr = productModelStr.replace(/@@index\(\[isActive, viewCount\]\)/g, '@@index([status, viewCount])');
  productModelStr = productModelStr.replace(/@@index\(\[isActive, createdAt\]\)/g, '@@index([status, createdAt])');
  productModelStr = productModelStr.replace(/@@index\(\[isActive, price\]\)/g, '@@index([status, price])');
  productModelStr = productModelStr.replace(/@@index\(\[isActive, offerPrice\]\)/g, '@@index([status, offerPrice])');
  
  schema = schema.replace(productModelRegex2, productModelStr);
}

fs.writeFileSync(schemaPath, schema);
console.log('Updated schema.prisma successfully');
