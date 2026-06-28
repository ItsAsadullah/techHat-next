import { ImageResponse } from 'next/og';
import { prisma } from '@/lib/prisma';
import { getStoreSettings } from '@/lib/actions/invoice-settings-actions';

// Route segment config
export const alt = 'Product Open Graph Image';
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

export default async function Image({ params }: { params: { slug: string } }) {
  // Fetch product data
  const product = await prisma.product.findUnique({
    where: { slug: params.slug },
    include: {
      productImages: { where: { isThumbnail: true }, take: 1 },
      brand: true,
    }
  });

  const store = await getStoreSettings();

  if (!product) {
    return new ImageResponse(
      (
        <div style={{ background: '#f8fafc', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48, fontWeight: 700, color: '#334155' }}>
          Product Not Found
        </div>
      ),
      { ...size }
    );
  }

  const imageUrl = product.productImages?.[0]?.url;
  const brandName = product.brand?.name || store.storeName || 'TechHat';
  const price = product.offerPrice || product.price;

  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          padding: '60px',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', width: '55%', pr: '40px' }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px' }}>
            {brandName}
          </div>
          
          <div style={{ fontSize: 56, fontWeight: 900, color: '#0f172a', lineHeight: 1.1, marginBottom: '24px', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {product.name}
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ fontSize: 48, fontWeight: 800, color: '#ef4444' }}>
              ৳{price.toLocaleString()}
            </div>
            {product.offerPrice && product.price > product.offerPrice && (
              <div style={{ fontSize: 32, fontWeight: 600, color: '#94a3b8', textDecoration: 'line-through' }}>
                ৳{product.price.toLocaleString()}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', marginTop: 'auto', background: '#3b82f6', color: 'white', padding: '12px 32px', borderRadius: '12px', fontSize: 24, fontWeight: 600, width: 'max-content' }}>
            Available Now at {store.storeName}
          </div>
        </div>
        
        <div style={{ width: '40%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'white', borderRadius: '24px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', overflow: 'hidden', padding: '20px' }}>
          {imageUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={imageUrl} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          ) : (
            <div style={{ fontSize: 120, color: '#cbd5e1' }}>🛍️</div>
          )}
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
