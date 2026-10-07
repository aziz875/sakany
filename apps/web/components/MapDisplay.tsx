'use client';

import dynamic from 'next/dynamic';
import type { MapLayerType } from '@/lib/constants';

const MapDisplayInner = dynamic(() => import('./MapDisplayInner'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[300px] w-full items-center justify-center rounded-2xl border border-sand bg-sand/30">
      <p className="text-sm text-ink-soft">Chargement de la carte...</p>
    </div>
  ),
});

export interface MapBoundsData {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface MapLocation {
  id: string;
  lat: number;
  lng: number;
  title?: string;
  price?: string;
  photoUrl?: string;
  roomType?: string;
  distanceLabel?: string;
  verified?: boolean;
  href?: string;
}

export type { MapLayerType };

export interface MapDisplayProps {
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

export function MapDisplay(props: MapDisplayProps) {
  return <MapDisplayInner {...props} />;
}
