'use client';

import { useEffect, useState } from 'react';
import { Listing } from '@sakany/shared';
import { ListingCard } from '@/components/ListingCard';
import { ListingGridSkeleton } from '@/components/LoadingStates';
import { FriendlyEmptyState } from '@/components/FriendlyEmptyState';
import { apiFetch } from '@/lib/api';
import { getFavoriteListingIds } from '@/lib/favorites';

async function loadListings(ids: string[]) {
  const results = await Promise.all(
    ids.map(async (id) => {
      try {
        return await apiFetch<Listing>(`/listings/${id}`);
      } catch {
        return null;
      }
    }),
  );

  return results.filter((listing): listing is Listing => listing !== null);
}

export default function FavoritesPage() {
  const [ids, setIds] = useState<string[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sync = () => setIds(getFavoriteListingIds());

    sync();
    window.addEventListener('sakany:favoriteschange', sync);
    window.addEventListener('storage', sync);

    return () => {
      window.removeEventListener('sakany:favoriteschange', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function run() {
      setLoading(true);
      const data = await loadListings(ids);
      if (active) {
        setListings(data);
        setLoading(false);
      }
    }

    if (ids.length === 0) {
      setListings([]);
      setLoading(false);
      return () => {
        active = false;
      };
    }

    run();

    return () => {
      active = false;
    };
  }, [ids]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="max-w-2xl">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-door">Favoris</p>
        <h1 className="mt-2 font-display text-3xl font-bold text-ink">Annonces sauvegardées</h1>
        <p className="mt-3 text-ink-soft">
          Retrouve ici les logements que tu as mis de côté pour les comparer plus tard.
        </p>
      </div>

      {loading ? (
        <div className="mt-8">
          <ListingGridSkeleton count={3} />
        </div>
      ) : listings.length === 0 ? (
        <div className="mt-8">
          <FriendlyEmptyState
            title="Aucun favori pour le moment"
            description="Clique sur le bouton de sauvegarde sur une annonce pour la garder ici."
            actionLabel="Découvrir les annonces"
            actionHref="/"
          />
        </div>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((listing, index) => (
            <ListingCard key={listing.id} listing={listing} index={index} />
          ))}
        </div>
      )}
    </div>
  );
}

