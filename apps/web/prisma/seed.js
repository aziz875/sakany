const fs = require('node:fs');
const path = require('node:path');

for (const envFile of ['.env.local', '.env']) {
  const envPath = path.join(__dirname, '..', envFile);
  if (!fs.existsSync(envPath)) continue;
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq);
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

const bcrypt = require('bcrypt');
const { PrismaClient, RoomType, UserRole } = require('@prisma/client');
const { randomUUID } = require('node:crypto');

const prisma = new PrismaClient();

const MAX_UNIVERSITY_DISTANCE_KM = 15;

function haversineDistanceKm(lat1, lng1, lat2, lng2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── University seed data (same as constants.ts) ───────────────────
const UNIVERSITY_SEED_DATA = [
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

  // ── AUTRES RÉGIONS ──
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

async function main() {
  const passwordHash = await bcrypt.hash('password123', 10);

  // ── Seed Universities ─────────────────────────────────────────
  console.log('Seeding universities...');
  const universityRecords = [];
  for (const uni of UNIVERSITY_SEED_DATA) {
    const record = await prisma.university.upsert({
      where: { name: uni.name },
      update: { shortName: uni.shortName, lat: uni.lat, lng: uni.lng },
      create: {
        id: randomUUID(),
        name: uni.name,
        shortName: uni.shortName,
        lat: uni.lat,
        lng: uni.lng,
      },
    });
    universityRecords.push(record);
  }
  console.log(`  → ${universityRecords.length} universities seeded.`);

  // ── Seed Users ────────────────────────────────────────────────
  const landlord = await prisma.user.upsert({
    where: { email: 'proprietaire@example.com' },
    update: {},
    create: {
      id: randomUUID(),
      fullName: 'Amine Ben Salah',
      email: 'proprietaire@example.com',
      passwordHash,
      phone: '+216 22 123 456',
      role: UserRole.LANDLORD,
      schoolVerified: false,
      isEmailVerified: true,
    },
  });

  const student = await prisma.user.upsert({
    where: { email: 'etudiant@esprit.tn' },
    update: {},
    create: {
      id: randomUUID(),
      fullName: 'Sarra Khalfallah',
      email: 'etudiant@esprit.tn',
      passwordHash,
      phone: '+216 98 765 432',
      role: UserRole.STUDENT,
      schoolVerified: true,
      isEmailVerified: true,
    },
  });

  await prisma.listing.deleteMany({
    where: { landlordId: landlord.id },
  });

  // ── Seed Listings (Grand Tunis, AFH Mrezga Nabeul, Sousse, Sfax) ──
  const listings = [
    {
      id: randomUUID(),
      title: "Studio moderne AFH Mrezga (3 min ISET & FSEG)",
      description:
        'Studio meublé haut standing situé en plein cœur de l\'AFH Mrezga, à 300m du campus universitaire (ISET Nabeul & FSEG). Climatiseur, kitchenette équipée, Wi-Fi très haut débit.',
      lat: 36.4355,
      lng: 10.6778,
      pricePerMonth: 420,
      roomType: RoomType.STUDIO,
      furnished: true,
      verified: true,
      featured: true,
      photo:
        'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80',
    },
    {
      id: randomUUID(),
      title: "Colocation étudiante S+2 - Cité El Wafa Mrezga",
      description:
        'Chambre individuelle meublée dans un grand appartement S+2 à Cité El Wafa / Mrezga. Proche de la plage, des supérettes et du campus de Mrezga. Idéal pour étudiants ISET/FSEG/ISLN.',
      lat: 36.4385,
      lng: 10.6815,
      pricePerMonth: 270,
      roomType: RoomType.CHAMBRE_COLOC,
      furnished: true,
      verified: true,
      featured: false,
      photo:
        'https://images.unsplash.com/photo-1560448204-e02f11c2d0e2?w=800&q=80',
    },
    {
      id: randomUUID(),
      title: "Studio lumineux à 5 min d'ESPRIT (Ghazela)",
      description:
        'Studio meublé, calme, proche des lignes de bus et du pôle technologique El Ghazela. Idéal pour un étudiant ESPRIT ou Sup\'Com. Cuisine équipée, fibre optique.',
      lat: 36.9012,
      lng: 10.1921,
      pricePerMonth: 450,
      roomType: RoomType.STUDIO,
      furnished: true,
      verified: true,
      featured: true,
      photo:
        'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80',
    },
    {
      id: randomUUID(),
      title: 'Chambre en coloc - Cité El Ghazala',
      description:
        'Grande chambre dans un appartement partagé avec 2 autres étudiants. Salon commun, lave-linge, terrasse et espace de travail.',
      lat: 36.8945,
      lng: 10.1789,
      pricePerMonth: 280,
      roomType: RoomType.CHAMBRE_COLOC,
      furnished: true,
      verified: true,
      featured: false,
      photo:
        'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&q=80',
    },
    {
      id: randomUUID(),
      title: 'Appartement S+1 Meublé - Sahloul 3 Sousse',
      description:
        'Superbe S+1 meublé à Sahloul 3 proche de l\'ISG Sousse et de la Faculté de Médecine. Immeuble sécurisé avec ascenseur.',
      lat: 35.8360,
      lng: 10.6070,
      pricePerMonth: 550,
      roomType: RoomType.APPARTEMENT,
      furnished: true,
      verified: true,
      featured: false,
      photo:
        'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&q=80',
    },
  ];

  for (const data of listings) {
    // Compute distances to all universities
    const nearbyUniversities = universityRecords
      .map((uni) => ({
        universityId: uni.id,
        distanceKm: Math.round(haversineDistanceKm(data.lat, data.lng, uni.lat, uni.lng) * 10) / 10,
      }))
      .filter((nu) => nu.distanceKm <= MAX_UNIVERSITY_DISTANCE_KM);

    const closestDistance = nearbyUniversities.length > 0
      ? Math.min(...nearbyUniversities.map((nu) => nu.distanceKm))
      : 0;

    await prisma.listing.create({
      data: {
        id: data.id,
        landlordId: landlord.id,
        title: data.title,
        description: data.description,
        lat: data.lat,
        lng: data.lng,
        distanceToCampus: closestDistance,
        pricePerMonth: data.pricePerMonth,
        roomType: data.roomType,
        furnished: data.furnished,
        verified: data.verified,
        featured: data.featured,
        photos: {
          create: {
            id: randomUUID(),
            url: data.photo,
            sortOrder: 0,
          },
        },
        reviews: {
          create: {
            id: randomUUID(),
            authorId: student.id,
            rating: 4,
            comment: 'Super logement, proprio reactif. Je recommande pour les etudiants ESPRIT.',
          },
        },
        nearbyUniversities: {
          create: nearbyUniversities.map((nu) => ({
            id: randomUUID(),
            universityId: nu.universityId,
            distanceKm: nu.distanceKm,
          })),
        },
      },
    });
  }

  console.log('Seed complete.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
