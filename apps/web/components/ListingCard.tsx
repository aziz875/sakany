'use client';

import Image from 'next/image';
import Link from 'next/link';
import { memo } from 'react';
import { Listing, ROOM_TYPE_LABELS } from '@sakany/shared';
import { FavoriteButton } from './FavoriteButton';
import { VerifiedBadge } from './VerifiedBadge';

interface ListingCardProps {
  listing: Listing;
}

function ListingCardInner({ listing }: ListingCardProps) {
  const photo = listing.photos?.[0]?.url;
  const roomLabel = ROOM_TYPE_LABELS[listing.roomType as keyof typeof ROOM_TYPE_LABELS];

  return (
    <article
      className="group flex flex-col overflow-hidden rounded-2xl border border-sand bg-white transition-shadow hover:shadow-lg"
      aria-label={`Annonce : ${listing.title}, ${listing.pricePerMonth} DT/mois`}
    >
      <div className="relative mx-3 mt-3">
        <Link href={`/listings/${listing.id}`} className="block" tabIndex={-1} aria-hidden="true">
          <div className="arch-frame relative aspect-[4/3] bg-sand">
            {photo ? (
              <Image
                src={photo}
                alt={`Photo principale de l'annonce "${listing.title}"`}
                fill
                className="object-cover transition-transform group-hover:scale-[1.02]"
                sizes="(max-width:768px) 100vw, 33vw"
                loading="lazy"
              />
            ) : (
              <div
                className="flex h-full items-center justify-center text-ink-soft"
                aria-label="Aucune photo disponible"
              >
                Pas de photo
              </div>
            )}
            {listing.verified && (
              <div className="absolute left-3 top-3">
                <VerifiedBadge />
              </div>
            )}
            {listing.featured && (
              <div
                className="absolute right-3 top-3 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800"
                aria-label="Annonce en vedette"
              >
                En vedette
              </div>
            )}
          </div>
        </Link>

        <div className="absolute bottom-3 right-3">
          <FavoriteButton listingId={listing.id} />
        </div>
      </div>

      <Link
        href={`/listings/${listing.id}`}
        className="flex flex-1 flex-col gap-2 p-4 pt-3 focus-visible:outline-door focus-visible:outline-offset-2"
        aria-label={`Voir l'annonce : ${listing.title}`}
      >
        <h3 className="font-display text-lg font-semibold leading-snug text-ink group-hover:text-door">
          {listing.title}
        </h3>
        <p className="text-sm text-ink-soft">{roomLabel}</p>
        <div className="mt-auto flex items-end justify-between pt-2">
          <div>
            <p className="font-display text-xl font-semibold text-ink">
              {listing.pricePerMonth} DT
              <span className="text-sm font-normal text-ink-soft">/mois</span>
            </p>
            <p className="text-sm text-ink-soft">{listing.distanceToCampus} km d&apos;ESPRIT</p>
          </div>
          {listing.furnished && (
            <span className="rounded-full bg-sand px-2.5 py-1 text-xs text-ink-soft" aria-label="Meublé">
              Meublé
            </span>
          )}
        </div>
      </Link>
    </article>
  );
}

/**
 * Memoized listing card to avoid re-renders in long listing lists.
 * Only re-renders when the listing object reference changes.
 */
export const ListingCard = memo(ListingCardInner);
