'use client';

import { useEffect, useState } from 'react';
import { getFavoriteListingIds, toggleFavoriteListingId } from '@/lib/favorites';
import { MOTION } from '@/lib/motion';
import { useAuth } from '@/lib/auth-context';
import { useRouter, usePathname } from 'next/navigation';
import { Heart } from 'lucide-react';

interface FavoriteButtonProps {
  listingId: string;
  className?: string;
  showLabel?: boolean;
}

export function FavoriteButton({ listingId, className = '', showLabel = false }: FavoriteButtonProps) {
  const { token } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [favorite, setFavorite] = useState(false);
  const [popping, setPopping] = useState(false);

  useEffect(() => {
    setFavorite(getFavoriteListingIds().includes(listingId));
    setMounted(true);
  }, [listingId]);

  async function handleToggle(e: React.MouseEvent) {
    e.preventDefault(); // Prevent link navigation if inside a Link
    
    if (!token) {
      router.push(`/auth/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    const next = await toggleFavoriteListingId(listingId, token);
    setFavorite(next.includes(listingId));
    setPopping(true);
    window.setTimeout(() => setPopping(false), MOTION.duration.base);
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      className={`group flex items-center gap-2 transition-transform active:scale-95 ${className}`}
      aria-pressed={mounted && favorite}
      aria-label={favorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
    >
      <Heart
        size={26}
        className={`transition-all duration-300 ${
          popping ? 'scale-125' : 'scale-100 group-hover:scale-110'
        } ${
          favorite
            ? 'fill-[#FF385C] text-[#FF385C]' // Airbnb's precise pink
            : 'fill-black/40 text-white stroke-[2px]' // Transparent black fill, white stroke
        }`}
      />
      {showLabel && <span className="font-medium underline underline-offset-4 text-ink">{favorite ? 'Enregistré' : 'Enregistrer'}</span>}
    </button>
  );
}

