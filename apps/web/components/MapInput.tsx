'use client';

import dynamic from 'next/dynamic';

const MapInputInner = dynamic(() => import('./MapInputInner'), {
  ssr: false,
  loading: () => (
    <div className="flex h-[350px] w-full items-center justify-center rounded-2xl border border-sand bg-sand/30">
      <p className="text-sm text-ink-soft font-medium">Chargement de la carte interactive...</p>
    </div>
  ),
});

export interface MapInputProps {
  defaultLat?: number;
  defaultLng?: number;
  onPositionChange?: (pos: { lat: number; lng: number }) => void;
}

export function MapInput(props: MapInputProps) {
  return <MapInputInner {...props} />;
}
