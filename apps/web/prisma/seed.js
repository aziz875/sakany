const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });
dotenv.config();

const bcrypt = require('bcrypt');
const { PrismaClient, RoomType, UserRole } = require('@prisma/client');
const { randomUUID } = require('node:crypto');

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('password123', 10);

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

  const listings = [
    {
      id: randomUUID(),
      title: "Studio lumineux a 5 min d'ESPRIT",
      description:
        'Studio meuble, calme, proche des lignes de bus. Ideal pour un etudiant en stage ou en alternance. Cuisine equipee, connexion fibre incluse.',
      lat: 36.9012,
      lng: 10.1921,
      distanceToCampus: 0.6,
      pricePerMonth: 450,
      roomType: RoomType.STUDIO,
      furnished: true,
      verified: true,
      featured: true,
      photo:
        'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80',
    },
    {
      id: randomUUID(),
      title: 'Chambre en coloc - Cite El Ghazala',
      description:
        'Grande chambre dans un appartement partage avec 2 autres etudiants ESPRIT. Salon commun, lave-linge, terrasse.',
      lat: 36.8945,
      lng: 10.1789,
      distanceToCampus: 1.2,
      pricePerMonth: 280,
      roomType: RoomType.CHAMBRE_COLOC,
      furnished: true,
      verified: true,
      featured: false,
      photo:
        'https://images.unsplash.com/photo-1560448204-e02f11c2d0e2?w=800&q=80',
    },
    {
      id: randomUUID(),
      title: 'Appartement T2 - Ariana Ville',
      description:
        'T2 non meuble, parfait si tu veux amenager a ta sauce. Proche des commerces et du metro. Bail minimum 9 mois.',
      lat: 36.9055,
      lng: 10.1812,
      distanceToCampus: 2.1,
      pricePerMonth: 620,
      roomType: RoomType.APPARTEMENT,
      furnished: false,
      verified: false,
      featured: false,
      photo:
        'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80',
    },
  ];

  for (const data of listings) {
    await prisma.listing.create({
      data: {
        id: data.id,
        landlordId: landlord.id,
        title: data.title,
        description: data.description,
        lat: data.lat,
        lng: data.lng,
        distanceToCampus: data.distanceToCampus,
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
