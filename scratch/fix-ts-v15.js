const fs = require('fs');

function replaceFile(file, replacements) {
    if (!fs.existsSync(file)) return;
    let content = fs.readFileSync(file, 'utf8');
    for (const [search, replace] of replacements) {
        content = content.replace(search, replace);
    }
    fs.writeFileSync(file, content);
}

replaceFile('lib/actions/pos-actions.ts', [
    [/a\.variants\.some\(\(v\)/g, 'a.items.some((v: any)'],
    [/b\.variants\.some\(\(v\)/g, 'b.items.some((v: any)'],
    [/items: \{ some: \{ sku/g, 'variants: { some: { sku'],
    [/items: \{ some: \{ upc/g, 'variants: { some: { upc'],
    [/categoryId: \{ select: \{ name/g, 'category: { select: { name'],
    [/images: \{[\s]*where: \{ isThumbnail/g, 'productImages: {\n          where: { isThumbnail'],
    [/items: \{[\s]*select: \{/g, 'variants: {\n          select: {'],
    [/product\.images\[0\]/g, 'product.productImages[0]'],
    [/product\.variants/g, 'product.variants'],
]);

replaceFile('lib/actions/product-actions.ts', [
    [/isActive: input\.isActive\s*\?\s*'ACTIVE'\s*:\s*'INACTIVE'/g, ""],
    [/isActive:\s*input\.isActive[^,]*,?/g, ""],
    [/status:\s*status\s*as\s*any\s*\?\s*\{/g, "status ? {"],
    [/items:\s*true/g, 'variants: true'],
    [/\.items/g, '.variants'],
    [/status:\s*'INACTIVE'/g, "status: 'DRAFT'"],
    [/s\.specs/g, 's.specs'],
    [/\(s\)/g, '(s: any)'],
    [/\(img\)/g, '(img: any)'],
    [/\(v\)/g, '(v: any)'],
]);

replaceFile('lib/actions/report-actions.ts', [
    [/category:\s*\{/g, 'categoryId: {'],
    [/brand:\s*\{/g, 'brandId: {'],
    [/stockLedger/g, 'stockHistory'],
]);

replaceFile('lib/hooks/use-pos-cart.ts', [
    [/\.variants/g, '.items'],
    [/\(v\)/g, '(v: any)'],
]);

console.log("Fixes applied v15.");
