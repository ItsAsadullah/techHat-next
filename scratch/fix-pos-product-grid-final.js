const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'components', 'admin', 'pos', 'pos-product-grid.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Move 'use client' to top
if (content.includes("import React from 'react';\n'use client';")) {
  content = content.replace("import React from 'react';\n'use client';", "'use client';\nimport React from 'react';");
}

// Ensure CartItem import
if (!content.includes('CartItem')) {
  content = content.replace(
    /import \{ searchPOSProducts, findProductByBarcode, type POSProduct \} from '@\/lib\/actions\/pos-actions';/,
    "import { searchPOSProducts, findProductByBarcode, type POSProduct, type CartItem } from '@/lib/actions/pos-actions';"
  );
}

// Add cartItems prop interface
if (!content.includes('cartItems?: CartItem[];')) {
  content = content.replace(
    /initialProducts\?: POSProduct\[\];\n\}/,
    "initialProducts?: POSProduct[];\n  cartItems?: CartItem[];\n}"
  );
}

// Add cartItems parameter
if (!content.includes('cartItems = []')) {
  content = content.replace(
    /export function POSProductGrid\(\{ categories, onProductSelect, searchInputRef, initialProducts = \[\] \}: POSProductGridProps\) \{/,
    "export function POSProductGrid({ categories, onProductSelect, searchInputRef, initialProducts = [], cartItems = [] }: POSProductGridProps) {"
  );
}

// Add useMemo exactly before the return statement of POSProductGrid component
const searchTarget = `  return (
    <div className="flex flex-col h-full overflow-hidden">`;

const useMemoInjection = `  // Calculate effective products with optimistic UI stock reduction
  const effectiveProducts = React.useMemo(() => {
    if (!cartItems || cartItems.length === 0) return products;
    
    return products.map(product => {
      const itemsInCart = cartItems.filter(item => item.productId === product.id);
      if (itemsInCart.length === 0) return product;

      const totalQtyInCart = itemsInCart.reduce((sum, item) => sum + item.quantity, 0);
      
      const newProduct = { ...product };
      newProduct.stock = Math.max(0, product.stock - totalQtyInCart);
      
      if (product.variants && product.variants.length > 0) {
        newProduct.variants = product.variants.map(variant => {
          const variantInCart = itemsInCart.find(item => item.variantId === variant.id);
          if (!variantInCart) return variant;
          
          return {
            ...variant,
            stock: Math.max(0, variant.stock - variantInCart.quantity)
          };
        });
      }
      
      return newProduct;
    });
  }, [products, cartItems]);

  return (
    <div className="flex flex-col h-full overflow-hidden">`;

if (content.includes(searchTarget) && !content.includes('const effectiveProducts = React.useMemo')) {
  content = content.replace(searchTarget, useMemoInjection);
}

// Replace products.map with effectiveProducts.map in the rendering section
const searchRender1 = `{products.map((product) => (
              <ProductGridCard key={product.id} product={product} onClick={handleProductClick} />
            ))}`;
const replaceRender1 = `{effectiveProducts.map((product) => (
              <ProductGridCard key={product.id} product={product} onClick={handleProductClick} />
            ))}`;

const searchRender2 = `{products.map((product) => (
              <ProductListItem key={product.id} product={product} onClick={handleProductClick} />
            ))}`;
const replaceRender2 = `{effectiveProducts.map((product) => (
              <ProductListItem key={product.id} product={product} onClick={handleProductClick} />
            ))}`;

if (content.includes(searchRender1)) {
  content = content.replace(searchRender1, replaceRender1);
}
if (content.includes(searchRender2)) {
  content = content.replace(searchRender2, replaceRender2);
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed pos-product-grid.tsx successfully!');
