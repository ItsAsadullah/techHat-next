const fs = require('fs');
const path = require('path');

const posComponentsDir = path.join(__dirname, '..', 'components', 'admin', 'pos');

const revertFiles = [
    'delete-item-dialog.tsx',
    'clear-cart-dialog.tsx'
];

for (const file of revertFiles) {
    const filePath = path.join(posComponentsDir, file);
    if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf8');
        content = content.replace(/ aria-describedby=\{undefined\}/g, '');
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Reverted ${file}`);
    }
}
