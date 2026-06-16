const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'lib/actions/pos-actions.ts');
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(
  "status: 'ACTIVE',",
  "isActive: true,"
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed status to isActive in pos-actions.ts');
