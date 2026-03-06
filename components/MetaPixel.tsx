'use client';

import Script from 'next/script';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, Suspense } from 'react';

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

/**
 * Tracks a PageView whenever the URL changes (client-side navigation).
 * Wrapped in <Suspense> by the parent because useSearchParams() requires it.
 */
function PixelPageTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!PIXEL_ID) return;
    if (typeof window.fbq !== 'function') return;
    window.fbq('track', 'PageView');
  }, [pathname, searchParams]);

  return null;
}

/**
 * Drop this once in app/layout.tsx (inside <body>).
 * It injects the Meta Pixel base code and fires PageView on every navigation.
 *
 * Required env var:
 *   NEXT_PUBLIC_META_PIXEL_ID=your_pixel_id_here
 */
export default function MetaPixel() {
  if (!PIXEL_ID) return null;

  return (
    <>
      {/* ── Meta Pixel base code ── */}
      <Script
        id="meta-pixel"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
!function(f,b,e,v,n,t,s){
  if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};
  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
  n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];
  s.parentNode.insertBefore(t,s)}(window,document,'script',
  'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${PIXEL_ID}');
fbq('track', 'PageView');
          `,
        }}
      />

      {/* ── noscript fallback (required by Meta) ── */}
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          style={{ display: 'none' }}
          src={`https://www.facebook.com/tr?id=${PIXEL_ID}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>

      {/* ── Client-side route change tracker ── */}
      <Suspense fallback={null}>
        <PixelPageTracker />
      </Suspense>
    </>
  );
}
