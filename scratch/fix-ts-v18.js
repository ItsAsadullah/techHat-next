const fs = require('fs');

let f = 'lib/actions/pos-actions.ts';
let c = fs.readFileSync(f, 'utf8');
c = c.replace(/images:/g, 'productImages:')
     .replace(/p\.images/g, 'p.productImages')
     .replace(/product\.images/g, 'product.productImages');
fs.writeFileSync(f, c);

f = 'lib/actions/product-actions.ts';
c = fs.readFileSync(f, 'utf8');
c = c.replace(/isActive:.*?,/g, '')
     .replace(/status:\s*true/g, "status: 'ACTIVE'")
     .replace(/status:\s*'INACTIVE'/g, "status: 'DRAFT'")
     .replace(/items:/g, 'variants:')
     .replace(/\.items/g, '.variants');
fs.writeFileSync(f, c);
