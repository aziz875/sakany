'use client';

import { useState, useMemo, useCallback, useRef } from 'react';
import Link from 'next/link';
import { ROOM_TYPE_LABELS } from '@sakany/shared';
import { FavoriteButton } from '@/components/FavoriteButton';
import { VerifiedBadge, FeaturedBadge } from '@/components/VerifiedBadge';
import { FeaturedPhotoCard } from '@/components/FeaturedPhotoCard';
import { ListingCard } from '@/components/ListingCard';
import { MapDisplay, MapLocation } from '@/components/MapDisplay';
import { Star, ArrowLeft } from 'lucide-react';

interface ListingDetailSplitViewProps {
  initialListing: any;
  initialSimilarListings: any[];
}

export function ListingDetailSplitView({
  initialListing,
  initialSimilarListings,
}: ListingDetailSplitViewProps) {
  // Store of all known listings keyed by id
  const [listingsMap, setListingsMap] = useState<Record<string, any>>(() => {
    const map: Record<string, any> = { [initialListing.id]: initialListing };
    initialSimilarListings.forEach((l) => {
      map[l.id] = l;
    });
    return map;
  });

  const [activeListingId, setActiveListingId] = useState<string>(initialListing.id);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const activeListing = listingsMap[activeListingId] || initialListing;

  // Similar listings are all listings except the current active one
  const similarListings = useMemo(() => {
    return Object.values(listingsMap).filter((l) => l.id !== activeListingId);
  }, [listingsMap, activeListingId]);

  const roomLabel =
    ROOM_TYPE_LABELS[activeListing.roomType as keyof typeof ROOM_TYPE_LABELS] ??
    activeListing.roomType;

  // Build map locations with all available properties
  const mapLocations: MapLocation[] = useMemo(() => {
    return Object.values(listingsMap)
      .filter((l) => l.lat && l.lng)
      .map((l) => ({
        id: l.id,
        lat: l.lat,
        lng: l.lng,
        title: l.title,
        price: `${l.pricePerMonth} DT`,
        photoUrl: l.photos?.[0]?.url,
        roomType:
          ROOM_TYPE_LABELS[l.roomType as keyof typeof ROOM_TYPE_LABELS] ?? l.roomType,
        verified: l.verified,
        href: `/listings/${l.id}`,
      }));
  }, [listingsMap]);

  // Handle clicking a price marker on the map or similar listing card
  const handleSelectListing = useCallback(
    (newId: string) => {
      if (newId === activeListingId) return;

      setActiveListingId(newId);

      // Smoothly update browser URL without full page reload
      window.history.replaceState(null, '', `/listings/${newId}`);

      // Scroll to top of left column so user immediately views the newly selected logement
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
    },
    [activeListingId]
  );

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-72px)] overflow-hidden bg-whitewash">
      {/* ── LEFT: scrollable ─────────────────────────── */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto min-w-0">
        {/* Back */}
        <div className="px-5 pt-5">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft hover:text-ink transition-colors"
          >
            <ArrowLeft size={15} /> Retour
          </Link>
        </div>

        {/* Count header */}
        <div className="flex items-center justify-between px-5 pt-3 pb-2">
          <div>
            <p className="font-semibold text-ink">
              {similarListings.length + 1} logement{similarListings.length > 0 ? 's' : ''} dans la zone
            </p>
            <p className="text-xs text-ink-soft mt-0.5">
              Cliquez sur un prix sur la carte pour afficher directement le logement
            </p>
          </div>
          <span className="hidden sm:block text-sm text-ink">
            🩷 <span className="font-medium">Prix par mois</span>
          </span>
        </div>

        <div className="px-5 pb-24 space-y-5">
          {/* ── FEATURED CARD (Swaps dynamically with smooth fade) ── */}
          <article
            key={activeListing.id}
            className="page-enter bg-white rounded-2xl border border-sand/50 shadow-sm overflow-hidden transition-all duration-300 ring-2 ring-door/20"
          >
            <div className="flex flex-col sm:flex-row">
              {/* Photo carousel */}
              <div className="w-full sm:w-[220px] shrink-0">
                <FeaturedPhotoCard
                  title={activeListing.title}
                  photos={activeListing.photos ?? []}
                  href={`/listings/${activeListing.id}/detail`}
                />
              </div>

              {/* Info */}
              <div className="flex-1 p-4 relative">
                <div className="absolute right-3 top-3">
                  <FavoriteButton listingId={activeListing.id} />
                </div>

                <div className="flex flex-wrap gap-1.5 mb-1.5">
                  {activeListing.featured && <FeaturedBadge />}
                  {activeListing.verified && <VerifiedBadge />}
                </div>

                {/* Clickable title → full detail page */}
                <Link
                  href={`/listings/${activeListing.id}/detail`}
                  className="group block pr-8"
                >
                  <p className="text-xs text-ink-soft font-medium">{roomLabel}</p>
                  <h2 className="font-semibold text-ink text-base leading-snug mt-0.5 group-hover:underline line-clamp-2">
                    {activeListing.title}
                  </h2>
                  <p className="mt-1 text-sm text-ink-soft line-clamp-2 leading-relaxed">
                    {activeListing.description}
                  </p>
                  <p className="mt-1.5 text-xs text-ink-soft">
                    {activeListing.distanceToCampus} km du campus le plus proche · {activeListing.furnished ? 'Meublé' : 'Non meublé'}
                  </p>

                  <div className="mt-3 flex items-end justify-between">
                    <p className="text-ink">
                      <span className="font-bold text-lg">{activeListing.pricePerMonth} DT</span>
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
              <p className="font-semibold text-ink text-sm mb-1">Autres annonces dans la zone</p>
              <p className="text-xs text-ink-soft mb-4">Cliquez pour afficher directement les détails</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-7">
                {similarListings.map((item, i) => (
                  <div
                    key={item.id}
                    onClick={(e) => {
                      if (!e.metaKey && !e.ctrlKey) {
                        e.preventDefault();
                        handleSelectListing(item.id);
                      }
                    }}
                    className="cursor-pointer transition-transform hover:scale-[1.01]"
                  >
                    <ListingCard listing={item} index={i} />
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      {/* ── RIGHT: sticky map ─────────────────────────── */}
      <div className="hidden lg:flex w-[50%] shrink-0 h-full items-center justify-center p-6 bg-sand/10 border-l border-sand">
        <div className="w-full max-w-[650px] aspect-square rounded-3xl overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-sand">
          <MapDisplay
            locations={mapLocations}
            hoveredLocationId={activeListing.id}
            selectedLocationId={activeListing.id}
            onLocationSelect={handleSelectListing}
            showPopups={false}
            flyToLat={activeListing.lat}
            flyToLng={activeListing.lng}
            flyToZoom={15}
          />
        </div>
      </div>
    </div>
  );
}
