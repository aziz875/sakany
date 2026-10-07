import { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://sakany.tn';

  // Static routes
  const routes = ['', '/auth/login', '/auth/register'].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1 : 0.8,
  }));

  // Dynamic listing routes
  const listings = await prisma.listing.findMany({
    select: { id: true, updatedAt: true },
  });

  const listingUrls = listings.map((listing) => ({
    url: `${baseUrl}/listings/${listing.id}`,
    lastModified: listing.updatedAt,
    changeFrequency: 'daily' as const,
    priority: 0.9,
  }));

  return [...routes, ...listingUrls];
}
