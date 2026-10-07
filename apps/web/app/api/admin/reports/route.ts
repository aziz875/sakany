import { NextRequest, type NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole, success, badRequest } from '@/lib/auth-helpers';
import { withApiHandler } from '@/lib/api-handler';
import { UserRole } from '@sakany/shared';
import { z } from 'zod';

const updateReportStatusSchema = z.object({
  reportId: z.string().min(1, 'ID de signalement requis.'),
  status: z.enum(['PENDING', 'REVIEWED', 'RESOLVED'], 'Statut invalide.'),
});

async function getHandler(req: NextRequest): Promise<NextResponse> {
  await requireRole(req, UserRole.ADMIN);

  const reports = await prisma.report.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      reporter: { select: { id: true, fullName: true, email: true, phone: true } },
      listing: { select: { id: true, title: true, pricePerMonth: true, verified: true } },
    },
  });

  return success(reports);
}

async function patchHandler(req: NextRequest): Promise<NextResponse> {
  await requireRole(req, UserRole.ADMIN);

  const body = await req.json();
  const parsed = updateReportStatusSchema.parse(body);

  const report = await prisma.report.update({
    where: { id: parsed.reportId },
    data: { status: parsed.status },
    include: {
      reporter: { select: { id: true, fullName: true, email: true } },
      listing: { select: { id: true, title: true } },
    },
  });

  return success(report);
}

export const GET = withApiHandler(getHandler as Parameters<typeof withApiHandler>[0]);
export const PATCH = withApiHandler(patchHandler as Parameters<typeof withApiHandler>[0]);
