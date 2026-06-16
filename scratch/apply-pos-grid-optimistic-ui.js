const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'components', 'admin', 'pos', 'pos-product-grid.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add CartItem import if not present
if (!content.includes('CartItem')) {
  content = content.replace(
    /import \{ searchPOSProducts, findProductByBarcode, type POSProduct \} from '@\/lib\/actions\/pos-actions';/,
    "import { searchPOSProducts, findProductByBarcode, type POSProduct, type CartItem } from '@/lib/actions/pos-actions';"
  );
}

// 2. Add cartItems prop
content = content.replace(
  /initialProducts\?: POSProduct\[\];\n\}/,
  "initialProducts?: POSProduct[];\n  cartItems?: CartItem[];\n}"
);

content = content.replace(
  /export function POSProductGrid\(\{(.+)\} : POSProductGridProps\) \{/s,
  (match, p1) => {
    if (!p1.includes('cartItems')) {
      return match.replace(p1, p1 + ', cartItems = []');
    }
    return match;
  }
);

// Fallback if the previous regex didn't work (which might happen depending on formatting):
content = content.replace(
  /export function POSProductGrid\(\{ categories, onProductSelect, searchInputRef, initialProducts = \[\] \}: POSProductGridProps\) \{/,
  "export function POSProductGrid({ categories, onProductSelect, searchInputRef, initialProducts = [], cartItems = [] }: POSProductGridProps) {"
);

// 3. Compute effectiveProducts
const searchRenderList = `          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3">
            {products.map((product) => (
              <ProductGridCard key={product.id} product={product} onClick={handleProductClick} />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {products.map((product) => (
              <ProductListItem key={product.id} product={product} onClick={handleProductClick} />
            ))}
          </div>`;

const replaceRenderList = `          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3">
            {effectiveProducts.map((product) => (
              <ProductGridCard key={product.id} product={product} onClick={handleProductClick} />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {effectiveProducts.map((product) => (
              <ProductListItem key={product.id} product={product} onClick={handleProductClick} />
            ))}
          </div>`;

content = content.replace(searchRenderList, replaceRenderList);

// 4. Insert useMemo before return statement
const useMemoLogic = `
  // Calculate effective products with optimistic UI stock reduction
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
`;

// Replace `  return (` (the first one is inside handleBarcodeCode, so we need to find the main return)
// The main return is at `  return (` usually preceeded by some lines.
// Let's use string replacement safely.

const mainReturnSearch = `  return (
    <div className="flex flex-col h-full overflow-hidden bg-gray-50/50">`;

if (content.includes(mainReturnSearch)) {
  content = content.replace(mainReturnSearch, useMemoLogic + `    <div className="flex flex-col h-full overflow-hidden bg-gray-50/50">`);
}

// Ensure React is available for React.useMemo if we didn't import useMemo directly
if (!content.includes('import React')) {
  content = "import React from 'react';\n" + content;
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('pos-product-grid.tsx updated with optimistic UI');
