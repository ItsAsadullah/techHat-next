const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '../components/admin/products/product-form/schemas/product.schema.ts');
let content = fs.readFileSync(schemaPath, 'utf8');

// Fix offerPrice inside variants array
content = content.replace(/offerPrice:\s*z\.number\(\)\.optional\(\),/g, "offerPrice: z.number().nullable().optional(),");

// Fix attributes inside variants array
content = content.replace(/attributes:\s*z\.record\(z\.string\(\),\s*z\.string\(\)\)\.optional\(\),/g, "attributes: z.record(z.string(), z.string()).nullable().optional(),");

fs.writeFileSync(schemaPath, content);
console.log('Fixed more nullable Zod fields');
