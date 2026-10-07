import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/landlord/', '/profile/', '/auth/'],
    },
    sitemap: 'https://sakany.tn/sitemap.xml',
  };
}
