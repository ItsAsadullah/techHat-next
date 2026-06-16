const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '../prisma/schema.prisma');
let schema = fs.readFileSync(schemaPath, 'utf8');

const productModelRegex = /(model Product \{[\s\S]*?\})/;
const match = schema.match(productModelRegex);
if (match) {
  let productModel = match[1];
  
  // Replace isActive with status in indexes
  productModel = productModel.replace(/isActive/g, 'status');
  
  // Actually we only want to replace it in indexes, but we already replaced the field definition.
  // The word isActive might be present in indexes.
  
  schema = schema.replace(productModelRegex, productModel);
  fs.writeFileSync(schemaPath, schema);
  console.log('Fixed indexes');
}
