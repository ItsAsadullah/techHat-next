const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'app/api/favicon/route.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Add NextRequest import
if (!content.includes('NextRequest')) {
    content = content.replace(
        "import { NextResponse } from 'next/server';",
        "import { NextResponse, NextRequest } from 'next/server';"
    );
}

// Replace GET() with GET(req: NextRequest)
content = content.replace(
    /export async function GET\(\) \{/,
    "export async function GET(req: NextRequest) {"
);

// Replace 404s with redirect
const defaultRedirect = "return NextResponse.redirect(new URL('/images/techhat.png', req.url), { status: 302 });";

// Replace `return new NextResponse(null, { status: 404 });` with the redirect
content = content.replace(
    /return new NextResponse\(null, \{ status: 404 \}\);/g,
    defaultRedirect
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed favicon route to redirect instead of 404');
