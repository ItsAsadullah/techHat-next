const fs = require('fs');

let f = 'lib/actions/product-actions.ts';
let c = fs.readFileSync(f, 'utf8');

c = c.replace(/product\.variants/g, '(product as any).variants');
c = c.replace(/status: 'ACTIVE',/g, 'status: true,');
// Remove standalone isActive, which was causing errors 211 and 644
c = c.replace(/isActive,\n/g, '');

fs.writeFileSync(f, c);

console.log('Done!');
