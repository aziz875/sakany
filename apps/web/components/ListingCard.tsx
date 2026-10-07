'use client';

import Image from 'next/image';
import Link from 'next/link';
import { memo, useEffect, useState, type CSSProperties } from 'react';
import { Listing, ROOM_TYPE_LABELS } from '@sakany/shared';
import { FavoriteButton } from './FavoriteButton';
import { BrandImageFallback } from './BrandImageFallback';
import { FeaturedBadge, VerifiedBadge } from './VerifiedBadge';
import { Star, MapPin } from 'lucide-react';

interface ListingCardProps {
  listing: Listing;
  index?: number;
  selectedUniversity?: { id: string; name: string };
}

function ListingCardInner({ listing, index = 0, selectedUniversity }: ListingCardProps) {
  const photo = listing.photos?.[0]?.url;
  const roomLabel = ROOM_TYPE_LABELS[listing.roomType as keyof typeof ROOM_TYPE_LABELS];
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [photo]);

  // Compute distance label
  let distanceLabel = `${listing.distanceToCampus} km`;
  if (selectedUniversity && listing.nearbyUniversities?.length) {
    const match = listing.nearbyUniversities.find(
      (nu) => nu.universityId === selectedUniversity.id
    );
    if (match) {
      distanceLabel = `${match.distanceKm} km de ${selectedUniversity.name}`;
    } else {
      distanceLabel = `${listing.distanceToCampus} km`;
    }
  } else if (listing.nearbyUniversities?.length) {
    const closest = listing.nearbyUniversities[0];
    distanceLabel = `${closest.distanceKm} km de ${closest.universityName}`;
  }

  return (
    <article
      className="card-enter group flex flex-col cursor-pointer relative"
      style={{ '--card-delay': `${index * 70}ms` } as CSSProperties}
      aria-label={`Annonce : ${listing.title}, ${listing.pricePerMonth} DT/mois`}
    >
      <Link href={`/listings/${listing.id}`} className="block relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-sand" tabIndex={-1} aria-hidden="true">
        {photo && !imageFailed ? (
          <Image
            src={photo}
            alt={`Photo principale de l'annonce "${listing.title}"`}
            fill
            className="object-cover transition-transform duration-300 ease-out group-hover:scale-105"
            sizes="(max-width:768px) 100vw, 33vw"
            loading="lazy"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <BrandImageFallback title={listing.title} className="absolute inset-0" compact />
        )}

        {/* Badges on top left */}
        <div className="absolute left-3 top-3 flex flex-col gap-2">
          {listing.verified && <VerifiedBadge />}
          {listing.featured && <FeaturedBadge />}
        </div>
      </Link>

      {/* Favorite Button on top right, absolutely positioned relative to the article so it can sit over the image */}
      <div className="absolute right-3 top-3 z-10">
        <FavoriteButton listingId={listing.id} />
      </div>

      <Link
        href={`/listings/${listing.id}`}
        className="mt-3 flex flex-col focus-visible:outline-door focus-visible:outline-offset-2"
        aria-label={`Voir l'annonce : ${listing.title}`}
      >
        <div className="flex items-start justify-between">
          <h3 className="font-semibold text-ink truncate mr-2">
            {listing.title}
          </h3>
          <div className="flex items-center gap-1 shrink-0">
            <Star size={14} className="fill-ink text-ink" />
            <span className="text-sm text-ink font-light">Nouveau</span>
          </div>
        </div>

        <p className="text-sm text-ink-soft truncate mt-0.5">
          {roomLabel} · {distanceLabel}
        </p>
        {listing.furnished && <p className="text-sm text-ink-soft truncate mt-0.5">Meublé</p>}

        <p className="mt-1">
          <span className="font-semibold text-ink">{listing.pricePerMonth} DT</span>
          <span className="text-ink-soft"> par mois</span>
        </p>
      </Link>
    </article>
  );
}

/**
 * Memoized listing card to avoid re-renders in long listing lists.
 * Only re-renders when the listing object reference changes.
 */
export const ListingCard = memo(ListingCardInner);
