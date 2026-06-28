const fs = require('fs');
const path = require('path');

const rootDir = 'd:\\TechHat website\\techhat-next';
const adminDir = path.join(rootDir, 'app', 'admin');
const outputFile = path.join(rootDir, 'admin_codebase.txt');

function getFiles(dir, filesList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      getFiles(fullPath, filesList);
    } else {
      if (/\.(tsx|ts|jsx|js|css)$/.test(file)) {
        filesList.push(fullPath);
      }
    }
  }
  return filesList;
}

try {
  const allFiles = getFiles(adminDir);
  let outputContent = '';

  for (const file of allFiles) {
    const relativePath = path.relative(rootDir, file).replace(/\\/g, '/');
    const fileContent = fs.readFileSync(file, 'utf8');
    
    outputContent += `================================================================\n`;
    outputContent += `FILE: ${relativePath}\n`;
    outputContent += `================================================================\n\n`;
    outputContent += fileContent;
    outputContent += `\n\n\n`;
  }

  fs.writeFileSync(outputFile, outputContent, 'utf8');
  console.log(`Successfully exported ${allFiles.length} files to ${outputFile}`);
} catch (err) {
  console.error('Error generating codebase file:', err);
}
