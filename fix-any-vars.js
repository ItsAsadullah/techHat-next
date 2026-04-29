const fs = require('fs');
const glob = require('glob');

const files = glob.sync('lib/actions/*.ts');

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');

  // Any parameter types to unknown
  content = content.replace(/([A-Za-z0-9_]+)\s*:\s*any([,)=])/g, '$1: unknown$2');

  // Any in generics
  content = content.replace(/<\s*any\s*>/g, '<unknown>');
  content = content.replace(/<\s*any\s*\[/g, '<unknown[');

  // Any assertions
  content = content.replace(/as\s+any(\W)/g, 'as unknown$1');

  if (fs.readFileSync(file, 'utf8') !== content) {
    fs.writeFileSync(file, content);
    console.log('Fixed ' + file);
  }
}
