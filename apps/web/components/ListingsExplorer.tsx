'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Listing, University, MapBounds, RoomType, ROOM_TYPE_LABELS } from '@sakany/shared';
import { ListingCard } from './ListingCard';
import { MapDisplay, MapBoundsData, MapLocation } from './MapDisplay';
import { FriendlyEmptyState } from './FriendlyEmptyState';
import { Skeleton } from './Skeleton';
import { apiFetch } from '@/lib/api';
import { ROOM_TYPE_OPTIONS, UNIVERSITY_SEED_DATA } from '@/lib/constants';
import {
  Search,
  GraduationCap,
  X,
  SlidersHorizontal,
  ChevronDown,
  MapPin,
  Loader2,
  Sparkles,
  Map,
  List,
  Check,
  Building2,
  Euro,
  RotateCcw
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────
interface ListingsResponse {
  listings: Listing[];
  total: number;
  hasMore: boolean;
}

interface FilterState {
  universityId?: string;
  maxPrice?: string;
  roomType?: string;
  furnished?: string;
  verifiedOnly?: string;
  query?: string;
}

// ── Debounce utility ───────────────────────────────────────────────
function useDebouncedCallback<T extends (...args: any[]) => void>(
  callback: T,
  delayMs: number
): T {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return useCallback(
    ((...args: any[]) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => callbackRef.current(...args), delayMs);
    }) as T,
    [delayMs]
  );
}

// ── Featured Top Universities for quick access chips ───────────────
const POPULAR_UNIVERSITIES = [
  'ESPRIT',
  'INSAT',
  'IHEC Carthage',
  'ENIT',
  'FST',
  'TBS',
  'ISAMM',
  'IHEC Sousse',
  'ENIS Sfax'
];

export function ListingsExplorer() {
  // ── State ────────────────────────────────────────────────────────
  const [listings, setListings] = useState<Listing[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const [universities, setUniversities] = useState<University[]>([]);
  const [selectedUniversity, setSelectedUniversity] = useState<University | null>(null);

  const [bounds, setBounds] = useState<MapBounds | null>(null);
  const [hoveredListingId, setHoveredListingId] = useState<string | null>(null);

  const [filters, setFilters] = useState<FilterState>({});
  const [showMobileMap, setShowMobileMap] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // University dropdown state
  const [uniDropdownOpen, setUniDropdownOpen] = useState(false);
  const [uniSearch, setUniSearch] = useState('');
  const uniDropdownRef = useRef<HTMLDivElement>(null);

  // Refs for request cancellation & race condition safety
  const abortRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);
  const prevParamsRef = useRef<string>('');

  const [flyTo, setFlyTo] = useState<{ lat: number; lng: number } | null>(null);

  // ── Fetch universities list on mount ─────────────────────────────
  useEffect(() => {
    async function load() {
      try {
        const data = await apiFetch<University[]>('/universities');
        setUniversities(data);
      } catch {
        // Fallback to seed constants if API fails
        const fallback = UNIVERSITY_SEED_DATA.map((u, i) => ({
          id: `seed-${i}`,
          name: u.name,
          shortName: u.shortName,
          lat: u.lat,
          lng: u.lng,
        }));
        setUniversities(fallback);
      }
    }
    load();
  }, []);

  // ── Close dropdown on click outside ──────────────────────────────
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (uniDropdownRef.current && !uniDropdownRef.current.contains(e.target as Node)) {
        setUniDropdownOpen(false);
      }
    }
    if (uniDropdownOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [uniDropdownOpen]);

  // ── Filtered universities list ───────────────────────────────────
  const filteredUniversities = useMemo(() => {
    if (!uniSearch.trim()) return universities;
    const q = uniSearch.toLowerCase().trim();
    return universities.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        (u.shortName && u.shortName.toLowerCase().includes(q))
    );
  }, [universities, uniSearch]);

  // ── Build query params string ────────────────────────────────────
  const buildParams = useCallback(
    (pageNum: number) => {
      const params = new URLSearchParams();
      if (bounds) {
        params.set('north', bounds.north.toFixed(6));
        params.set('south', bounds.south.toFixed(6));
        params.set('east', bounds.east.toFixed(6));
        params.set('west', bounds.west.toFixed(6));
      }
      if (filters.universityId) params.set('universityId', filters.universityId);
      if (filters.maxPrice) params.set('maxPrice', filters.maxPrice);
      if (filters.roomType) params.set('roomType', filters.roomType);
      if (filters.furnished) params.set('furnished', filters.furnished);
      if (filters.verifiedOnly) params.set('verifiedOnly', filters.verifiedOnly);
      if (filters.query) params.set('query', filters.query);
      params.set('page', pageNum.toString());
      params.set('pageSize', '20');
      return params.toString();
    },
    [bounds, filters]
  );

  // ── Fetch listings from API ──────────────────────────────────────
  const fetchListings = useCallback(
    async (pageNum: number, append = false) => {
      const paramString = buildParams(pageNum);

      if (!append && paramString === prevParamsRef.current) return;
      prevParamsRef.current = paramString;

      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const currentRequestId = ++requestIdRef.current;

      if (append) {
        setLoadingMore(true);
      } else if (listings.length > 0) {
        setIsUpdating(true);
      } else {
        setLoading(true);
      }
      setError(null);

      try {
        const data = await apiFetch<ListingsResponse>(
          `/listings?${paramString}`,
          { signal: controller.signal }
        );

        if (currentRequestId !== requestIdRef.current) return;

        if (append) {
          setListings((prev) => [...prev, ...data.listings]);
        } else {
          setListings(data.listings);
        }
        setTotal(data.total);
        setHasMore(data.hasMore);
        setPage(pageNum);
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
        if (currentRequestId !== requestIdRef.current) return;
        setError('Erreur lors du chargement des annonces.');
      } finally {
        if (currentRequestId === requestIdRef.current) {
          setLoading(false);
          setIsUpdating(false);
          setLoadingMore(false);
        }
      }
    },
    [buildParams, listings.length]
  );

  // ── Trigger fetch on filters or bounds change ────────────────────
  useEffect(() => {
    fetchListings(1);
  }, [bounds, filters, fetchListings]);

  // ── Handle map bounds change (debounced 300ms) ────────────────────
  const handleBoundsChange = useDebouncedCallback((newBounds: MapBoundsData) => {
    setBounds(newBounds);
  }, 300);

  // ── Handle university selection ──────────────────────────────────
  const handleSelectUniversity = useCallback((uni: University | null) => {
    setSelectedUniversity(uni);
    if (uni) {
      setFilters((prev) => ({ ...prev, universityId: uni.id }));
      setFlyTo({ lat: uni.lat, lng: uni.lng });
    } else {
      setFilters((prev) => {
        const next = { ...prev };
        delete next.universityId;
        return next;
      });
      setFlyTo(null);
    }
  }, []);

  // ── Map locations for Leaflet pins ───────────────────────────────
  const mapLocations: MapLocation[] = useMemo(
    () =>
      listings.map((l) => ({
        id: l.id,
        lat: l.lat,
        lng: l.lng,
        title: l.title,
        price: `${l.pricePerMonth} DT`,
      })),
    [listings]
  );

  // Active filters count
  const activeFiltersCount = [
    filters.maxPrice,
    filters.roomType,
    filters.furnished,
    filters.verifiedOnly,
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-whitewash text-ink flex flex-col">
      {/* ── 1. HERO & SEARCH SECTION ──────────────────────────────── */}
      <section className="bg-gradient-to-b from-sand/30 via-whitewash to-whitewash border-b border-sand/70 pt-6 pb-6 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          {/* Header titles */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-door/10 text-door text-xs font-semibold uppercase tracking-wider mb-2.5">
              <Sparkles size={13} className="text-door" />
              Recherche intelligente par université & carte
            </div>
            <h1 className="font-display text-2xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-ink">
              Trouve ton logement idéal près de ton campus
            </h1>
            <p className="mt-2 text-sm sm:text-base text-ink-soft max-w-2xl mx-auto">
              Sélectionne ton université ou explore directement la carte interactive pour afficher les logements disponibles en temps réel.
            </p>
          </div>

          {/* ── AIRBNB-STYLE FLOATING SEARCH BAR ──────────────────── */}
          <div className="max-w-4xl mx-auto">
            <div className="surface-panel rounded-full border border-sand bg-white shadow-[0_16px_40px_-16px_rgba(18,48,58,0.18)] hover:shadow-[0_20px_50px_-16px_rgba(18,48,58,0.25)] transition-all p-2 flex flex-col md:flex-row md:items-center divide-y md:divide-y-0 md:divide-x divide-sand/80 relative">

              {/* Field 1: Université */}
              <div className="relative flex-1" ref={uniDropdownRef}>
                <button
                  type="button"
                  onClick={() => setUniDropdownOpen(!uniDropdownOpen)}
                  className="w-full text-left px-5 py-2.5 rounded-full hover:bg-sand/30 transition-colors flex items-center justify-between group"
                >
                  <div className="min-w-0 pr-2">
                    <span className="block text-[11px] font-bold uppercase tracking-wider text-ink-soft group-hover:text-door transition-colors">
                      Où étudies-tu ?
                    </span>
                    <span className="block text-sm font-semibold text-ink truncate mt-0.5">
                      {selectedUniversity ? (selectedUniversity.shortName || selectedUniversity.name) : 'Toutes les universités'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 text-ink-soft">
                    {selectedUniversity ? (
                      <span
                        role="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectUniversity(null);
                        }}
                        className="p-1 hover:bg-sand rounded-full text-ink-soft hover:text-ink"
                        title="Effacer"
                      >
                        <X size={16} />
                      </span>
                    ) : (
                      <GraduationCap size={20} className="text-door group-hover:scale-110 transition-transform" />
                    )}
                  </div>
                </button>

                {/* University Dropdown Modal */}
                {uniDropdownOpen && (
                  <div className="absolute left-0 top-full mt-3 w-full sm:w-96 rounded-3xl border border-sand bg-white shadow-[0_24px_64px_-20px_rgba(18,48,58,0.3)] z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                    <div className="p-3.5 border-b border-sand/60 bg-sand/15">
                      <div className="flex items-center gap-2 rounded-2xl bg-white border border-sand px-3 py-2">
                        <Search size={16} className="text-door shrink-0" />
                        <input
                          type="text"
                          value={uniSearch}
                          onChange={(e) => setUniSearch(e.target.value)}
                          placeholder="Rechercher (ex: ESPRIT, INSAT, IHEC...)"
                          className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-soft/60 font-medium"
                          autoFocus
                        />
                        {uniSearch && (
                          <button type="button" onClick={() => setUniSearch('')} className="text-ink-soft hover:text-ink">
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="max-h-72 overflow-y-auto py-1.5 divide-y divide-sand/30">
                      {/* Option: All universities */}
                      <button
                        type="button"
                        onClick={() => {
                          handleSelectUniversity(null);
                          setUniDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-sand/30 transition-colors ${!selectedUniversity ? 'bg-door/10 text-door font-bold' : 'text-ink font-medium'
                          }`}
                      >
                        <span className="flex items-center gap-2.5">
                          <Building2 size={16} className="text-door" />
                          Toute la Tunisie (toutes les universités)
                        </span>
                        {!selectedUniversity && <Check size={16} className="text-door" />}
                      </button>

                      {filteredUniversities.length === 0 ? (
                        <p className="px-4 py-8 text-center text-sm text-ink-soft">
                          Aucune université trouvée pour &quot;{uniSearch}&quot;
                        </p>
                      ) : (
                        filteredUniversities.map((uni) => {
                          const isSelected = selectedUniversity?.id === uni.id || selectedUniversity?.name === uni.name;
                          return (
                            <button
                              key={uni.id || uni.name}
                              type="button"
                              onClick={() => {
                                handleSelectUniversity(uni);
                                setUniDropdownOpen(false);
                                setUniSearch('');
                              }}
                              className={`w-full flex items-center justify-between px-4 py-3 text-left text-sm hover:bg-sand/30 transition-colors ${isSelected ? 'bg-door/10 text-door font-bold' : 'text-ink'
                                }`}
                            >
                              <div className="flex items-start gap-2.5 min-w-0">
                                <MapPin size={16} className="text-door shrink-0 mt-0.5" />
                                <div className="min-w-0">
                                  <p className="truncate font-semibold">{uni.shortName || uni.name}</p>
                                  {uni.shortName && uni.shortName !== uni.name && (
                                    <p className="truncate text-xs text-ink-soft">{uni.name}</p>
                                  )}
                                </div>
                              </div>
                              {isSelected && <Check size={16} className="text-door shrink-0 ml-2" />}
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Field 2: Budget Max */}
              <div className="flex-1 px-5 py-2.5 hover:bg-sand/30 transition-colors rounded-full flex flex-col justify-center">
                <label htmlFor="maxPriceInput" className="text-[11px] font-bold uppercase tracking-wider text-ink-soft">
                  Budget max
                </label>
                <div className="flex items-center gap-1 mt-0.5">
                  <input
                    id="maxPriceInput"
                    type="number"
                    value={filters.maxPrice || ''}
                    onChange={(e) => setFilters((prev) => ({ ...prev, maxPrice: e.target.value || undefined }))}
                    placeholder="Ex: 500 DT"
                    min={50}
                    step={50}
                    className="w-full bg-transparent text-sm font-semibold text-ink outline-none placeholder:text-ink-soft/60"
                  />
                  {filters.maxPrice && (
                    <span className="text-xs font-bold text-door">DT/mois</span>
                  )}
                </div>
              </div>

              {/* Field 3: Type de logement */}
              <div className="flex-1 px-5 py-2.5 hover:bg-sand/30 transition-colors rounded-full flex flex-col justify-center">
                <label htmlFor="roomTypeSelect" className="text-[11px] font-bold uppercase tracking-wider text-ink-soft">
                  Type de logement
                </label>
                <select
                  id="roomTypeSelect"
                  value={filters.roomType || ''}
                  onChange={(e) => setFilters((prev) => ({ ...prev, roomType: e.target.value || undefined }))}
                  className="w-full bg-transparent text-sm font-semibold text-ink outline-none cursor-pointer mt-0.5"
                >
                  <option value="">Tous les types</option>
                  {ROOM_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Action: Search / Filter buttons */}
              <div className="p-1 flex items-center justify-end gap-2 pr-2">
                <button
                  type="button"
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className={`p-3 rounded-full border transition-all flex items-center justify-center ${showAdvancedFilters || activeFiltersCount > 0
                      ? 'bg-ink text-white border-ink'
                      : 'bg-sand/30 text-ink-soft border-sand hover:bg-sand/60 hover:text-ink'
                    }`}
                  title="Filtres avancés"
                  aria-label="Filtres avancés"
                >
                  <SlidersHorizontal size={18} />
                </button>

                <button
                  type="button"
                  onClick={() => fetchListings(1)}
                  className="flex items-center justify-center gap-2 rounded-full bg-door hover:bg-door-deep text-white px-5 py-3 font-semibold text-sm transition-all shadow-md shadow-door/25 hover:shadow-lg hover:shadow-door/30 active:scale-95"
                >
                  <Search size={18} strokeWidth={2.5} />
                  <span className="hidden md:inline">Rechercher</span>
                </button>
              </div>

            </div>

            {/* ── ADVANCED FILTERS EXPANDED ────────────────────────── */}
            {showAdvancedFilters && (
              <div className="mt-3.5 p-4 rounded-3xl border border-sand bg-white shadow-sm flex flex-wrap items-center gap-3 animate-in fade-in duration-150">
                <label className="flex items-center gap-2 px-3.5 py-2 rounded-full border border-sand bg-sand/20 text-sm font-medium cursor-pointer hover:bg-sand/40 transition-colors">
                  <input
                    type="checkbox"
                    checked={filters.furnished === 'true'}
                    onChange={(e) => setFilters((prev) => ({ ...prev, furnished: e.target.checked ? 'true' : undefined }))}
                    className="accent-door h-4 w-4 rounded"
                  />
                  <span className="text-ink">Meublé uniquement</span>
                </label>

                <label className="flex items-center gap-2 px-3.5 py-2 rounded-full border border-sand bg-sand/20 text-sm font-medium cursor-pointer hover:bg-sand/40 transition-colors">
                  <input
                    type="checkbox"
                    checked={filters.verifiedOnly === 'true'}
                    onChange={(e) => setFilters((prev) => ({ ...prev, verifiedOnly: e.target.checked ? 'true' : undefined }))}
                    className="accent-door h-4 w-4 rounded"
                  />
                  <span className="text-ink">Vérifié Sakany ✅</span>
                </label>

                {activeFiltersCount > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setFilters({});
                      setSelectedUniversity(null);
                    }}
                    className="ml-auto flex items-center gap-1 text-xs font-semibold text-ochre hover:text-ochre-deep transition-colors"
                  >
                    <RotateCcw size={13} />
                    Réinitialiser les filtres
                  </button>
                )}
              </div>
            )}

            {/* ── QUICK POPULAR UNIVERSITY CHIPS ──────────────────── */}
            <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              <span className="text-xs font-bold text-ink-soft shrink-0 flex items-center gap-1">
                <GraduationCap size={14} className="text-door" />
                Accès rapide :
              </span>
              {POPULAR_UNIVERSITIES.map((short) => {
                const uniMatch = universities.find(
                  (u) => (u.shortName || '').toLowerCase() === short.toLowerCase() || u.name.toLowerCase().includes(short.toLowerCase())
                );
                const isSelected = selectedUniversity?.shortName?.toLowerCase() === short.toLowerCase();
                return (
                  <button
                    key={short}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        handleSelectUniversity(null);
                      } else if (uniMatch) {
                        handleSelectUniversity(uniMatch);
                      }
                    }}
                    className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 transition-all border ${isSelected
                        ? 'bg-door text-white border-door shadow-sm'
                        : 'bg-white text-ink-soft border-sand hover:border-door/40 hover:text-ink hover:bg-sand/30'
                      }`}
                  >
                    {short}
                  </button>
                );
              })}
            </div>

          </div>
        </div>
      </section>

      {/* ── 2. MAIN SPLIT SECTION: LISTINGS & MAP ─────────────────── */}
      <section className="flex-1 flex flex-col lg:flex-row overflow-hidden max-w-[1700px] w-full mx-auto">

        {/* ── LEFT COLUMN: Listings Feed ──────────────────────────── */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6">

          {/* Header Bar with results count & live indicator */}
          <div className="flex items-center justify-between pb-4 border-b border-sand/60 mb-6">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold text-ink">
                {loading ? (
                  'Recherche des logements...'
                ) : (
                  <>
                    <span className="text-door">{total}</span> logement{total !== 1 ? 's' : ''}{' '}
                    {selectedUniversity ? `près de ${selectedUniversity.shortName || selectedUniversity.name}` : 'trouvé' + (total !== 1 ? 's' : '')}
                  </>
                )}
              </h2>

              {isUpdating && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-door/10 text-door text-xs font-semibold animate-pulse">
                  <Loader2 size={12} className="animate-spin" />
                  Mise à jour zone...
                </span>
              )}
            </div>

            {/* Mobile Map toggle button */}
            <button
              type="button"
              onClick={() => setShowMobileMap(!showMobileMap)}
              className="lg:hidden flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-door text-white text-xs font-bold shadow-sm"
            >
              {showMobileMap ? <List size={14} /> : <Map size={14} />}
              {showMobileMap ? 'Voir la liste' : 'Voir la carte'}
            </button>
          </div>

          {/* Mobile Map Section (if toggled on small screens) */}
          {showMobileMap && (
            <div className="lg:hidden mb-6 h-[400px] rounded-3xl overflow-hidden border border-sand shadow-md">
              <MapDisplay
                locations={mapLocations}
                hoveredLocationId={hoveredListingId}
                onBoundsChange={handleBoundsChange}
                flyToLat={flyTo?.lat}
                flyToLng={flyTo?.lng}
                flyToZoom={14}
              />
            </div>
          )}

          {/* ── Listings Grid ─────────────────────────────────────── */}
          {loading && listings.length === 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex flex-col space-y-3">
                  <Skeleton className="aspect-[4/3] w-full rounded-2xl" />
                  <Skeleton className="h-5 w-3/4 rounded-full" />
                  <Skeleton className="h-4 w-1/2 rounded-full" />
                  <Skeleton className="h-5 w-1/3 rounded-full" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="surface-panel rounded-3xl border border-dashed border-sand p-10 text-center">
              <p className="font-display text-lg text-ink font-semibold">{error}</p>
              <button
                type="button"
                onClick={() => fetchListings(1)}
                className="btn-primary mt-4"
              >
                Réessayer
              </button>
            </div>
          ) : listings.length === 0 ? (
            <FriendlyEmptyState
              title="Aucun logement trouvé dans cette zone"
              description={
                selectedUniversity
                  ? `Aucun logement ne correspond à vos critères près de ${selectedUniversity.shortName || selectedUniversity.name}. Déplacez ou dézoomez la carte pour élargir la zone de recherche.`
                  : "Déplacez ou dézoomez la carte interactive pour découvrir des logements disponibles dans d'autres zones."
              }
              actionLabel="Réinitialiser les filtres"
              actionHref="#"
            />
          ) : (
            <>
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3">
                {listings.map((listing, i) => (
                  <div
                    key={listing.id}
                    onMouseEnter={() => setHoveredListingId(listing.id)}
                    onMouseLeave={() => setHoveredListingId(null)}
                    className="transition-transform duration-200"
                  >
                    <ListingCard
                      listing={listing}
                      index={i}
                      selectedUniversity={
                        selectedUniversity
                          ? { id: selectedUniversity.id, name: selectedUniversity.shortName || selectedUniversity.name }
                          : undefined
                      }
                    />
                  </div>
                ))}
              </div>

              {/* Load More Button */}
              {hasMore && (
                <div className="mt-10 mb-8 text-center">
                  <button
                    type="button"
                    onClick={() => !loadingMore && fetchListings(page + 1, true)}
                    disabled={loadingMore}
                    className="btn-secondary px-8 py-3.5 shadow-sm font-semibold inline-flex items-center gap-2"
                  >
                    {loadingMore ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Chargement...
                      </>
                    ) : (
                      'Afficher plus de logements'
                    )}
                  </button>
                </div>
              )}
            </>
          )}

        </div>

        {/* ── RIGHT COLUMN: Interactive Leaflet Map (Desktop) ─────── */}
        <div className="hidden lg:block w-[48%] xl:w-[50%] shrink-0 h-[calc(100vh-140px)] sticky top-[72px] p-4 pl-0">
          <div className="h-full w-full rounded-3xl overflow-hidden border border-sand shadow-[0_12px_40px_rgba(18,48,58,0.12)] relative">

            {/* Map Top Floating Notification */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 bg-white/95 backdrop-blur-md px-4 py-2 rounded-full border border-sand shadow-md flex items-center gap-2 text-xs font-semibold text-ink pointer-events-none">
              <MapPin size={13} className="text-door" />
              <span>Déplacez la carte pour actualiser les annonces</span>
            </div>

            <MapDisplay
              locations={mapLocations}
              hoveredLocationId={hoveredListingId}
              onBoundsChange={handleBoundsChange}
              flyToLat={flyTo?.lat}
              flyToLng={flyTo?.lng}
              flyToZoom={14}
            />
          </div>
        </div>

      </section>
    </div>
  );
}
