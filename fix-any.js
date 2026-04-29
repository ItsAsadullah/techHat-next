const fs = require('fs');
const path = require('path');
const dir = 'lib/actions';

fs.readdirSync(dir).forEach(file => {
  if (file.endsWith('.ts') || file.endsWith('.tsx')) {
    const fullPath = path.join(dir, file);
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Replace custom any catch errs
    let newContent = content.replace(/catch\s*\(\s*([^):]+)\s*:\s*any\s*\)/g, 'catch ($1: unknown)');

    if (content !== newContent) {
      fs.writeFileSync(fullPath, newContent);
      console.log(`Updated ${file}`);
    }
  }
});
