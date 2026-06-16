const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'app/api/favicon/route.ts');
let content = fs.readFileSync(filePath, 'utf8');

const replacement = `import { readFileSync } from 'fs';
import { join } from 'path';

function getFallbackFavicon() {
  try {
    const fallbackBuffer = readFileSync(join(process.cwd(), 'public', 'images', 'techhat.png'));
    return new NextResponse(fallbackBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (e) {
    // Ultimate fallback if file is missing
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"></svg>';
    return new NextResponse(svg, {
      headers: { 'Content-Type': 'image/svg+xml' },
    });
  }
}
`;

// Add fs and path imports if missing
if (!content.includes('import { readFileSync } from')) {
    content = content.replace(
        "import { NextResponse, NextRequest } from 'next/server';",
        "import { NextResponse, NextRequest } from 'next/server';\n" + replacement
    );
}

// Replace the redirect with getFallbackFavicon()
content = content.replace(
    /return NextResponse\.redirect\(new URL\('\/images\/techhat\.png', req\.url\), \{ status: 302 \}\);/g,
    "return getFallbackFavicon();"
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed favicon to serve buffer instead of redirect');
