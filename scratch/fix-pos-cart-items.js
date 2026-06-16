const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'lib/hooks/use-pos-cart.ts');
let content = fs.readFileSync(filePath, 'utf8');

content = content.replaceAll("product.items.find", "product.variants.find");
content = content.replaceAll("product.items.length", "product.variants.length");
content = content.replaceAll("product.items", "product.variants"); // Fallback

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed use-pos-cart.ts');
