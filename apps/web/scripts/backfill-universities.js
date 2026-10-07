/**
 * One-time script to backfill ListingUniversity records for all existing listings.
 * Run with: node scripts/backfill-universities.js
 */
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

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const MAX_DISTANCE_KM = 15;

function haversineDistanceKm(lat1, lng1, lat2, lng2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function main() {
  const universities = await prisma.university.findMany();
  const listings = await prisma.listing.findMany({
    select: { id: true, lat: true, lng: true },
  });

  console.log(`Processing ${listings.length} listings against ${universities.length} universities...`);

  let created = 0;
  for (const listing of listings) {
    for (const uni of universities) {
      const dist = Math.round(haversineDistanceKm(listing.lat, listing.lng, uni.lat, uni.lng) * 10) / 10;
      if (dist <= MAX_DISTANCE_KM) {
        try {
          await prisma.listingUniversity.upsert({
            where: {
              listingId_universityId: {
                listingId: listing.id,
                universityId: uni.id,
              },
            },
            update: { distanceKm: dist },
            create: {
              listingId: listing.id,
              universityId: uni.id,
              distanceKm: dist,
            },
          });
          created++;
        } catch (err) {
          // Skip on error (e.g. duplicate)
        }
      }
    }

    // Also update distanceToCampus to closest university
    const closest = universities
      .map((uni) => haversineDistanceKm(listing.lat, listing.lng, uni.lat, uni.lng))
      .sort((a, b) => a - b)[0];
    if (closest !== undefined) {
      await prisma.listing.update({
        where: { id: listing.id },
        data: { distanceToCampus: Math.round(closest * 10) / 10 },
      });
    }
  }

  console.log(`Done. Created/updated ${created} listing-university links.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
