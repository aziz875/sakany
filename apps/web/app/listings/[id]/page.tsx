import { Suspense } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { RoomType, ROOM_TYPE_LABELS } from '@sakany/shared';
import { FavoriteButton } from '@/components/FavoriteButton';
import { VerifiedBadge, FeaturedBadge } from '@/components/VerifiedBadge';
import { FeaturedPhotoCard } from '@/components/FeaturedPhotoCard';
import { ListingCard } from '@/components/ListingCard';
import { getListingCore, getSimilarListings } from '@/lib/server-queries';
import { Skeleton } from '@/components/Skeleton';
import { MapDisplay } from '@/components/MapDisplay';
import { Star, ArrowLeft } from 'lucide-react';

interface PageProps {
  params: Promise<{ id: string }>;
}

export const revalidate = 60;

export default async function ListingDetailPage({ params }: PageProps) {
  const { id } = await params;

  const listing = await getListingCore(id);
  if (!listing) notFound();

  const similarListings = await getSimilarListings(id, listing.roomType as RoomType).catch(() => []);
  const roomLabel = ROOM_TYPE_LABELS[listing.roomType as keyof typeof ROOM_TYPE_LABELS] ?? listing.roomType;

  const mapLocations = [
    { id: listing.id, lat: listing.lat, lng: listing.lng, title: listing.title, price: `${listing.pricePerMonth} DT` },
    ...similarListings
      .filter((l) => l.lat && l.lng)
      .map((l) => ({ id: l.id, lat: l.lat, lng: l.lng, title: l.title, price: `${l.pricePerMonth} DT` })),
  ];

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-72px)] overflow-hidden bg-whitewash">

      {/* ── LEFT: scrollable ─────────────────────────── */}
      <div className="flex-1 overflow-y-auto min-w-0">

        {/* Back */}
        <div className="px-5 pt-5">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft hover:text-ink transition-colors">
            <ArrowLeft size={15} /> Retour
          </Link>
        </div>

        {/* Count header */}
        <div className="flex items-center justify-between px-5 pt-3 pb-2">
          <div>
            <p className="font-semibold text-ink">
              {similarListings.length + 1} logement{similarListings.length > 0 ? 's' : ''} dans la zone
            </p>
            <p className="text-xs text-ink-soft mt-0.5">Résultats autour de ce logement</p>
          </div>
          <span className="hidden sm:block text-sm text-ink">🩷 <span className="font-medium">Prix par mois</span></span>
        </div>

        <div className="px-5 pb-24 space-y-5">

          {/* ── FEATURED CARD ── */}
          <article className="bg-white rounded-2xl border border-sand/50 shadow-sm overflow-hidden">
            <div className="flex flex-col sm:flex-row">

              {/* Photo carousel */}
              <div className="w-full sm:w-[220px] shrink-0">
                <FeaturedPhotoCard title={listing.title} photos={listing.photos ?? []} href={`/listings/${listing.id}/detail`} />
              </div>

              {/* Info */}
              <div className="flex-1 p-4 relative">
                <div className="absolute right-3 top-3">
                  <FavoriteButton listingId={listing.id} />
                </div>

                <div className="flex flex-wrap gap-1.5 mb-1.5">
                  {listing.featured && <FeaturedBadge />}
                  {listing.verified && <VerifiedBadge />}
                </div>

                {/* Clickable title → full detail page */}
                <Link
                  href={`/listings/${listing.id}/detail`}
                  className="group block pr-8"
                >
                  <p className="text-xs text-ink-soft font-medium">{roomLabel}</p>
                  <h2 className="font-semibold text-ink text-base leading-snug mt-0.5 group-hover:underline line-clamp-2">
                    {listing.title}
                  </h2>
                  <p className="mt-1 text-sm text-ink-soft line-clamp-2 leading-relaxed">
                    {listing.description}
                  </p>
                  <p className="mt-1.5 text-xs text-ink-soft">
                    {listing.distanceToCampus} km du campus le plus proche · {listing.furnished ? 'Meublé' : 'Non meublé'}
                  </p>

                  <div className="mt-3 flex items-end justify-between">
                    <p className="text-ink">
                      <span className="font-bold text-lg">{listing.pricePerMonth} DT</span>
                      <span className="text-xs text-ink-soft font-normal"> / mois</span>
                    </p>
                    <div className="flex items-center gap-1">
                      <Star size={12} className="fill-ink text-ink" />
                      <span className="text-xs font-medium text-ink">Nouveau</span>
                    </div>
                  </div>
                </Link>
              </div>
            </div>
          </article>

          {/* ── SIMILAR LISTINGS: 2-col grid ── */}
          {similarListings.length > 0 && (
            <section>
              <p className="font-semibold text-ink text-sm mb-1">Annonces similaires</p>
              <p className="text-xs text-ink-soft mb-4">D&apos;autres logements du même type</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-7">
                {similarListings.map((item, i) => (
                  <ListingCard key={item.id} listing={item} index={i} />
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      {/* ── RIGHT: sticky map ─────────────────────────── */}
      <div className="hidden lg:flex w-[50%] shrink-0 h-full items-center justify-center p-6 bg-sand/10 border-l border-sand">
        <div className="w-full max-w-[650px] aspect-square rounded-3xl overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-sand">
          <MapDisplay locations={mapLocations} hoveredLocationId={listing.id} />
        </div>
      </div>
    </div>
  );
}
