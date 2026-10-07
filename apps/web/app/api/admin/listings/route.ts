import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth-helpers';
import { UserRole } from '@sakany/shared';

export async function GET(req: NextRequest) {
  try {
    await requireRole(req, UserRole.ADMIN);
    
    const listings = await prisma.listing.findMany({
      select: {
        id: true,
        title: true,
        pricePerMonth: true,
        verified: true,
        createdAt: true,
        landlord: { select: { fullName: true } },
        _count: { select: { reports: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    return NextResponse.json(listings);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: err.__httpStatus || 500 });
  }
}
