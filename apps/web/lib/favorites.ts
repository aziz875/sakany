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

export function toggleFavoriteListingId(listingId: string) {
  const current = getFavoriteListingIds();
  const next = current.includes(listingId)
    ? current.filter((id) => id !== listingId)
    : [...current, listingId];
  setFavoriteListingIds(next);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('sakany:favoriteschange'));
  }
  return next;
}
