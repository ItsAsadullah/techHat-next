import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Only log admin routes when performance monitoring is enabled
  if (request.nextUrl.pathname.startsWith('/admin') && process.env.ENABLE_PERF_MONITORING) {
    const startTime = performance.now();
    
    // Store timing info in response header for client to read
    const response = NextResponse.next();
    response.headers.set('X-Request-Start', startTime.toString());
    
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
