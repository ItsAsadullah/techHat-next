import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const path = searchParams.get('path');

  if (!path) {
    return new NextResponse('Missing path parameter', { status: 400 });
  }

  // Construct the backend URL
  // Use 127.0.0.1 to avoid IPv6 resolution issues with localhost
  // The path parameter should be relative to the techhat folder
  const backendBase = 'http://127.0.0.1/techhat/';
  let cleanPath: string;
  try {
    cleanPath = decodeURIComponent(path).replace(/\\/g, '/');
  } catch {
    return new NextResponse('Invalid path parameter', { status: 400 });
  }
  cleanPath = cleanPath.startsWith('/') ? cleanPath.slice(1) : cleanPath;

  if (
    cleanPath.includes('..') ||
    cleanPath.includes('//') ||
    !/^(uploads|products|categories|brands|homepage)\//i.test(cleanPath) ||
    !/\.(png|jpe?g|webp|gif|svg|avif)$/i.test(cleanPath)
  ) {
    return new NextResponse('Forbidden path', { status: 403 });
  }
  
  // If path already includes 'techhat/', strip it to avoid duplication if user passed weird path
  // but assuming path is just 'uploads/...'
  
  const backendUrl = `${backendBase}${cleanPath}`;

  try {
    const response = await fetch(backendUrl, { cache: 'force-cache' });
    
    if (!response.ok) {
      return new NextResponse(`Backend responded with ${response.status}`, { status: response.status });
    }

    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Proxy error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
