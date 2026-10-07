import { ROOM_TYPE_LABELS, RoomType } from '@sakany/shared';

export const ROOM_TYPE_OPTIONS = Object.entries(ROOM_TYPE_LABELS).map(
  ([value, label]) => ({ value: value as RoomType, label }),
);

export interface RegionGroup {
  group: string;
  cities: string[];
}

export const TUNISIAN_REGIONS_WITH_CITIES: RegionGroup[] = [
  {
    group: 'Grand Tunis',
    cities: [
      'Tunis',
      'Ariana',
      'Ben Arous',
      'Manouba',
      'La Marsa',
      'Carthage',
      'Sidi Bou Saïd',
      'Gammarth',
      'Les Berges du Lac',
      'El Menzah',
      'El Manar',
      'Ennasr',
      'Ariana Soghra / Ghazela',
      'La Soukra',
      'Le Bardo',
      'Radès',
      'Mégrine',
      'Ezzahra',
      'Hammam Lif',
      'Mornag',
      'Denden',
    ],
  },
  {
    group: 'Cap Bon & Nord',
    cities: [
      'Nabeul',
      'Hammamet',
      'Kélibia',
      'Korba',
      'Grombalia',
      'Menzel Temime',
      'Soliman',
      'Bizerte',
      'Menzel Bourguiba',
      'Ras Jebel',
      'Mateur',
      'Béja',
      'Medjez el-Bab',
      'Jendouba',
      'Tabarka',
      'Aïn Draham',
      'Le Kef',
      'Siliana',
      'Zaghouan',
    ],
  },
  {
    group: 'Sahel & Centre',
    cities: [
      'Sousse',
      'Port El Kantaoui',
      'Hammam Sousse',
      'Sahloul',
      'Khzema',
      'Msaken',
      'Monastir',
      'Ksar Hellal',
      'Moknine',
      'Mahdia',
      'El Jem',
      'Sfax',
      'Sakiet Ezzit',
      'Sakiet Eddaïer',
      'Kairouan',
      'Sidi Bouzid',
      'Kasserine',
    ],
  },
  {
    group: 'Sud & Îles',
    cities: [
      'Gabès',
      'Médenine',
      'Djerba (Houmt Souk)',
      'Djerba (Midoun)',
      'Zarzis',
      'Gafsa',
      'Tozeur',
      'Kébili / Douz',
      'Tataouine',
    ],
  },
];

export const ALL_TUNISIAN_CITIES = TUNISIAN_REGIONS_WITH_CITIES.flatMap((r) => r.cities);

export type MapLayerType = 'streets' | 'satellite' | 'osm';

export const MAP_LAYERS = {
  streets: {
    id: 'streets',
    label: 'Plan Rues HD',
    url: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Tiles style by <a href="https://www.hotosm.org/">HOT</a>',
    maxZoom: 19,
  },
  satellite: {
    id: 'satellite',
    label: 'Vue Satellite Aérienne',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    overlayUrl: 'https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
    transportOverlayUrl: 'https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri, Earthstar Geographics &copy; OpenStreetMap',
    maxZoom: 19,
  },
  osm: {
    id: 'osm',
    label: 'Standard OSM',
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
  },
} as const;

export interface UniversitySeedEntry {
  name: string;
  shortName: string;
  lat: number;
  lng: number;
}

export const UNIVERSITY_SEED_DATA: UniversitySeedEntry[] = [
  // ── GRAND TUNIS (Tunis, Ariana, Carthage, Manouba, Ben Arous) ──
  { name: 'ESPRIT (Pôle Technologique El Ghazela)', shortName: 'ESPRIT', lat: 36.8981, lng: 10.1872 },
  { name: 'INSAT (Centre Urbain Nord)', shortName: 'INSAT', lat: 36.8429, lng: 10.1560 },
  { name: 'IHEC Carthage (Carthage Présidence)', shortName: 'IHEC Carthage', lat: 36.8528, lng: 10.3306 },
  { name: 'ENIT - École Nationale d\'Ingénieurs de Tunis (Campus El Manar)', shortName: 'ENIT', lat: 36.8277, lng: 10.1652 },
  { name: 'FST - Faculté des Sciences de Tunis (Campus El Manar)', shortName: 'FST El Manar', lat: 36.8260, lng: 10.1660 },
  { name: 'FDSPT - Faculté de Droit et Sciences Politiques de Tunis (El Manar)', shortName: 'Droit El Manar', lat: 36.8285, lng: 10.1670 },
  { name: 'FSEG Tunis - Faculté des Sciences Économiques et de Gestion', shortName: 'FSEG Tunis', lat: 36.8250, lng: 10.1680 },
  { name: 'Faculté de Médecine de Tunis (Bab Saadoun)', shortName: 'Fac Médecine Tunis', lat: 36.7984, lng: 10.1647 },
  { name: 'ISG Tunis - Institut Supérieur de Gestion (Le Bardo)', shortName: 'ISG Tunis', lat: 36.8088, lng: 10.1366 },
  { name: 'ESSECT Tunis (Montfleury)', shortName: 'ESSECT', lat: 36.7929, lng: 10.1600 },
  { name: 'ESSTED Tunis - Sciences et Technologies du Design (Denden)', shortName: 'ESSTED', lat: 36.7990, lng: 10.1390 },
  { name: 'TBS - Tunis Business School (Bir El Bey)', shortName: 'TBS', lat: 36.6570, lng: 10.3950 },
  { name: 'ISAMM Manouba - Arts Multimédia (Campus Manouba)', shortName: 'ISAMM', lat: 36.8070, lng: 10.0920 },
  { name: 'ESC Manouba - École Supérieure de Commerce (Campus Manouba)', shortName: 'ESC Manouba', lat: 36.8090, lng: 10.0952 },
  { name: 'ENSI Manouba - Sciences de l\'Informatique (Campus Manouba)', shortName: 'ENSI', lat: 36.8100, lng: 10.0960 },
  { name: 'ISCAE Manouba - Comptabilité et Administration (Campus Manouba)', shortName: 'ISCAE', lat: 36.8120, lng: 10.0980 },
  { name: 'FLAHM - Faculté des Lettres et Humanités de Manouba', shortName: 'FLAH Manouba', lat: 36.8080, lng: 10.0940 },
  { name: 'IPSI - Institut de Presse et Sciences de l\'Information (Manouba)', shortName: 'IPSI', lat: 36.8115, lng: 10.0970 },
  { name: 'INAT - Institut National Agronomique de Tunisie (Menzah)', shortName: 'INAT', lat: 36.8290, lng: 10.1830 },
  { name: 'ENAU - École Nationale d\'Architecture et d\'Urbanisme (Sidi Bou Saïd)', shortName: 'ENAU', lat: 36.8710, lng: 10.3390 },
  { name: 'Sup\'Com - École Supérieure des Communications de Tunis (Ghazela)', shortName: 'Sup\'Com', lat: 36.8975, lng: 10.1880 },
  { name: 'ISET\'Com (Ghazela)', shortName: 'ISET\'Com', lat: 36.8970, lng: 10.1890 },
  { name: 'SESAME University (Ghazela)', shortName: 'SESAME', lat: 36.8965, lng: 10.1885 },
  { name: 'ISET Rades (Radès)', shortName: 'ISET Rades', lat: 36.7680, lng: 10.2780 },
  { name: 'ISET Charguia (Tunis)', shortName: 'ISET Charguia', lat: 36.8510, lng: 10.2030 },
  { name: 'Université Centrale (Tunis Centre)', shortName: 'Univ. Centrale', lat: 36.8005, lng: 10.1800 },
  { name: 'MSB / MedTech / SMU (Les Berges du Lac 2)', shortName: 'MSB MedTech', lat: 36.8350, lng: 10.2430 },
  { name: 'ULT - Université Libre de Tunis (Belvédère)', shortName: 'ULT Belvédère', lat: 36.8180, lng: 10.1780 },
  { name: 'Université Paris-Dauphine | Tunis (Lac 2)', shortName: 'Paris-Dauphine', lat: 36.8400, lng: 10.2480 },
  { name: 'Polytech Intl (Lac 1 / Ariana)', shortName: 'Polytech Intl', lat: 36.8380, lng: 10.2320 },
  { name: 'ISBAT - Beaux-Arts de Tunis (Bab El Khadra)', shortName: 'ISBAT', lat: 36.8060, lng: 10.1740 },
  { name: 'Faculté des Sciences Humaines et Sociales de Tunis (9 Avril)', shortName: '9 Avril', lat: 36.8005, lng: 10.1630 },
  { name: 'Institut Supérieur des Langues de Tunis (ISLT - Cité El Khadra)', shortName: 'ISLT', lat: 36.8240, lng: 10.1870 },
  { name: 'Institut Supérieur des Sciences Appliquées et de Technologie de Tunis (ISSAT)', shortName: 'ISSAT Tunis', lat: 36.7890, lng: 10.1760 },
  { name: 'Faculté des Sciences de Bizerte (Zarzouna)', shortName: 'FSB Bizerte', lat: 37.2610, lng: 9.8790 },
  { name: 'ISET Bizerte (Menzel Abderrahmane)', shortName: 'ISET Bizerte', lat: 37.2580, lng: 9.8850 },

  // ── NABEUL, MREZGA & CAP BON (Hyper-accurate Campus El Mrazga coordinates) ──
  { name: 'ISET Nabeul (Campus Universitaire El Mrazga / AFH Mrezga)', shortName: 'ISET Nabeul', lat: 36.4361, lng: 10.6784 },
  { name: 'FSEG Nabeul - Sciences Économiques et de Gestion (Campus El Mrazga)', shortName: 'FSEG Nabeul', lat: 36.4372, lng: 10.6795 },
  { name: 'ISLN - Institut Supérieur des Langues de Nabeul (Campus El Mrazga)', shortName: 'ISLN Nabeul', lat: 36.4385, lng: 10.6810 },
  { name: 'ISBA Nabeul - Institut Supérieur des Beaux-Arts (Mrezga / Route Hammamet)', shortName: 'ISBA Nabeul', lat: 36.4350, lng: 10.6760 },
  { name: 'Institut Supérieur des Études Appliquées en Humanités de Zaghouan', shortName: 'ISEAH Zaghouan', lat: 36.3980, lng: 10.1380 },
  { name: 'ISET Zaghouan', shortName: 'ISET Zaghouan', lat: 36.3990, lng: 10.1400 },

  // ── SOUSSE, MONASTIR & MAHDIA (SAHEL) ───────────────────────────
  { name: 'IHEC Sousse (Route de la Plage, Hammam Sousse)', shortName: 'IHEC Sousse', lat: 35.8560, lng: 10.5980 },
  { name: 'ENISO Sousse - École Nationale d\'Ingénieurs (Pôle Tech Sousse)', shortName: 'ENISO', lat: 35.8175, lng: 10.6025 },
  { name: 'Faculté de Médecine de Sousse (Avenue Mohamed Karoui)', shortName: 'Fac Médecine Sousse', lat: 35.8282, lng: 10.5980 },
  { name: 'Faculté de Droit et des Sciences Politiques de Sousse (Cité Riadh)', shortName: 'Droit Sousse', lat: 35.8110, lng: 10.6050 },
  { name: 'FSEG Sousse - Sciences Économiques et de Gestion (Erriadh)', shortName: 'FSEG Sousse', lat: 35.8120, lng: 10.6060 },
  { name: 'ISITCom Hammam Sousse (Informatique & Télécoms)', shortName: 'ISITCom', lat: 35.8600, lng: 10.5830 },
  { name: 'ISSAT Sousse - Sciences Appliquées et Technologie', shortName: 'ISSAT Sousse', lat: 35.8240, lng: 10.5950 },
  { name: 'ISG Sousse - Institut Supérieur de Gestion (Sahloul / Khezama)', shortName: 'ISG Sousse', lat: 35.8160, lng: 10.6120 },
  { name: 'ISBA Sousse - Institut Supérieur des Beaux-Arts', shortName: 'ISBA Sousse', lat: 35.8320, lng: 10.6280 },
  { name: 'ISMS Sousse - Institut Supérieur de Musique', shortName: 'ISMS Sousse', lat: 35.8300, lng: 10.6300 },
  { name: 'FLSHS Sousse - Faculté des Lettres et Sciences Humaines', shortName: 'FLSH Sousse', lat: 35.8290, lng: 10.6350 },
  { name: 'ISET Sousse (Cité Riadh)', shortName: 'ISET Sousse', lat: 35.8140, lng: 10.6080 },
  { name: 'ENIM Monastir - École Nationale d\'Ingénieurs de Monastir', shortName: 'ENIM', lat: 35.7650, lng: 10.8115 },
  { name: 'Faculté de Pharmacie de Monastir', shortName: 'Fac Pharmacie Monastir', lat: 35.7641, lng: 10.8100 },
  { name: 'Faculté de Médecine Dentaire de Monastir', shortName: 'Fac Dentaire Monastir', lat: 35.7635, lng: 10.8090 },
  { name: 'FSM - Faculté des Sciences de Monastir', shortName: 'FSM Monastir', lat: 35.7670, lng: 10.8130 },
  { name: 'ISIM Monastir - Informatique et Mathématiques', shortName: 'ISIM Monastir', lat: 35.7680, lng: 10.8140 },
  { name: 'ISBM Monastir - Institut Supérieur de Biotechnologie', shortName: 'ISBM Monastir', lat: 35.7660, lng: 10.8120 },
  { name: 'ISET Ksar Hellal', shortName: 'ISET Ksar Hellal', lat: 35.6510, lng: 10.7520 },
  { name: 'FSEG Mahdia - Sciences Économiques et de Gestion (Hiboun)', shortName: 'FSEG Mahdia', lat: 35.5060, lng: 11.0420 },
  { name: 'ISET Mahdia', shortName: 'ISET Mahdia', lat: 35.5080, lng: 11.0450 },
  { name: 'ISSAT Mahdia', shortName: 'ISSAT Mahdia', lat: 35.5090, lng: 11.0470 },

  // ── SFAX ──────────────────────────────────────────────────────
  { name: 'ENIS Sfax - École Nationale d\'Ingénieurs (Route de Soukra km 3.5)', shortName: 'ENIS Sfax', lat: 34.7265, lng: 10.7180 },
  { name: 'FSS - Faculté des Sciences de Sfax (Route de Soukra km 3.5)', shortName: 'FSS Sfax', lat: 34.7275, lng: 10.7195 },
  { name: 'FSEG Sfax - Faculté des Sciences Économiques et de Gestion (Route Aéroport)', shortName: 'FSEG Sfax', lat: 34.7390, lng: 10.7590 },
  { name: 'Faculté de Médecine de Sfax (Avenue Majida Boulila)', shortName: 'Fac Médecine Sfax', lat: 34.7465, lng: 10.7355 },
  { name: 'FDPS Sfax - Faculté de Droit de Sfax (Route de l\'Aéroport)', shortName: 'Droit Sfax', lat: 34.7410, lng: 10.7550 },
  { name: 'FLSH Sfax - Faculté des Lettres et Sciences Humaines (Route Aéroport)', shortName: 'FLSH Sfax', lat: 34.7420, lng: 10.7560 },
  { name: 'IHEC Sfax (Route de l\'Aéroport)', shortName: 'IHEC Sfax', lat: 34.7400, lng: 10.7600 },
  { name: 'ISIMS Sfax - Informatique et Multimédia (Route Menzel Chaker)', shortName: 'ISIMS Sfax', lat: 34.7340, lng: 10.7420 },
  { name: 'ISBAM Sfax - Institut Supérieur des Beaux-Arts (Route Gremda)', shortName: 'ISBA Sfax', lat: 34.7350, lng: 10.7450 },
  { name: 'ISAAS Sfax - Administration des Affaires (Route de l\'Aéroport)', shortName: 'ISAAS Sfax', lat: 34.7380, lng: 10.7520 },
  { name: 'ISGI Sfax - Gestion Industrielle (Route Menzel Chaker)', shortName: 'ISGI Sfax', lat: 34.7310, lng: 10.7250 },
  { name: 'IPEIS Sfax - Préparatoire aux Études d\'Ingénieurs (Route Menzel Chaker)', shortName: 'IPEI Sfax', lat: 34.7330, lng: 10.7280 },
  { name: 'ISBS Sfax - Institut Supérieur de Biotechnologie (Route de Soukra)', shortName: 'ISBS Sfax', lat: 34.7440, lng: 10.7360 },
  { name: 'ISET Sfax (Route de Mahdia)', shortName: 'ISET Sfax', lat: 34.7550, lng: 10.7720 },
  { name: 'ESCS Sfax - École Supérieure de Commerce de Sfax', shortName: 'ESC Sfax', lat: 34.7415, lng: 10.7580 },

  // ── AUTRES RÉGIONS (Kairouan, Gabès, Gafsa, Jendouba) ─────────
  { name: 'Faculté des Lettres et Sciences Humaines de Kairouan', shortName: 'FLSH Kairouan', lat: 35.6780, lng: 10.0980 },
  { name: 'ISIG Kairouan - Informatique et Gestion', shortName: 'ISIG Kairouan', lat: 35.6750, lng: 10.1020 },
  { name: 'ISET Kairouan', shortName: 'ISET Kairouan', lat: 35.6720, lng: 10.1050 },
  { name: 'ENIG Gabès - École Nationale d\'Ingénieurs de Gabès', shortName: 'ENIG Gabès', lat: 33.8780, lng: 10.0950 },
  { name: 'FSG - Faculté des Sciences de Gabès', shortName: 'FS Gabès', lat: 33.8760, lng: 10.0970 },
  { name: 'ISET Gabès', shortName: 'ISET Gabès', lat: 33.8750, lng: 10.0920 },
  { name: 'FSJ - Faculté des Sciences Juridiques, Éco et Gestion de Jendouba', shortName: 'FSJEG Jendouba', lat: 36.5020, lng: 8.7750 },
  { name: 'ISET Jendouba', shortName: 'ISET Jendouba', lat: 36.5050, lng: 8.7800 },
  { name: 'FSGafsa - Faculté des Sciences de Gafsa', shortName: 'FS Gafsa', lat: 34.4250, lng: 8.7840 },
  { name: 'ISET Gafsa', shortName: 'ISET Gafsa', lat: 34.4280, lng: 8.7890 },
];

/** Flat list of university names — backward compat */
export const TUNISIAN_UNIVERSITIES = [
  ...UNIVERSITY_SEED_DATA.map((u) => u.name),
  'Autre université / Faculté',
];

export const SLEEP_SCHEDULE_OPTIONS = [
  { value: 'early_bird', label: '🌅 Lève-tôt (matinal)' },
  { value: 'night_owl', label: '🌙 Couche-tard (noctambule)' },
  { value: 'flexible', label: '🔄 Rythme flexible' },
];

export const CLEANLINESS_OPTIONS = [
  { value: 'very_clean', label: '✨ Très ordonné & maniaque' },
  { value: 'moderate', label: '🧹 Propre & équilibré' },
  { value: 'relaxed', label: '😎 Décontracté / chill' },
];

export const SMOKING_OPTIONS = [
  { value: 'no_smoking', label: '🚭 Non-fumeur strict' },
  { value: 'outside_ok', label: '🚬 Fumeur (au balcon / dehors)' },
  { value: 'no_preference', label: '🤷 Pas de préférence' },
];

export const GUESTS_OPTIONS = [
  { value: 'no_guests', label: '🤫 Calme, pas de soirées' },
  { value: 'occasional', label: '👥 Invités occasionnels' },
  { value: 'anytime', label: '🎉 Amis bienvenus souvent' },
];

export const GENDER_PREFERENCE_OPTIONS = [
  { value: 'no_preference', label: 'Tous (Mixte possible)' },
  { value: 'male', label: 'Hommes uniquement' },
  { value: 'female', label: 'Femmes uniquement' },
];
