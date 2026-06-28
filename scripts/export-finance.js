const fs = require('fs');
const path = require('path');

const rootDir = 'd:\\TechHat website\\techhat-next';
const outputFile = path.join(rootDir, 'finance_codebase.txt');

// Define exactly which directories or files to include
const targetPaths = [
  path.join(rootDir, 'app', 'admin', 'finance'),
  path.join(rootDir, 'lib', 'actions', 'finance-actions.ts'),
  path.join(rootDir, 'lib', 'accounting')
];

function getFiles(targetPath, filesList = []) {
  if (!fs.existsSync(targetPath)) return filesList;
  
  const stat = fs.statSync(targetPath);
  if (stat.isDirectory()) {
    const files = fs.readdirSync(targetPath);
    for (const file of files) {
      getFiles(path.join(targetPath, file), filesList);
    }
  } else {
    if (/\.(tsx|ts|jsx|js|css)$/.test(targetPath)) {
      filesList.push(targetPath);
    }
  }
  return filesList;
}

try {
  let allFiles = [];
  for (const tPath of targetPaths) {
    allFiles = getFiles(tPath, allFiles);
  }
  
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
