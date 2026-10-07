'use client';

import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { UNIVERSITY_SEED_DATA, MAP_LAYERS, MapLayerType } from '@/lib/constants';
import { searchTunisiaLocations, GeocodedPlace } from '@/lib/geocoding';
import { createPickerMarkerIcon, createUniversityMarkerIcon } from '@/lib/map-marker-icons';
import { GraduationCap, MapPin, Sparkles, Search, X, Check, Building2, Layers } from 'lucide-react';

const DEFAULT_LAT = 36.8981; // ESPRIT
const DEFAULT_LNG = 10.1872;

function haversineDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Popular Quick Shortcuts for landlords
const POPULAR_SHORTCUTS = [
  { name: 'ISET / AFH Mrezga (Nabeul)', lat: 36.4361, lng: 10.6784 },
  { name: 'ESPRIT (Ghazela)', lat: 36.8981, lng: 10.1872 },
  { name: 'INSAT (Urbain Nord)', lat: 36.8429, lng: 10.1560 },
  { name: 'IHEC Carthage', lat: 36.8528, lng: 10.3306 },
  { name: 'Campus El Manar', lat: 36.8277, lng: 10.1652 },
  { name: 'Campus Manouba', lat: 36.8085, lng: 10.0945 },
  { name: 'IHEC Sousse (Hammam Sousse)', lat: 35.8560, lng: 10.5980 },
  { name: 'ENIS Sfax (Route de Soukra)', lat: 34.7265, lng: 10.7180 },
  { name: 'FSB Bizerte (Zarzouna)', lat: 37.2610, lng: 9.8790 },
];

function MapController({ center }: { center: L.LatLng }) {
  const map = useMap();

  useEffect(() => {
    map.invalidateSize();
    const t1 = setTimeout(() => map.invalidateSize(), 100);
    const t2 = setTimeout(() => map.invalidateSize(), 350);

    map.flyTo(center, 15, { animate: true, duration: 1.2 });

    const handleResize = () => map.invalidateSize();
    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener('resize', handleResize);
    };
  }, [center, map]);

  return null;
}

function LocationMarker({ position, setPosition }: { position: L.LatLng; setPosition: (p: L.LatLng) => void }) {
  const markerRef = useRef<L.Marker>(null);
  const [isDragging, setIsDragging] = useState(false);

  useMapEvents({
    click(e) {
      setPosition(e.latlng);
    },
  });

  const pickerIcon = useMemo(() => {
    return createPickerMarkerIcon({
      isDragging,
      label: 'Glissez vers votre bien',
    });
  }, [isDragging]);

  return (
    <Marker
      draggable={true}
      eventHandlers={{
        dragstart() {
          setIsDragging(true);
        },
        dragend() {
          setIsDragging(false);
          const marker = markerRef.current;
          if (marker != null) {
            setPosition(marker.getLatLng());
          }
        },
      }}
      position={position}
      icon={pickerIcon}
      ref={markerRef}
      zIndexOffset={2000}
    />
  );
}

interface MapInputInnerProps {
  defaultLat?: number;
  defaultLng?: number;
  onPositionChange?: (pos: { lat: number; lng: number }) => void;
}

export default function MapInputInner({ defaultLat, defaultLng, onPositionChange }: MapInputInnerProps) {
  const [position, setPosition] = useState<L.LatLng>(
    new L.LatLng(defaultLat ?? DEFAULT_LAT, defaultLng ?? DEFAULT_LNG)
  );

  const [activeLayer, setActiveLayer] = useState<MapLayerType>('streets');
  const [showUnis, setShowUnis] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GeocodedPlace[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const updatePosition = useCallback((newPos: L.LatLng) => {
    setPosition(newPos);
    if (onPositionChange) {
      onPositionChange({ lat: newPos.lat, lng: newPos.lng });
    }
  }, [onPositionChange]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    if (showDropdown) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDropdown]);

  // Live Nearby Universities calculation
  const nearbyUniversities = useMemo(() => {
    return UNIVERSITY_SEED_DATA
      .map((uni) => ({
        name: uni.shortName || uni.name,
        fullName: uni.name,
        distanceKm: Math.round(haversineDistanceKm(position.lat, position.lng, uni.lat, uni.lng) * 10) / 10,
      }))
      .filter((u) => u.distanceKm <= 15)
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, 4);
  }, [position.lat, position.lng]);

  // Multi-layer search (Photon + Universities + Curated Neighborhoods + OSM)
  useEffect(() => {
    const clean = searchQuery.trim();
    if (!clean || clean.length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    if (abortControllerRef.current) abortControllerRef.current.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const places = await searchTunisiaLocations(clean, controller.signal);
        setSearchResults(places);
        setShowDropdown(true);
      } catch (err: any) {
        if (err?.name !== 'AbortError') {
          console.error(err);
        }
      } finally {
        setIsSearching(false);
      }
    }, 180);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [searchQuery]);

  function handleSelectPlace(place: GeocodedPlace | { title: string; lat: number; lng: number }) {
    updatePosition(new L.LatLng(place.lat, place.lng));
    setSearchQuery(place.title.replace(/^[^\w\s]+/, '').trim());
    setShowDropdown(false);
  }

  const currentLayerConfig = MAP_LAYERS[activeLayer] || MAP_LAYERS.streets;

  return (
    <div ref={containerRef} className="flex flex-col gap-3 font-sans">
      {/* Search Input & University Quick Select */}
      <div className="relative z-20 space-y-2">
        <div className="relative flex items-center">
          <div className="absolute left-3.5 flex items-center justify-center text-door">
            <Search size={18} />
          </div>

          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
            placeholder="Rechercher une adresse, quartier, campus (ex: AFH Mrezga, ESPRIT, Sahloul, Ennasr...)"
            className="w-full rounded-2xl border border-sand bg-white py-3 pl-11 pr-10 text-sm font-medium text-ink shadow-[0_4px_20px_-4px_rgba(0,0,0,0.06)] transition-all duration-200 focus:border-door focus:outline-none focus:ring-4 focus:ring-door/10"
          />

          <div className="absolute right-3.5 flex items-center gap-1.5">
            {isSearching && <div className="h-4 w-4 rounded-full border-2 border-door border-t-transparent animate-spin" />}
            {searchQuery && !isSearching && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSearchResults([]);
                  setShowDropdown(false);
                }}
                className="text-ink-soft hover:text-ink"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Quick Shortcuts */}
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-ink-soft mr-1">Raccourcis populaires :</span>
          {POPULAR_SHORTCUTS.map((loc) => (
            <button
              key={loc.name}
              type="button"
              onClick={() => handleSelectPlace({ title: loc.name, lat: loc.lat, lng: loc.lng })}
              className="inline-flex items-center gap-1 rounded-full border border-sand bg-white px-2.5 py-1 text-xs font-semibold text-ink-soft hover:border-door hover:text-door hover:bg-door/5 transition-colors shadow-2xs"
            >
              <GraduationCap size={12} className="text-door" />
              {loc.name}
            </button>
          ))}
        </div>

        {/* Floating Autocomplete Dropdown */}
        {showDropdown && searchResults.length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-2 overflow-hidden rounded-2xl border border-sand/80 bg-white/95 backdrop-blur-md shadow-2xl z-40 divide-y divide-sand/40 animate-in fade-in duration-150 max-h-80 overflow-y-auto">
            {searchResults.map((place) => (
              <button
                key={place.id}
                type="button"
                onClick={() => handleSelectPlace(place)}
                className="w-full px-4 py-3 text-left transition hover:bg-sand/30 flex items-start gap-3 group"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-door/10 text-door group-hover:bg-door group-hover:text-white transition-colors mt-0.5">
                  {place.isUniversity ? <GraduationCap size={16} /> : <MapPin size={16} />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink group-hover:text-door transition-colors truncate">
                    {place.title}
                  </p>
                  <p className="text-xs text-ink-soft truncate mt-0.5">
                    {place.subtitle}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Interactive Leaflet Map Container */}
      <div className="h-[420px] w-full overflow-hidden rounded-2xl border border-sand/80 shadow-inner z-0 relative group">
        {/* Floating Layer Switcher & University Toggle */}
        <div className="absolute top-3 left-3 z-[400] flex items-center gap-1.5 rounded-full border border-sand/80 bg-white/95 p-1 backdrop-blur-md shadow-lg">
          <div className="flex items-center rounded-full bg-sand/40 p-0.5">
            <button
              type="button"
              onClick={() => setActiveLayer('streets')}
              className={`rounded-full px-2.5 py-1 text-xs font-bold transition-all ${
                activeLayer === 'streets'
                  ? 'bg-door text-white shadow-xs'
                  : 'text-ink-soft hover:text-ink'
              }`}
            >
              Plan HD
            </button>
            <button
              type="button"
              onClick={() => setActiveLayer('satellite')}
              className={`rounded-full px-2.5 py-1 text-xs font-bold transition-all ${
                activeLayer === 'satellite'
                  ? 'bg-door text-white shadow-xs'
                  : 'text-ink-soft hover:text-ink'
              }`}
            >
              Satellite
            </button>
          </div>

          <div className="h-4 w-px bg-sand/80 mx-0.5" />

          <button
            type="button"
            onClick={() => setShowUnis(!showUnis)}
            className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold transition-all ${
              showUnis
                ? 'bg-slate-900 text-sky-300 border border-sky-400/40 shadow-xs'
                : 'bg-white text-ink-soft hover:text-ink border border-sand'
            }`}
          >
            <GraduationCap size={12} className={showUnis ? 'text-sky-400' : 'text-ink-soft'} />
            <span>Facs</span>
          </button>
        </div>

        <MapContainer
          center={position}
          zoom={15}
          scrollWheelZoom={true}
          className="h-full w-full rounded-2xl"
          style={{ height: '100%', width: '100%', minHeight: '420px', zIndex: 1 }}
        >
          <TileLayer
            key={activeLayer}
            attribution={currentLayerConfig.attribution}
            url={currentLayerConfig.url}
            maxZoom={currentLayerConfig.maxZoom}
            {...('subdomains' in currentLayerConfig ? { subdomains: currentLayerConfig.subdomains as string | string[] } : {})}
          />

          {/* Satellite Labels and Roads Overlay if active */}
          {activeLayer === 'satellite' && (
            <>
              <TileLayer
                key="satellite-roads"
                attribution=""
                url={MAP_LAYERS.satellite.transportOverlayUrl}
                maxZoom={19}
                zIndex={2}
              />
              <TileLayer
                key="satellite-labels"
                attribution=""
                url={MAP_LAYERS.satellite.overlayUrl}
                maxZoom={19}
                zIndex={3}
              />
            </>
          )}

          <MapController center={position} />

          {/* ── University Markers Overlay ── */}
          {showUnis &&
            UNIVERSITY_SEED_DATA.map((uni) => {
              const uniIcon = createUniversityMarkerIcon({
                name: uni.name,
                shortName: uni.shortName,
              });

              return (
                <Marker
                  key={uni.name}
                  position={[uni.lat, uni.lng]}
                  icon={uniIcon}
                  zIndexOffset={100}
                >
                  <Popup className="sakany-property-popup" closeButton={true}>
                    <div className="p-3 w-[200px] font-sans text-ink">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-sky-600 mb-1">
                        <GraduationCap size={14} />
                        <span>Université</span>
                      </div>
                      <h4 className="font-bold text-sm text-ink leading-tight mb-1">
                        {uni.name}
                      </h4>
                      <p className="text-xs text-ink-soft">
                        {uni.lat.toFixed(4)}, {uni.lng.toFixed(4)}
                      </p>
                    </div>
                  </Popup>
                </Marker>
              );
            })}

          {/* Draggable Property Location Marker */}
          <LocationMarker position={position} setPosition={updatePosition} />
        </MapContainer>

        {/* Live Coordinate Badge */}
        <div className="absolute bottom-3 right-3 z-[400] rounded-lg border border-sand/60 bg-white/90 px-2.5 py-1 text-[11px] font-mono text-ink-soft backdrop-blur-sm shadow-xs pointer-events-none">
          Lat: {position.lat.toFixed(4)}, Lng: {position.lng.toFixed(4)}
        </div>
      </div>

      {/* Live Proximity Feedback Box */}
      <div className="rounded-2xl border border-sand bg-white p-3.5 shadow-sm">
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-door mb-2">
          <Sparkles size={14} />
          <span>Universités à proximité calculées automatiquement :</span>
        </div>

        {nearbyUniversities.length === 0 ? (
          <p className="text-xs text-ink-soft italic">
            Aucune université répertoriée dans un rayon de 15 km. Déplacez le marqueur vers votre logement.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {nearbyUniversities.map((uni, idx) => (
              <span
                key={uni.name}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                  idx === 0
                    ? 'bg-door/10 text-door border-door/30'
                    : 'bg-sand/30 text-ink border-sand'
                }`}
              >
                <GraduationCap size={13} className={idx === 0 ? 'text-door' : 'text-ink-soft'} />
                <span>{uni.name} :</span>
                <span className="font-bold">{uni.distanceKm} km</span>
                {idx === 0 && <span className="text-[10px] bg-door text-white px-1.5 py-0.2 rounded-full font-bold">Plus proche</span>}
              </span>
            ))}
          </div>
        )}
      </div>

      <p className="text-xs text-ink-soft px-1">
        📍 <strong>Astuce :</strong> Vous pouvez cliquer ou glisser le marqueur doré sur la carte pour ajuster l'emplacement exact de votre bien. Vous pouvez basculer en <strong>Satellite</strong> pour repérer votre bâtiment.
      </p>

      {/* Hidden inputs to pass coordinates to standard form submission */}
      <input type="hidden" name="lat" value={position.lat} />
      <input type="hidden" name="lng" value={position.lng} />
    </div>
  );
}
