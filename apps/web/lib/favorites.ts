import { apiFetch, authHeaders } from './api';

const FAVORITES_KEY = 'sakany_favorites';

export function getFavoriteListingIds(): string[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

export function setFavoriteListingIds(ids: string[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(ids));
}

export function isListingFavorite(listingId: string) {
  return getFavoriteListingIds().includes(listingId);
}

export async function toggleFavoriteListingId(listingId: string, token?: string | null) {
  const current = getFavoriteListingIds();
  const isCurrentlyFavorite = current.includes(listingId);
  
  const next = isCurrentlyFavorite
    ? current.filter((id) => id !== listingId)
    : [...current, listingId];
    
  setFavoriteListingIds(next);
  
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('sakany:favoriteschange'));
  }
  
  if (token) {
    try {
      if (isCurrentlyFavorite) {
        await apiFetch(`/favorites?listingId=${listingId}`, {
          method: 'DELETE',
          headers: authHeaders(token),
        });
      } else {
        await apiFetch('/favorites', {
          method: 'POST',
          headers: authHeaders(token),
          body: JSON.stringify({ listingId }),
        });
      }
    } catch (err) {
      console.error('Failed to sync favorite with server', err);
    }
  }
  
  return next;
}

export async function syncFavoritesToServer(token: string) {
  if (typeof window === 'undefined') return;
  
  try {
    const localFavorites = getFavoriteListingIds();
    const serverFavorites = await apiFetch<string[]>('/favorites/batch', {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ listingIds: localFavorites })
    });
    
    if (Array.isArray(serverFavorites)) {
      setFavoriteListingIds(serverFavorites);
      window.dispatchEvent(new Event('sakany:favoriteschange'));
    }
  } catch (err) {
    // Non-critical background sync error
    console.warn('Background sync favorites skipped:', err);
  }
}

