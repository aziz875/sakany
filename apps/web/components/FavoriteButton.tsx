'use client';

import { useEffect, useState } from 'react';
import { getFavoriteListingIds, toggleFavoriteListingId } from '@/lib/favorites';

interface FavoriteButtonProps {
  listingId: string;
  className?: string;
  showLabel?: boolean;
}

export function FavoriteButton({ listingId, className = '', showLabel = false }: FavoriteButtonProps) {
  const [mounted, setMounted] = useState(false);
  const [favorite, setFavorite] = useState(false);

  useEffect(() => {
    setFavorite(getFavoriteListingIds().includes(listingId));
    setMounted(true);
  }, [listingId]);

  function handleToggle() {
    const next = toggleFavoriteListingId(listingId);
    setFavorite(next.includes(listingId));
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium transition ${
        favorite ? 'border-door bg-rose-50 text-door' : 'border-sand bg-white text-ink-soft hover:border-door hover:text-door'
      } ${className}`}
      aria-pressed={mounted && favorite}
      aria-label={favorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
    >
      <span aria-hidden>{favorite ? 'Saved' : 'Save'}</span>
      {showLabel && <span>{favorite ? 'Sauvegardé' : 'Sauvegarder'}</span>}
    </button>
  );
}
