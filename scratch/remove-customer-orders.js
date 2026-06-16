const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'prisma/schema.prisma');
let content = fs.readFileSync(filePath, 'utf8');

// The line in schema.prisma:
//   orders         Order[]

content = content.replace(/\s*orders\s+Order\[\]/g, '');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Removed orders Order[] from schema');
