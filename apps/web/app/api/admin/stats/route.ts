import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth-helpers';
import { UserRole } from '@sakany/shared';

export async function GET(req: NextRequest) {
  try {
    await requireRole(req, UserRole.ADMIN);
    
    const [userCount, listingCount, reportCount] = await Promise.all([
      prisma.user.count(),
      prisma.listing.count(),
      prisma.report.count({ where: { status: 'PENDING' } })
    ]);

    return NextResponse.json({
      userCount,
      listingCount,
      pendingReports: reportCount
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: err.__httpStatus || 500 });
  }
}
