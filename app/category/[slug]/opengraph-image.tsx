import { ImageResponse } from 'next/og';
import { prisma } from '@/lib/prisma';
import { getStoreSettings } from '@/lib/actions/invoice-settings-actions';

export const alt = 'Category Open Graph Image';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image({ params }: { params: { slug: string } }) {
  const category = await prisma.category.findUnique({
    where: { slug: params.slug },
    include: {
      products: { where: { status: 'ACTIVE' }, take: 1 }
    }
  });

  const store = await getStoreSettings();

  if (!category) {
    return new ImageResponse(
      <div style={{ background: '#f8fafc', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48, fontWeight: 700, color: '#334155' }}>
        Category Not Found
      </div>,
      { ...size }
    );
  }

  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          padding: '60px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', marginBottom: '30px' }}>
          {category.image ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={category.image?.replace(/\.webp$/i, '.png').replace(/f_webp/i, 'f_png')} alt={category.name} style={{ width: 120, height: 120, objectFit: 'contain', background: 'white', padding: '16px', borderRadius: '24px' }} />
          ) : (
             <div style={{ fontSize: 80 }}>📦</div>
          )}
        </div>
        <div style={{ fontSize: 72, fontWeight: 900, textAlign: 'center', letterSpacing: '-0.02em', background: 'linear-gradient(to right, #60a5fa, #a78bfa)', backgroundClip: 'text', color: 'transparent', marginBottom: '20px' }}>
          {category.name} Collection
        </div>
        <div style={{ fontSize: 32, color: '#cbd5e1', textAlign: 'center', maxWidth: '800px', lineHeight: 1.5 }}>
          {category.description || `Explore our extensive collection of ${category.name} at ${store.storeName}`}
        </div>
      </div>
    ),
    { ...size }
  );
}
