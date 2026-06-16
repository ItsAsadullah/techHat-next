const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'prisma/schema.prisma');
let content = fs.readFileSync(filePath, 'utf8');

// The lines in schema.prisma:
//   Customer   Customer? @relation(fields: [customerId], references: [id])
//   customerId String?

content = content.replace(/\s*Customer\s+Customer\?\s+@relation\(fields: \[customerId\], references: \[id\]\)/g, '');
content = content.replace(/\s*customerId\s+String\?/g, '');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Removed customerId from schema');
