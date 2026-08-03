import Link from 'next/link';
import { notFound } from 'next/navigation';
import { RoomType, ROOM_TYPE_LABELS } from '@sakany/shared';
import { FavoriteButton } from '@/components/FavoriteButton';
import { PhoneReveal } from '@/components/PhoneReveal';
import { VerifiedBadge } from '@/components/VerifiedBadge';
import { BrassDivider } from '@/components/BrassDivider';
import { PhotoGallery } from '@/components/PhotoGallery';
import { ListingCard } from '@/components/ListingCard';
import { ListingReviewsSection } from '@/components/ListingReviewsSection';
import { ApplicationButton } from '@/components/ApplicationButton';
import { getListingDetail, getSimilarListings } from '@/lib/server-queries';

interface PageProps {
  params: Promise<{ id: string }>;
}

// ISR: statically generate listing pages, revalidate every 60s.
// This makes navigation between listings instant after first visit.
export const revalidate = 60;

export default async function ListingDetailPage({ params }: PageProps) {
  const { id } = await params;

  // Direct DB query — no HTTP round-trip to our own API.
  const listing = await getListingDetail(id);

  if (!listing) notFound();

  const roomLabel = ROOM_TYPE_LABELS[listing.roomType as keyof typeof ROOM_TYPE_LABELS] ?? listing.roomType;

  // Fetch similar listings using the listing's actual room type.
  const similarListings = await getSimilarListings(id, listing.roomType).catch(() => []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <Link href="/" className="text-sm text-door hover:text-door-deep">
        ← Retour aux annonces
      </Link>

      <div className="mt-6 grid gap-8 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <PhotoGallery title={listing.title} photos={listing.photos ?? []} />
        </div>

        <div className="lg:col-span-2">
          <div className="flex flex-wrap items-start gap-2">
            {listing.verified && <VerifiedBadge />}
            {listing.featured && (
              <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800">
                En vedette
              </span>
            )}
            {listing.furnished && (
              <span className="rounded-full bg-sand px-2.5 py-1 text-xs text-ink-soft">
                Meublé
              </span>
            )}
          </div>

          <h1 className="mt-3 font-display text-3xl font-bold text-ink">{listing.title}</h1>
          <p className="mt-1 text-ink-soft">{roomLabel}</p>

          <div className="mt-4 flex flex-wrap items-end gap-4">
            <p className="font-display text-3xl font-semibold text-ink">
              {listing.pricePerMonth} DT
              <span className="text-base font-normal text-ink-soft">/mois</span>
            </p>
            <FavoriteButton listingId={listing.id} showLabel />
          </div>
          <p className="text-ink-soft">{listing.distanceToCampus} km du campus ESPRIT</p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-sand bg-white p-4">
              <p className="text-sm text-ink-soft">Type</p>
              <p className="mt-1 font-medium text-ink">{roomLabel}</p>
            </div>
            <div className="rounded-2xl border border-sand bg-white p-4">
              <p className="text-sm text-ink-soft">Distance</p>
              <p className="mt-1 font-medium text-ink">{listing.distanceToCampus} km</p>
            </div>
            <div className="rounded-2xl border border-sand bg-white p-4">
              <p className="text-sm text-ink-soft">Mobilier</p>
              <p className="mt-1 font-medium text-ink">{listing.furnished ? 'Meublé' : 'Non meublé'}</p>
            </div>
            <div className="rounded-2xl border border-sand bg-white p-4">
              <p className="text-sm text-ink-soft">Statut</p>
              <p className="mt-1 font-medium text-ink">{listing.verified ? 'Vérifié' : 'Standard'}</p>
            </div>
          </div>

          <BrassDivider />

          <section>
            <h2 className="font-display text-lg font-semibold text-ink">Description</h2>
            <p className="mt-2 leading-relaxed text-ink-soft">{listing.description}</p>
          </section>

          <BrassDivider />

          <section className="rounded-2xl border border-sand bg-white p-5 shadow-sm">
            <h2 className="font-display text-lg font-semibold text-ink">Contacter le propriétaire</h2>
            <p className="mt-1 text-sm text-ink-soft">{listing.landlord?.fullName ?? 'Propriétaire'}</p>
            <div className="mt-4">
              <PhoneReveal listingId={listing.id} />
            </div>
            <ApplicationButton listingId={listing.id} />
          </section>
        </div>
      </div>

      <ListingReviewsSection
        listingId={listing.id}
        reviews={listing.reviews}
        averageRating={listing.averageRating}
      />

      {similarListings.length > 0 && (
        <section className="mt-16">
          <BrassDivider />
          <h2 className="mt-8 font-display text-2xl font-semibold text-ink">
            Annonces similaires
          </h2>
          <p className="mt-1 text-ink-soft">
            D'autres logements du même type à proximité
          </p>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {similarListings.map((item) => (
              <ListingCard key={item.id} listing={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}