import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/api/', '/checkout/', '/account/'],
    },
    sitemap: `${process.env.NEXT_PUBLIC_APP_URL || 'https://techhat.shop'}/sitemap.xml`,
  };
}
