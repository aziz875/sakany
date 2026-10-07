'use client';

import { useEffect, useRef, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  createListingPinIcon,
  createPricePillMarkerIcon,
  createUniversityMarkerIcon,
} from '@/lib/map-marker-icons';
import { UNIVERSITY_SEED_DATA, MAP_LAYERS, MapLayerType } from '@/lib/constants';
import { MapLocation, MapBoundsData } from './MapDisplay';
import { GraduationCap, Layers, Eye, EyeOff } from 'lucide-react';

export interface MapDisplayInnerProps {
  lat?: number;
  lng?: number;
  popupText?: string;
  locations?: MapLocation[];
  hoveredLocationId?: string | null;
  selectedLocationId?: string | null;
  showPopups?: boolean;
  showUniversityOverlay?: boolean;
  defaultLayer?: MapLayerType;
  onLocationSelect?: (locationId: string) => void;
  onBoundsChange?: (bounds: MapBoundsData) => void;
  flyToLat?: number;
  flyToLng?: number;
  flyToZoom?: number;
}

function MapBoundsFitter({ locations }: { locations: MapLocation[] }) {
  const map = useMap();
  useEffect(() => {
    if (locations && locations.length > 0) {
      const bounds = L.latLngBounds(locations.map((loc) => [loc.lat, loc.lng]));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
    }
  }, [locations, map]);
  return null;
}

/** Watches for map moveend/zoomend events and reports viewport bounds */
function BoundsWatcher({ onBoundsChange }: { onBoundsChange: (bounds: MapBoundsData) => void }) {
  const map = useMap();
  const callbackRef = useRef(onBoundsChange);
  callbackRef.current = onBoundsChange;

  useEffect(() => {
    function reportBounds() {
      const bounds = map.getBounds();
      const ne = bounds.getNorthEast();
      const sw = bounds.getSouthWest();
      callbackRef.current({
        north: ne.lat,
        south: sw.lat,
        east: ne.lng,
        west: sw.lng,
      });
    }

    const initTimer = setTimeout(reportBounds, 200);

    map.on('moveend', reportBounds);
    map.on('zoomend', reportBounds);

    return () => {
      clearTimeout(initTimer);
      map.off('moveend', reportBounds);
      map.off('zoomend', reportBounds);
    };
  }, [map]);

  return null;
}

/** Flies the map to a given location when coordinates change */
function FlyToHandler({ lat, lng, zoom }: { lat: number; lng: number; zoom: number }) {
  const map = useMap();
  const prevRef = useRef({ lat: 0, lng: 0 });

  useEffect(() => {
    if (lat !== prevRef.current.lat || lng !== prevRef.current.lng) {
      prevRef.current = { lat, lng };
      try {
        map.flyTo([lat, lng], zoom, { duration: 1.2 });
      } catch {
        map.setView([lat, lng], zoom);
      }
    }
  }, [map, lat, lng, zoom]);

  return null;
}

/** Intercepts native DOM clicks on markers for 100% reliable click detection */
function MapMarkerClickHandler({ onLocationSelect }: { onLocationSelect?: (id: string) => void }) {
  const map = useMap();
  useEffect(() => {
    if (!onLocationSelect) return;
    const container = map.getContainer();
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const markerEl = target?.closest('[data-listing-id]') as HTMLElement | null;
      if (markerEl) {
        const id = markerEl.getAttribute('data-listing-id');
        if (id) {
          e.preventDefault();
          e.stopPropagation();
          onLocationSelect(id);
        }
      }
    };
    container.addEventListener('click', handleClick, true);
    return () => {
      container.removeEventListener('click', handleClick, true);
    };
  }, [map, onLocationSelect]);
  return null;
}

function MapResizer() {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
    const t1 = setTimeout(() => map.invalidateSize(), 100);
    const t2 = setTimeout(() => map.invalidateSize(), 350);

    const handleResize = () => map.invalidateSize();
    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener('resize', handleResize);
    };
  }, [map]);
  return null;
}

export default function MapDisplayInner({
  lat,
  lng,
  popupText,
  locations,
  hoveredLocationId,
  selectedLocationId,
  showPopups = false,
  showUniversityOverlay = true,
  defaultLayer = 'streets',
  onLocationSelect,
  onBoundsChange,
  flyToLat,
  flyToLng,
  flyToZoom = 14,
}: MapDisplayInnerProps) {
  const [activeLayer, setActiveLayer] = useState<MapLayerType>(defaultLayer);
  const [showUnis, setShowUnis] = useState<boolean>(showUniversityOverlay);

  const hasMultipleLocations = locations && locations.length > 0;

  // Default to ESPRIT location if nothing provided
  const centerLat = lat ?? (hasMultipleLocations ? locations[0].lat : 36.8981);
  const centerLng = lng ?? (hasMultipleLocations ? locations[0].lng : 10.1872);
  const position = useMemo(() => new L.LatLng(centerLat, centerLng), [centerLat, centerLng]);

  const singleMarkerIcon = useMemo(() => {
    return createListingPinIcon({ title: popupText });
  }, [popupText]);

  const currentLayerConfig = MAP_LAYERS[activeLayer] || MAP_LAYERS.streets;

  return (
    <div className="h-full w-full overflow-hidden z-0 relative bg-sand/30 font-sans">
      {/* ── Floating Map Controls Bar ── */}
      <div className="absolute top-3 left-3 z-[400] flex items-center gap-1.5 rounded-full border border-sand/80 bg-white/95 p-1 backdrop-blur-md shadow-lg transition-all duration-200">
        {/* Layer Switcher */}
        <div className="flex items-center rounded-full bg-sand/40 p-0.5">
          <button
            type="button"
            onClick={() => setActiveLayer('streets')}
            className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold transition-all ${
              activeLayer === 'streets'
                ? 'bg-door text-white shadow-xs'
                : 'text-ink-soft hover:text-ink'
            }`}
            title="Plan détaillé avec rues et commerces"
          >
            <span>Plan HD</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveLayer('satellite')}
            className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold transition-all ${
              activeLayer === 'satellite'
                ? 'bg-door text-white shadow-xs'
                : 'text-ink-soft hover:text-ink'
            }`}
            title="Vue aérienne satellite haute résolution"
          >
            <span>Satellite</span>
          </button>
        </div>

        <div className="h-4 w-px bg-sand/80 mx-0.5" />

        {/* University POIs Toggle */}
        <button
          type="button"
          onClick={() => setShowUnis(!showUnis)}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold transition-all ${
            showUnis
              ? 'bg-slate-900 text-sky-300 border border-sky-400/40 shadow-xs'
              : 'bg-white text-ink-soft hover:text-ink border border-sand'
          }`}
          title="Afficher / masquer les universités et facultés sur la carte"
        >
          <GraduationCap size={13} className={showUnis ? 'text-sky-400' : 'text-ink-soft'} />
          <span>Universités</span>
          {showUnis ? (
            <span className="h-1.5 w-1.5 rounded-full bg-sky-400 animate-pulse" />
          ) : (
            <span className="h-1.5 w-1.5 rounded-full bg-sand-dark" />
          )}
        </button>
      </div>

      <MapContainer
        center={position}
        zoom={14}
        scrollWheelZoom={true}
        className="h-full w-full"
        style={{ height: '100%', width: '100%', minHeight: '300px', zIndex: 1 }}
      >
        {/* Base Tile Layer */}
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

        <MapResizer />

        {/* Global Marker Click Listener for instant responsiveness */}
        <MapMarkerClickHandler onLocationSelect={onLocationSelect} />

        {/* Bounds watcher for dynamic filtering */}
        {onBoundsChange && <BoundsWatcher onBoundsChange={onBoundsChange} />}

        {/* Fly-to handler for coordinates change */}
        {flyToLat !== undefined && flyToLng !== undefined && (
          <FlyToHandler lat={flyToLat} lng={flyToLng} zoom={flyToZoom} />
        )}

        {/* ── University POI Markers Overlay ── */}
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
                  <div className="p-3 w-[220px] font-sans text-ink">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-sky-600 mb-1">
                      <GraduationCap size={15} />
                      <span>Campus Universitaire</span>
                    </div>
                    <h4 className="font-bold text-sm text-ink leading-tight mb-1">
                      {uni.name}
                    </h4>
                    <p className="text-xs text-ink-soft">
                      Coordonnées exactes : {uni.lat.toFixed(4)}, {uni.lng.toFixed(4)}
                    </p>
                  </div>
                </Popup>
              </Marker>
            );
          })}

        {/* ── Listings Markers ── */}
        {hasMultipleLocations ? (
          <>
            {!onBoundsChange && <MapBoundsFitter locations={locations!} />}
            {locations!.map((loc) => {
              const isSelected = loc.id === selectedLocationId;
              const isHovered = loc.id === hoveredLocationId || isSelected;
              const zIndex = isSelected ? 2000 : isHovered ? 1000 : 500;
              const icon = createPricePillMarkerIcon({
                id: loc.id,
                price: loc.price,
                isHovered,
                isSelected,
                title: loc.title,
              });

              return (
                <Marker
                  key={loc.id}
                  position={[loc.lat, loc.lng]}
                  icon={icon}
                  zIndexOffset={zIndex}
                  eventHandlers={{
                    click: () => {
                      onLocationSelect?.(loc.id);
                    },
                  }}
                >
                  {showPopups && loc.title && (
                    <Popup className="sakany-property-popup" closeButton={true}>
                      <div className="w-[210px] overflow-hidden rounded-2xl bg-white font-sans text-ink">
                        {loc.photoUrl ? (
                          <div className="relative aspect-[16/10] w-full overflow-hidden bg-sand/40">
                            <img
                              src={loc.photoUrl}
                              alt={loc.title || 'Logement'}
                              className="h-full w-full object-cover"
                              loading="lazy"
                            />
                            {loc.verified && (
                              <span className="absolute top-2 left-2 inline-flex items-center gap-0.5 rounded-full bg-door/90 backdrop-blur-xs px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
                                ✓ Vérifié
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="flex aspect-[16/9] w-full items-center justify-center bg-sand/30 text-ink-soft">
                            <span className="text-xs font-semibold">Sakany</span>
                          </div>
                        )}

                        <div className="p-3">
                          {(loc.roomType || loc.distanceLabel) && (
                            <div className="text-[11px] font-bold uppercase tracking-wider text-ink-soft truncate mb-0.5">
                              {loc.roomType || ''} {loc.distanceLabel ? `· ${loc.distanceLabel}` : ''}
                            </div>
                          )}

                          {loc.title && (
                            <h4 className="font-bold text-ink text-sm leading-tight line-clamp-1 mb-1.5 hover:text-door transition-colors">
                              {loc.title}
                            </h4>
                          )}

                          <div className="flex items-center justify-between pt-2 border-t border-sand/60 mt-1">
                            <div>
                              <span className="font-extrabold text-ink text-sm">{loc.price}</span>
                              <span className="text-[10px] font-medium text-ink-soft">/mois</span>
                            </div>

                            <a
                              href={loc.href || `/listings/${loc.id}`}
                              className="inline-flex items-center gap-1 text-xs font-bold text-white bg-door hover:bg-door-deep active:scale-95 px-3 py-1.5 rounded-full transition-all shadow-xs"
                            >
                              <span>Voir</span>
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M5 12h14" />
                                <path d="m12 5 7 7-7 7" />
                              </svg>
                            </a>
                          </div>
                        </div>
                      </div>
                    </Popup>
                  )}
                </Marker>
              );
            })}
          </>
        ) : (
          lat !== undefined && lng !== undefined && (
            <Marker position={position} icon={singleMarkerIcon}>
              {popupText && <Popup>{popupText}</Popup>}
            </Marker>
          )
        )}
      </MapContainer>
    </div>
  );
}
