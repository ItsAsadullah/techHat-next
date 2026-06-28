import { ImageResponse } from 'next/og';
import { getStoreSettings } from '@/lib/actions/invoice-settings-actions';
import { getBrandingSettings } from '@/lib/actions/invoice-settings-actions';

// Remove edge runtime to allow Prisma queries in Node.js

// Route segment config
export const alt = 'Store Open Graph Image';
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

export default async function Image() {
  const store = await getStoreSettings();
  const branding = await getBrandingSettings();
  
  const siteLogo = branding.siteLogo?.replace(/\.webp$/i, '.png').replace(/f_webp/i, 'f_png');
  const storeName = store.storeName || 'TechHat';
  const tagline = store.tagline || 'Your Ultimate Tech Destination';

  const safeOgImage = branding.siteOgImage?.replace(/\.webp$/i, '.png').replace(/f_webp/i, 'f_png');

  if (safeOgImage) {
    return new ImageResponse(
      (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img 
          src={safeOgImage}  
          alt={storeName} 
          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
        />
      ),
      { ...size }
    );
  }

  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #000000 0%, #1a1a2e 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          padding: '40px',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid rgba(255,255,255,0.1)',
            borderRadius: '32px',
            padding: '60px',
            background: 'rgba(255,255,255,0.05)',
            backdropFilter: 'blur(10px)',
          }}
        >
          {siteLogo ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img 
              src={siteLogo} 
              alt={storeName} 
              style={{ maxHeight: '100px', maxWidth: '400px', objectFit: 'contain', marginBottom: '20px' }} 
            />
          ) : (
            <div
              style={{
                fontSize: 80,
                fontWeight: 900,
                letterSpacing: '-0.05em',
                marginBottom: '10px',
                background: 'linear-gradient(to right, #4facfe 0%, #00f2fe 100%)',
                backgroundClip: 'text',
                color: 'transparent',
              }}
            >
              {storeName}
            </div>
          )}
          
          <div
            style={{
              fontSize: 32,
              fontWeight: 500,
              color: '#a1a1aa', // text-muted-foreground / zinc-400
              marginTop: '15px',
              textAlign: 'center',
              maxWidth: '800px',
              lineHeight: 1.4,
            }}
          >
            {tagline}
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              marginTop: '40px',
              padding: '10px 24px',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '999px',
              fontSize: 24,
              fontWeight: 600,
              color: '#e2e8f0',
            }}
          >
            {store.website || 'Shop Now'}
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
