const fs = require('fs');

function replaceFile(file, replacements) {
    if (!fs.existsSync(file)) return;
    let content = fs.readFileSync(file, 'utf8');
    for (const [search, replace] of replacements) {
        content = content.replace(search, replace);
    }
    fs.writeFileSync(file, content);
}

// 1. Fix availableQty to stock in POS components
const posFiles = [
    'components/admin/pos/pos-product-grid.tsx',
    'components/admin/pos/variant-picker-modal.tsx',
    'lib/hooks/use-pos-cart.ts'
];
for (const f of posFiles) {
    replaceFile(f, [
        [/\.availableQty/g, '.stock'],
        [/availableQty:/g, 'stock:'],
        [/availableQty /g, 'stock ']
    ]);
}

// 2. Fix isActive in pos-actions.ts, product-actions.ts, report-actions.ts
const actionFiles = [
    'lib/actions/pos-actions.ts',
    'lib/actions/product-actions.ts',
    'lib/actions/report-actions.ts'
];
for (const f of actionFiles) {
    replaceFile(f, [
        [/isActive:\s*true/g, "status: 'ACTIVE'"],
        [/isActive:\s*false/g, "status: 'INACTIVE'"],
        [/isActive:\s*input\.isActive/g, ""], // For create/update where input.isActive is used, wait, product-actions might use status now.
    ]);
}

// 3. Specific fixes for pos-actions.ts
replaceFile('lib/actions/pos-actions.ts', [
    [/productImages/g, 'images'],
    [/category:/g, 'categoryId:'],
    [/variants:/g, 'items:']
]);

// 4. Specific fixes for product-actions.ts
replaceFile('lib/actions/product-actions.ts', [
    [/variants:/g, 'items:'],
    [/\.variants/g, '.items'],
    [/(data:\s*any\s*=\s*\{[\s\S]*?)isActive(?:\s*\??:\s*boolean)?([\s\S]*?\})/g, '$1status$2'],
    [/isActive\s*\?\s*'ACTIVE'\s*:\s*'INACTIVE'/g, "status"],
    // Need to handle if isActive was left in create/update payloads
    [/\s*isActive\s*:.*?,/g, '']
]);

// 5. Specific fixes for report-actions.ts
replaceFile('lib/actions/report-actions.ts', [
    [/category:/g, 'categoryId:'],
    [/brand:/g, 'brandId:'],
    [/stockHistory/g, 'stockLedger']
]);

console.log("Fixes applied.");
