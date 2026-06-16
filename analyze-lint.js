const fs = require('fs');

const log = fs.readFileSync('C:/Users/Administrator/.gemini/antigravity-ide/brain/490d4005-60f6-466b-aa8a-870c58b80799/.system_generated/tasks/task-1271.log', 'utf8');

const lines = log.split('\n');
const fileStats = {};
let currentFile = null;

for (const line of lines) {
    if (line.startsWith('D:\\')) {
        currentFile = line.trim();
        if (!fileStats[currentFile]) {
            fileStats[currentFile] = { any: 0, unused: 0, require: 0, other: 0 };
        }
    } else if (currentFile && line.includes('@typescript-eslint/')) {
        if (line.includes('no-explicit-any')) fileStats[currentFile].any++;
        else if (line.includes('no-unused-vars')) fileStats[currentFile].unused++;
        else if (line.includes('no-require-imports')) fileStats[currentFile].require++;
        else fileStats[currentFile].other++;
    }
}

const sortedFiles = Object.entries(fileStats)
    .sort((a, b) => (b[1].any + b[1].unused) - (a[1].any + a[1].unused))
    .slice(0, 20);

console.log("Top 20 files with the most issues:");
for (const [file, stats] of sortedFiles) {
    const relPath = file.replace('D:\\TechHat website\\techhat-next\\', '');
    console.log(`${relPath} - Any: ${stats.any}, Unused: ${stats.unused}, Require: ${stats.require}`);
}
