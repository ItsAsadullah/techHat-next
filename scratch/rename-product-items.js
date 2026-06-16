const fs = require('fs');
const path = require('path');

function replaceInFile(filePath, replacements) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    for (const { from, to } of replacements) {
        content = content.replaceAll(from, to);
    }
    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated ${filePath}`);
    }
}

const rootDir = path.join(__dirname, '..');

// 1. Revert pos-actions.ts back to variants
replaceInFile(path.join(rootDir, 'lib/actions/pos-actions.ts'), [
    { from: "items: {", to: "variants: {" },
    { from: "items: p.variants,", to: "variants: p.variants," },
    { from: "for (const v of p.items) {", to: "for (const v of p.variants) {" }
]);

// 2. Update pos-client.tsx
replaceInFile(path.join(rootDir, 'app/admin/pos/pos-client.tsx'), [
    { from: "product.items.length", to: "product.variants.length" },
    { from: "product.items[0]", to: "product.variants[0]" },
    { from: "product.items.find", to: "product.variants.find" }
]);

// 3. Update pos-product-grid.tsx
replaceInFile(path.join(rootDir, 'components/admin/pos/pos-product-grid.tsx'), [
    { from: "product.items.length", to: "product.variants.length" },
    { from: "product.items.find", to: "product.variants.find" },
    { from: "product.items[0]", to: "product.variants[0]" },
    { from: "for (const v of p.items) {", to: "for (const v of p.variants) {" }
]);

// 4. Update VariantPickerModal which probably also uses product.items
const variantPickerPath = path.join(rootDir, 'components/admin/pos/variant-picker-modal.tsx');
if (fs.existsSync(variantPickerPath)) {
    replaceInFile(variantPickerPath, [
        { from: "product.items", to: "product.variants" }
    ]);
}

// 5. Update CartPanel which might use product.items? No, it uses cart.items
// We should check if product.items is used anywhere else in components/admin/pos
const posComponentsDir = path.join(rootDir, 'components/admin/pos');
const files = fs.readdirSync(posComponentsDir);
for (const file of files) {
    if (file.endsWith('.tsx') && file !== 'pos-product-grid.tsx' && file !== 'variant-picker-modal.tsx') {
        replaceInFile(path.join(posComponentsDir, file), [
            { from: "product.items", to: "product.variants" } // very safe regex
        ]);
    }
}

console.log("Done renaming product.items to product.variants");
