const fs = require('fs');
const path = require('path');

const posComponentsDir = path.join(__dirname, '..', 'components', 'admin', 'pos');

if (!fs.existsSync(posComponentsDir)) {
    console.error("Directory not found:", posComponentsDir);
    process.exit(1);
}

const files = fs.readdirSync(posComponentsDir);
let fixedCount = 0;

for (const file of files) {
    if (file.endsWith('.tsx')) {
        const filePath = path.join(posComponentsDir, file);
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Add aria-describedby={undefined} to DialogContent if not present
        if (content.includes('<DialogContent') && !content.includes('aria-describedby')) {
            content = content.replace(/<DialogContent([^>]*)>/g, (match, p1) => {
                if (p1.includes('aria-describedby')) return match;
                return `<DialogContent aria-describedby={undefined}${p1}>`;
            });
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`Fixed ${file}`);
            fixedCount++;
        }
        
        // Also check AlertDialogContent
        if (content.includes('<AlertDialogContent') && !content.includes('aria-describedby')) {
            content = content.replace(/<AlertDialogContent([^>]*)>/g, (match, p1) => {
                if (p1.includes('aria-describedby')) return match;
                return `<AlertDialogContent aria-describedby={undefined}${p1}>`;
            });
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`Fixed ${file} (AlertDialog)`);
            fixedCount++;
        }
    }
}

// Check other places like AuthModal.tsx or anything else just in case?
const rootComponentsDir = path.join(__dirname, '..', 'components');
const rootFiles = fs.readdirSync(rootComponentsDir);
for (const file of rootFiles) {
    if (file.endsWith('.tsx')) {
        const filePath = path.join(rootComponentsDir, file);
        let content = fs.readFileSync(filePath, 'utf8');
        if (content.includes('<DialogContent') && !content.includes('aria-describedby')) {
            content = content.replace(/<DialogContent([^>]*)>/g, (match, p1) => {
                if (p1.includes('aria-describedby')) return match;
                return `<DialogContent aria-describedby={undefined}${p1}>`;
            });
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`Fixed root component ${file}`);
            fixedCount++;
        }
    }
}

console.log(`Done fixing ${fixedCount} files.`);
