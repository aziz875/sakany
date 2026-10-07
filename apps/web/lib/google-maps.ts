import { Loader } from '@googlemaps/js-api-loader';

let loaderInstance: Loader | null = null;

export function getGoogleMapsLoader(): Loader | null {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) return null;

  if (!loaderInstance) {
    loaderInstance = new Loader({
      apiKey,
      version: 'weekly',
      libraries: ['places', 'geometry'],
      language: 'fr',
      region: 'TN',
    });
  }

  return loaderInstance;
}

export interface MapTypeStyle {
  featureType?: string;
  elementType?: string;
  stylers: Array<Record<string, string | number | boolean>>;
}

export const SAKANY_GOOGLE_MAP_STYLES: MapTypeStyle[] = [
  {
    featureType: 'administrative',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#12303a' }],
  },
  {
    featureType: 'landscape',
    elementType: 'all',
    stylers: [{ color: '#fbf8f2' }],
  },
  {
    featureType: 'poi',
    elementType: 'all',
    stylers: [{ visibility: 'simplified' }],
  },
  {
    featureType: 'poi.school',
    elementType: 'all',
    stylers: [{ visibility: 'on' }, { color: '#1f5c86' }],
  },
  {
    featureType: 'road',
    elementType: 'all',
    stylers: [{ saturation: -20 }, { lightness: 10 }],
  },
  {
    featureType: 'road.highway',
    elementType: 'all',
    stylers: [{ visibility: 'simplified' }],
  },
  {
    featureType: 'water',
    elementType: 'all',
    stylers: [{ color: '#c9e2ef' }, { visibility: 'on' }],
  },
];
