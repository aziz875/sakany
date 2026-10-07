import { UNIVERSITY_SEED_DATA } from './constants';

export interface GeocodedPlace {
  id: string | number;
  title: string;
  subtitle: string;
  lat: number;
  lng: number;
  isUniversity?: boolean;
  type?: string;
}

/** Curated index of iconic Tunisian student neighborhoods, AFH zones & transit hubs */
const POPULAR_NEIGHBORHOODS = [
  // Cap Bon / Nabeul
  { name: 'AFH Mrezga', subtitle: 'Zone Universitaire & Résidentielle, Nabeul / Hammamet', lat: 36.4350, lng: 10.6770, tag: 'Quartier Étudiant' },
  { name: 'Mrezga (El Mrazga)', subtitle: 'Route Touristique, Nabeul / Hammamet Nord', lat: 36.4320, lng: 10.6740, tag: 'Quartier' },
  { name: 'Cité El Wafa (Mrezga)', subtitle: 'Nouvelle zone résidentielle, Nabeul', lat: 36.4390, lng: 10.6820, tag: 'Résidentiel' },
  { name: 'Nabeul Centre-Ville', subtitle: 'Avenue Habib Bourguiba / Jarre, Nabeul', lat: 36.4560, lng: 10.7350, tag: 'Centre-Ville' },
  { name: 'Hammamet Nord', subtitle: 'Zone Hôtelière & Résidentielle, Hammamet', lat: 36.4210, lng: 10.6480, tag: 'Zone Balnéaire' },
  { name: 'Hammamet Centre', subtitle: 'Médina & Centre-ville, Hammamet', lat: 36.4000, lng: 10.6170, tag: 'Centre-Ville' },

  // Grand Tunis
  { name: 'Cité El Ghazala', subtitle: 'Pôle Technologique & Résidences ESPRIT / Sup\'Com, Ariana', lat: 36.8980, lng: 10.1880, tag: 'Pôle Étudiant' },
  { name: 'Ariana Soghra / Ennakhil', subtitle: 'Proche ESPRIT, Ariana', lat: 36.8920, lng: 10.1850, tag: 'Quartier Étudiant' },
  { name: 'Centre Urbain Nord', subtitle: 'INSAT, Cliniques & Bureaux, Tunis', lat: 36.8430, lng: 10.1570, tag: 'Zone Universitaire' },
  { name: 'Ennasr 1 & Ennasr 2', subtitle: 'Avenue Hédi Nouira, Ariana', lat: 36.8620, lng: 10.1550, tag: 'Quartier Résidentiel' },
  { name: 'El Menzah (1-9)', subtitle: 'Tunis / Ariana', lat: 36.8370, lng: 10.1700, tag: 'Quartier' },
  { name: 'El Manar 1 & 2', subtitle: 'Campus Universitaire El Manar, Tunis', lat: 36.8270, lng: 10.1660, tag: 'Campus & Résidences' },
  { name: 'Les Berges du Lac 1', subtitle: 'Ambassades & Résidences, Tunis', lat: 36.8320, lng: 10.2310, tag: 'Zone d\'Affaires' },
  { name: 'Les Berges du Lac 2', subtitle: 'SMU, Dauphine & Entreprises, Tunis', lat: 36.8390, lng: 10.2470, tag: 'Zone d\'Affaires' },
  { name: 'Jardins de Carthage', subtitle: 'Résidences modernes, Tunis', lat: 36.8500, lng: 10.3050, tag: 'Résidentiel' },
  { name: 'Carthage (Présidence / Dermech)', subtitle: 'IHEC Carthage, Banlieue Nord', lat: 36.8530, lng: 10.3310, tag: 'Banlieue Nord' },
  { name: 'Sidi Bou Saïd', subtitle: 'ENAU, Village pittoresque', lat: 36.8700, lng: 10.3420, tag: 'Banlieue Nord' },
  { name: 'La Marsa / Marsa Plage', subtitle: 'Banlieue Nord de Tunis', lat: 36.8780, lng: 10.3250, tag: 'Banlieue Nord' },
  { name: 'Campus Universitaire Manouba', subtitle: 'ISAMM, ESC, ENSI, ISCAE, Manouba', lat: 36.8085, lng: 10.0945, tag: 'Grand Campus' },
  { name: 'Le Bardo', subtitle: 'ISG Tunis, Musée du Bardo, Tunis', lat: 36.8090, lng: 10.1370, tag: 'Quartier' },
  { name: 'Montfleury / Bab Alioua', subtitle: 'ESSECT Tunis, Proche Centre-Ville', lat: 36.7930, lng: 10.1610, tag: 'Quartier' },
  { name: 'Bab Saadoun', subtitle: 'Faculté de Médecine, Hôpitaux, Tunis', lat: 36.7990, lng: 10.1650, tag: 'Quartier Médical' },
  { name: 'Radès Médina / Plage', subtitle: 'ISET Radès, Stade Olympique, Ben Arous', lat: 36.7680, lng: 10.2780, tag: 'Banlieue Sud' },
  { name: 'Bir El Bey / Borj Cédria', subtitle: 'Tunis Business School (TBS), Ben Arous', lat: 36.6570, lng: 10.3950, tag: 'Pôle Tech Sud' },

  // Sahel (Sousse, Monastir, Mahdia)
  { name: 'Hammam Sousse / Plage', subtitle: 'IHEC Sousse, ISITCom, Route Touristique', lat: 35.8580, lng: 10.5970, tag: 'Zone Universitaire' },
  { name: 'Sahloul (1, 2, 3, 4)', subtitle: 'Hôpital Sahloul, ISG Sousse, Sousse', lat: 35.8350, lng: 10.6050, tag: 'Quartier Étudiant' },
  { name: 'Khezama Est & Ouest', subtitle: 'Zone animée, Cafés & Résidences, Sousse', lat: 35.8450, lng: 10.6200, tag: 'Quartier Résidentiel' },
  { name: 'Cité Riadh - Sousse', subtitle: 'Droit, FSEG, ISET Sousse', lat: 35.8120, lng: 10.6060, tag: 'Campus Riadh' },
  { name: 'Port El Kantaoui', subtitle: 'Marina & Zone Touristique, Sousse', lat: 35.8920, lng: 10.5980, tag: 'Zone Côtière' },
  { name: 'Monastir Centre / Faculté', subtitle: 'Pharmacie, Médecine Dentaire, ENIM', lat: 35.7650, lng: 10.8110, tag: 'Pôle Médical' },
  { name: 'Skanes - Monastir', subtitle: 'Zone Résidentielle et Hôtelière, Monastir', lat: 35.7720, lng: 10.7850, tag: 'Résidentiel' },
  { name: 'Mahdia Hiboun / Corniche', subtitle: 'FSEG Mahdia, ISET, Zone Universitaire', lat: 35.5150, lng: 11.0350, tag: 'Zone Côtière' },

  // Sfax
  { name: 'Route de Soukra - Sfax', subtitle: 'ENIS, FSS, Cité Universitaire km 3.5, Sfax', lat: 34.7300, lng: 10.7220, tag: 'Pôle Ingénieurs' },
  { name: 'Route de l\'Aéroport - Sfax', subtitle: 'FSEG, FDPS, IHEC Sfax km 4', lat: 34.7400, lng: 10.7560, tag: 'Pôle Éco/Droit' },
  { name: 'Route Menzel Chaker - Sfax', subtitle: 'ISIMS, ISGI, IPEIS Sfax', lat: 34.7320, lng: 10.7300, tag: 'Pôle Informatique' },
  { name: 'Route Gremda - Sfax', subtitle: 'ISBA Sfax, Cafés & Commerces', lat: 34.7380, lng: 10.7480, tag: 'Quartier Résidentiel' },
  { name: 'Sakiet Ezzit - Sfax', subtitle: 'Technopôle Sfax, Banlieue Nord', lat: 34.7950, lng: 10.7720, tag: 'Technopôle' },
  { name: 'Sfax Centre-Ville (Bab Bhar / Trocadéro)', subtitle: 'Gare SNCFT, Centre historique, Sfax', lat: 34.7400, lng: 10.7600, tag: 'Centre-Ville' },

  // Bizerte
  { name: 'Zarzouna - Bizerte', subtitle: 'Faculté des Sciences FSB, Pont Mobile', lat: 37.2620, lng: 9.8780, tag: 'Campus FSB' },
  { name: 'Menzel Abderrahmane', subtitle: 'ISET Bizerte, Lac de Bizerte', lat: 37.2590, lng: 9.8860, tag: 'Zone Universitaire' },
];

/**
 * Multi-layer Tunisia Geocoding Search Engine:
 * 1. Instant match against all 114+ Tunisian Universities, Faculties & Institutes (0ms)
 * 2. Instant match against popular Tunisian Student Neighborhoods & AFH Developments (0ms)
 * 3. High-speed Elasticsearch-powered Photon Geocoder (Komoot/OSM) with Tunisia bias
 * 4. OpenStreetMap Nominatim fallback
 */
export async function searchTunisiaLocations(query: string, signal?: AbortSignal): Promise<GeocodedPlace[]> {
  const clean = query.trim();
  if (!clean || clean.length < 2) return [];

  const normalized = clean
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  const results: GeocodedPlace[] = [];

  // ── Layer 1: Instant University Matching ──────────────────────────
  const universityMatches: GeocodedPlace[] = UNIVERSITY_SEED_DATA.filter((u) => {
    const target = `${u.name} ${u.shortName || ''}`
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
    return target.includes(normalized) || normalized.includes((u.shortName || '').toLowerCase());
  }).map((u, idx) => ({
    id: `uni-${idx}-${u.name}`,
    title: `🎓 ${u.shortName || u.name}`,
    subtitle: u.name,
    lat: u.lat,
    lng: u.lng,
    isUniversity: true,
    type: 'university',
  }));

  results.push(...universityMatches);

  // ── Layer 2: Popular Neighborhoods & AFH Zones ────────────────────
  const neighborhoodMatches: GeocodedPlace[] = POPULAR_NEIGHBORHOODS.filter((n) => {
    const target = `${n.name} ${n.subtitle} ${n.tag}`
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
    return target.includes(normalized) || normalized.split(' ').some((word) => word.length >= 3 && target.includes(word));
  }).map((n, idx) => ({
    id: `nh-${idx}-${n.name}`,
    title: `📍 ${n.name}`,
    subtitle: `${n.tag} · ${n.subtitle}`,
    lat: n.lat,
    lng: n.lng,
    isUniversity: false,
    type: 'neighborhood',
  }));

  for (const n of neighborhoodMatches) {
    const dup = results.some((r) => Math.abs(r.lat - n.lat) < 0.003 && Math.abs(r.lng - n.lng) < 0.003);
    if (!dup) results.push(n);
  }

  // ── Layer 3: Photon API (Elasticsearch + OSM) ───────────────────
  try {
    const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(
      clean
    )}&lat=36.8&lon=10.2&limit=6`;

    const res = await fetch(photonUrl, { signal });
    if (res.ok) {
      const data = await res.json();
      if (data.features && Array.isArray(data.features)) {
        for (const feature of data.features) {
          const props = feature.properties || {};
          const geom = feature.geometry || {};
          const coords = geom.coordinates; // [lng, lat]

          if (Array.isArray(coords) && coords.length >= 2) {
            const lng = coords[0];
            const lat = coords[1];

            // Build human-friendly label
            const name = props.name || props.street || props.city || 'Lieu';
            const subParts = [props.street, props.district, props.city, props.state, props.postcode]
              .filter(Boolean)
              .filter((p, i, arr) => arr.indexOf(p) === i && p !== name);
            const subtitle = subParts.join(', ') || 'Tunisie';

            const placeId = props.osm_id || `photon-${lat}-${lng}`;

            // Deduplicate with universities & neighborhoods
            const duplicate = results.some(
              (r) => Math.abs(r.lat - lat) < 0.003 && Math.abs(r.lng - lng) < 0.003
            );

            if (!duplicate) {
              results.push({
                id: placeId,
                title: `📍 ${name}`,
                subtitle,
                lat,
                lng,
                isUniversity: false,
                type: props.osm_value || props.type,
              });
            }
          }
        }
      }
    }
  } catch (err: any) {
    if (err?.name === 'AbortError') throw err;
  }

  // ── Layer 4: Nominatim Fallback if needed ────────────────────────
  if (results.length < 3) {
    try {
      const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&accept-language=fr&countrycodes=tn&q=${encodeURIComponent(
        clean
      )}&limit=4`;

      const res = await fetch(nominatimUrl, { signal });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          for (const item of data) {
            const lat = parseFloat(item.lat);
            const lng = parseFloat(item.lon);
            const parts = (item.display_name || '').split(',').map((p: string) => p.trim());
            const title = parts[0] || 'Lieu';
            const subtitle = parts.slice(1, 4).join(', ');

            const duplicate = results.some(
              (r) => Math.abs(r.lat - lat) < 0.003 && Math.abs(r.lng - lng) < 0.003
            );

            if (!duplicate) {
              results.push({
                id: item.place_id,
                title: `📍 ${title}`,
                subtitle,
                lat,
                lng,
                isUniversity: false,
              });
            }
          }
        }
      }
    } catch {
      // ignore fallback error
    }
  }

  return results.slice(0, 8);
}
