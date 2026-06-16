const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'app', 'admin', 'pos', 'pos-client.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const searchStr = `      {/* Main Content - Two Column */}
      <div className="flex-1 flex overflow-hidden">
          mobileView === 'cart' ? 'flex w-full lg:flex lg:w-[26.25rem]' : 'hidden lg:flex lg:w-[26.25rem]'
        )}>
          <POSCartPanel`;

const replaceStr = `      {/* Main Content - Two Column */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Product Selection */}
        <div className={cn(
          'flex-1 flex flex-col border-r border-gray-200 min-w-0',
          mobileView === 'products' ? 'flex' : 'hidden lg:flex'
        )}>
          <POSProductGrid
            categories={categories}
            onProductSelect={handleProductSelect}
            searchInputRef={searchInputRef}
            initialProducts={initialProducts}
            cartItems={cart.items}
          />
        </div>

        {/* Right: Cart & Checkout */}
        <div className={cn(
          'shrink-0 flex flex-col',
          mobileView === 'cart' ? 'flex w-full lg:flex lg:w-[26.25rem]' : 'hidden lg:flex lg:w-[26.25rem]'
        )}>
          <POSCartPanel`;

if (content.includes(searchStr)) {
    content = content.replace(searchStr, replaceStr);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Fixed pos-client.tsx product grid prop');
} else {
    console.log('Search string not found!');
}
