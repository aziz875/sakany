import { Suspense } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ROOM_TYPE_LABELS } from '@sakany/shared';
import { FavoriteButton } from '@/components/FavoriteButton';
import { PhoneReveal } from '@/components/PhoneReveal';
import { VerifiedBadge, FeaturedBadge } from '@/components/VerifiedBadge';
import { PhotoGallery } from '@/components/PhotoGallery';
import { ListingReviewsSection } from '@/components/ListingReviewsSection';
import { ApplicationButton } from '@/components/ApplicationButton';
import { DirectMessageModal } from '@/components/DirectMessageModal';
import { getListingCore, getListingReviews } from '@/lib/server-queries';
import { Skeleton } from '@/components/Skeleton';
import { MapDisplay } from '@/components/MapDisplay';
import { ReportModal } from '@/components/ReportModal';
import { BrassDivider } from '@/components/BrassDivider';
import { Star, ArrowLeft, Share2, Heart, ShieldCheck, MapPin, Ruler, Sofa } from 'lucide-react';

interface PageProps {
  params: Promise<{ id: string }>;
}

export const revalidate = 60;

function reviewAverage(reviews: Awaited<ReturnType<typeof getListingReviews>>) {
  if (reviews.length === 0) return undefined;
  return Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10) / 10;
}

async function ReviewsBlock({ listingId }: { listingId: string }) {
  const reviews = await getListingReviews(listingId);
  return <ListingReviewsSection listingId={listingId} reviews={reviews} averageRating={reviewAverage(reviews)} />;
}

export default async function ListingFullDetailPage({ params }: PageProps) {
  const { id } = await params;

  const listing = await getListingCore(id);
  if (!listing) notFound();

  const reviews = await getListingReviews(id).catch(() => []);
  const avg = reviewAverage(reviews);
  const roomLabel = ROOM_TYPE_LABELS[listing.roomType as keyof typeof ROOM_TYPE_LABELS] ?? listing.roomType;
  const landlordInitial = listing.landlord?.fullName?.charAt(0).toUpperCase() ?? 'P';

  return (
    <div className="bg-white min-h-screen">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">

        {/* ── Title row ─────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <Link
              href={`/listings/${listing.id}`}
              className="flex items-center justify-center h-9 w-9 rounded-full border border-sand hover:bg-sand/40 transition shrink-0"
              aria-label="Retour"
            >
              <ArrowLeft size={17} className="text-ink" />
            </Link>
            <h1 className="font-semibold text-ink text-xl sm:text-2xl leading-snug line-clamp-2">
              {listing.title}
            </h1>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button className="flex items-center gap-2 text-sm font-medium text-ink underline underline-offset-2 hover:text-ink-soft transition">
              <Share2 size={15} /> Partager
            </button>
            <FavoriteButton listingId={listing.id} showLabel />
          </div>
        </div>

        {/* ── Photo Mosaic ──────────────────────────────── */}
        <PhotoGallery title={listing.title} photos={listing.photos ?? []} />

        {/* ── Two-column layout ─────────────────────────── */}
        <div className="flex flex-col lg:flex-row gap-10 xl:gap-16 mt-8 pb-16">

          {/* ── LEFT: full detail content ─────────────── */}
          <div className="flex-1 min-w-0">

            {/* Sub-title row */}
            <div className="pb-6 border-b border-sand">
              <p className="font-semibold text-ink text-xl">
                {roomLabel} · {listing.distanceToCampus} km d&apos;ESPRIT
              </p>
              <p className="text-ink-soft mt-1 text-sm">
                {listing.furnished ? 'Meublé' : 'Non meublé'}
                {listing.verified ? ' · Annonce vérifiée' : ''}
              </p>
            </div>

            {/* ── Highlights bar (Airbnb "Coup de coeur" row) ── */}
            <div className="flex flex-wrap gap-x-8 gap-y-4 py-6 border-b border-sand">
              {listing.featured && (
                <div className="flex items-start gap-3">
                  <span className="text-2xl mt-0.5">🩷</span>
                  <div>
                    <p className="font-semibold text-ink text-sm">Coup de cœur</p>
                    <p className="text-xs text-ink-soft mt-0.5">Un des logements préférés des voyageurs</p>
                  </div>
                </div>
              )}
              {listing.verified && (
                <div className="flex items-start gap-3">
                  <ShieldCheck size={22} className="text-emerald-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold text-ink text-sm">Annonce vérifiée</p>
                    <p className="text-xs text-ink-soft mt-0.5">Vérifiée manuellement par l&apos;équipe Sakany</p>
                  </div>
                </div>
              )}
              {avg !== undefined && (
                <div className="flex items-start gap-3">
                  <Star size={20} className="fill-ink text-ink mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold text-ink text-sm">{avg} ★</p>
                    <p className="text-xs text-ink-soft mt-0.5">{reviews.length} commentaire{reviews.length > 1 ? 's' : ''}</p>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3">
                <MapPin size={20} className="text-door mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-ink text-sm">{listing.distanceToCampus} km d&apos;ESPRIT</p>
                  <p className="text-xs text-ink-soft mt-0.5">Ariana Soghra, Tunis</p>
                </div>
              </div>
            </div>

            {/* ── Host row ── */}
            <div className="flex items-center gap-4 py-6 border-b border-sand">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-door/10 text-lg font-bold text-door">
                {landlordInitial}
              </div>
              <div>
                <p className="font-semibold text-ink">
                  Logement proposé par {listing.landlord?.fullName ?? 'Propriétaire'}
                </p>
                <p className="text-sm text-ink-soft">
                  Membre depuis {new Date(listing.landlord?.createdAt ?? listing.createdAt).getFullYear()}
                  {listing.landlord?.listingCount ? ` · ${listing.landlord.listingCount} annonce${listing.landlord.listingCount > 1 ? 's' : ''}` : ''}
                </p>
              </div>
              {listing.verified && <VerifiedBadge />}
            </div>

            {/* ── Description ── */}
            <div className="py-6 border-b border-sand">
              <p className="text-ink leading-relaxed whitespace-pre-line">{listing.description}</p>
            </div>

            {/* ── Amenities / specs ── */}
            <div className="py-6 border-b border-sand">
              <h2 className="font-semibold text-ink text-lg mb-4">Ce que propose ce logement</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center gap-3 py-2">
                  <Ruler size={20} className="text-ink-soft shrink-0" />
                  <span className="text-ink text-sm">{listing.distanceToCampus} km du campus ESPRIT</span>
                </div>
                <div className="flex items-center gap-3 py-2">
                  <span className="text-xl shrink-0">🏠</span>
                  <span className="text-ink text-sm">{roomLabel}</span>
                </div>
                <div className="flex items-center gap-3 py-2">
                  <Sofa size={20} className="text-ink-soft shrink-0" />
                  <span className="text-ink text-sm">{listing.furnished ? 'Meublé' : 'Non meublé'}</span>
                </div>
                {listing.verified && (
                  <div className="flex items-center gap-3 py-2">
                    <ShieldCheck size={20} className="text-emerald-500 shrink-0" />
                    <span className="text-ink text-sm">Annonce vérifiée par Sakany</span>
                  </div>
                )}
              </div>
            </div>



            {/* ── Reviews ── */}
            <div className="py-6">
              <Suspense fallback={
                <div className="space-y-3">
                  <Skeleton className="h-6 w-40 rounded-full" />
                  <Skeleton className="h-24 rounded-2xl" />
                </div>
              }>
                <ReviewsBlock listingId={listing.id} />
              </Suspense>
            </div>

            <div className="pb-4">
              <ReportModal listingId={listing.id} />
            </div>
          </div>

          {/* ── RIGHT: sticky booking card ─────────────── */}
          <div className="w-full lg:w-[360px] xl:w-[380px] shrink-0">
            <div className="sticky top-6">

              {/* Price card */}
              <div className="rounded-2xl border border-sand bg-white shadow-[0_6px_30px_rgba(0,0,0,0.10)] p-6">

                {/* Price + "Les prix comprennent tous les frais" tag */}
                <div className="flex items-start justify-between mb-1">
                  <div>
                    <span className="font-bold text-2xl text-ink">{listing.pricePerMonth} DT</span>
                    <span className="text-sm text-ink-soft font-normal"> / mois</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs bg-sand/50 rounded-full px-2.5 py-1 text-ink-soft">
                    🩷 Prix tout inclus
                  </div>
                </div>

                {/* Rating */}
                {avg !== undefined && (
                  <div className="flex items-center gap-1.5 text-sm text-ink mb-5">
                    <Star size={13} className="fill-ink text-ink" />
                    <span className="font-semibold">{avg}</span>
                    <span className="text-ink-soft">· {reviews.length} avis</span>
                  </div>
                )}

                {/* Badges */}
                <div className="flex flex-wrap gap-2 mb-5">
                  {listing.featured && <FeaturedBadge />}
                  {listing.verified && <VerifiedBadge />}
                  {listing.furnished && (
                    <span className="text-xs bg-sand/60 border border-sand rounded-full px-2.5 py-1 text-ink-soft font-medium">Meublé</span>
                  )}
                </div>

                {/* CTA Buttons */}
                <div className="flex flex-col gap-3">
                  <DirectMessageModal
                    recipientId={listing.landlordId}
                    recipientName={listing.landlord?.fullName || 'Propriétaire'}
                    listingTitle={listing.title}
                    buttonLabel="Envoyer un message au propriétaire"
                    buttonClassName="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-door px-4 py-3 font-semibold text-white text-sm transition hover:bg-door-deep shadow-sm"
                  />
                  <PhoneReveal listingId={listing.id} />
                  <ApplicationButton listingId={listing.id} />
                </div>

                <p className="text-center text-xs text-ink-soft mt-4">Aucune commission pour les étudiants</p>

                {/* Host mini card */}
                <div className="mt-5 pt-5 border-t border-sand flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-door/10 font-bold text-door">
                    {landlordInitial}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-ink truncate">{listing.landlord?.fullName ?? 'Propriétaire'}</p>
                    <p className="text-xs text-ink-soft">Propriétaire</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
