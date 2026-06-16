import { NextResponse, NextRequest } from 'next/server';
import { readFileSync } from 'fs';
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

import { getBrandingSettings } from '@/lib/actions/invoice-settings-actions';

// Always serve the freshest favicon from DB settings
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const branding = await getBrandingSettings();
    const faviconUrl = branding.siteFavicon;

    if (!faviconUrl) {
      return getFallbackFavicon();
    }

    // Cloudinary or other absolute public URL → redirect browser to it
    if (
      faviconUrl.startsWith('http') &&
      !faviconUrl.includes('localhost') &&
      !faviconUrl.includes('127.0.0.1')
    ) {
      return NextResponse.redirect(faviconUrl, { status: 302 });
    }

    // Local backend URL — proxy the bytes
    let relativePath = '';
    if (faviconUrl.includes('/techhat/')) {
      relativePath = faviconUrl.split('/techhat/')[1];
    } else {
      relativePath = faviconUrl.startsWith('/') ? faviconUrl.slice(1) : faviconUrl;
    }

    const backendUrl = `http://127.0.0.1/techhat/${relativePath}`;
    const res = await fetch(backendUrl);
    if (!res.ok) return getFallbackFavicon();

    const buf = Buffer.from(await res.arrayBuffer());
    const contentType = res.headers.get('content-type') || 'image/x-icon';

    return new NextResponse(buf, {
      headers: {
        'Content-Type': contentType,
        // Cache 1 hour in browser, always revalidate on Vercel edge
        'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch {
    return getFallbackFavicon();
  }
}
