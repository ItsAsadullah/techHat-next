const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '../components/admin/products/product-form/schemas/product.schema.ts');
let content = fs.readFileSync(schemaPath, 'utf8');

// Fix nullable on all optional string fields from Prisma
content = content.replace(/z\.string\(\)\.optional\(\)\.or\(z\.literal\(''\)\)/g, "z.string().nullable().optional().or(z.literal(''))");

// Fix variants array nullable fields
content = content.replace(/sku:\s*z\.string\(\)\.optional\(\),/g, "sku: z.string().nullable().optional(),");
content = content.replace(/upc:\s*z\.string\(\)\.optional\(\),/g, "upc: z.string().nullable().optional(),");
content = content.replace(/image:\s*z\.string\(\)\.optional\(\),/g, "image: z.string().nullable().optional(),");
content = content.replace(/productImageId:\s*z\.string\(\)\.optional\(\),/g, "productImageId: z.string().nullable().optional(),");

fs.writeFileSync(schemaPath, content);
console.log('Fixed nullable Zod fields');
