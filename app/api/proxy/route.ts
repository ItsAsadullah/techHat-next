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
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  
  // If path already includes 'techhat/', strip it to avoid duplication if user passed weird path
  // but assuming path is just 'uploads/...'
  
  const backendUrl = `${backendBase}${cleanPath}`;

  console.log(`Proxying request for: ${path} -> ${backendUrl}`);

  try {
    const response = await fetch(backendUrl);
    
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
