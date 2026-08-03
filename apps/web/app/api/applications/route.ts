import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, success, forbidden } from '@/lib/auth-helpers';

// GET /api/applications
export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);

  if (!user || user.role !== 'LANDLORD') {
    return forbidden('Accès réservé aux propriétaires.');
  }

  try {
    const applications = await prisma.application.findMany({
      where: {
        listing: {
          landlordId: user.id
        }
      },
      include: {
        student: {
          select: { id: true, fullName: true, email: true, phone: true }
        },
        listing: {
          select: { id: true, title: true, pricePerMonth: true, roomType: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return success(applications);
  } catch (err: any) {
    console.error('Error fetching applications:', err);
    return forbidden('Erreur lors de la récupération des candidatures.');
  }
}
